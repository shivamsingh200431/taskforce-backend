# Recurring Chore Engine Design

## Goal

Build a reliable recurring-chore subsystem that turns recurring templates into historical `Chore` instances while supporting workload-aware rotation, scheduler recovery, and safe operation across multiple application instances.

## 1. Core model boundary

`RecurringChoreTemplate` is the definition of future work. `Chore` is an independently stored historical occurrence.

Each generated recurring `Chore` will reference its source template and occurrence identity through:

- `recurringTemplateId`
- `occurrenceDate`
- `generationType`

The uniqueness boundary for recurring occurrences is `(recurringTemplateId, occurrenceDate)`. This is the primary idempotency guarantee.

Generated chores also copy relevant template values as a historical snapshot. Future template edits do not modify existing instances.

For ordinary one-time chores, recurring-specific fields remain null.

## 2. Recurrence engine

`recurrence.utils.js` remains pure and is responsible only for calendar occurrence calculation. It must not access MongoDB, users, templates, or chores.

The recurring service consumes calculated occurrence dates and performs business logic and persistence.

## 3. Recurring chore service

The service coordinates:

1. occurrence calculation
2. assignment resolution
3. workload calculation for rotation
4. occurrence creation
5. duplicate protection
6. scheduler state updates

The service is the shared implementation for scheduler-triggered, recovery, and manual generation paths.

Controllers remain thin: authentication/authorization and request handling belong at the API boundary; recurring business rules belong in services.

## 4. Assignment

### Fixed assignment

A fixed template uses its configured `assignedTo`. The service must verify that the assignee is still an eligible member of the household. It must not silently reassign a fixed template if that user leaves the household.

### Rotation assignment

Rotation chooses among eligible household members using workload and recent assignment history.

Current workload includes:

- pending approved chores
- overdue chores
- difficulty-weighted workload

Completed, rejected, and inactive chores do not count toward current workload.

Difficulty points use the existing difficulty mapping: 10, 20, 30, 40, and 50 points for difficulty levels 1 through 5.

Recent assignment history uses a frequency-aware window:

- daily: 7 days
- weekly: 7 days
- monthly: 30 days
- yearly: 30 days

Selection is lexicographic rather than an opaque combined score:

1. lowest current workload
2. lowest recent assignment burden
3. lowest recent difficulty burden
4. deterministic tie-breaker

This makes assignment explainable and deterministic while still balancing actual work.

## 5. Instance snapshot

A generated `Chore` copies the relevant template state at generation time, including title, description, household, resolved assignee, difficulty, recurring identity, occurrence date, and generation type.

The generated chore is not updated when the source template changes. Existing instances remain historical records.

`occurrenceDate` identifies the recurrence occurrence; `dueDate` represents the actual due date and must not be used as the idempotency key.

`generationType` distinguishes normal, recovery, and manual generation using the existing constants.

## 6. Scheduler

The scheduler is not a public HTTP endpoint. It periodically finds templates whose `schedulerMetadata.nextRunAt` is due and delegates processing to the recurring service.

The existing `nextRunAt` index is used to efficiently find due templates.

Processing flow:

1. find a due template
2. atomically claim it
3. process all required occurrences within the bounded catch-up window
4. create idempotent instances
5. advance `nextRunAt`
6. update `lastProcessedAt`
7. release/finish the processing lease

### Multi-instance coordination

Scheduler coordination uses MongoDB atomic claiming rather than introducing Redis or another infrastructure dependency.

`processingLeaseUntil` is added to scheduler metadata. A claim is valid only while its lease is active. A crashed worker therefore cannot permanently lock a template; after lease expiry another worker may claim it.

The initial lease duration is 5 minutes and should be represented as scheduler configuration rather than a scattered magic number.

The lease is coordination, not the final correctness guarantee. The unique recurring occurrence constraint remains mandatory.

## 7. Catch-up and recovery

If the application is unavailable when occurrences become due, the scheduler processes missed occurrences when it returns.

Catch-up is bounded to 30 days. Older missed occurrences are not backfilled automatically.

A database failure during occurrence creation must not advance scheduler state for work that was not successfully accounted for. The next scheduler pass can retry it.

If an occurrence was successfully created but scheduler-state persistence fails, a later retry encounters the existing unique occurrence and treats it as already processed before advancing state.

## 8. Failure behavior

Expected business failures include:

- no eligible rotation member
- fixed assignee no longer belongs to the household
- inactive/unprocessable template

These must not crash the whole scheduler. The occurrence is not silently reassigned or created without an assignee, and scheduler state must not be advanced as if generation succeeded.

Duplicate-key results for an already-created occurrence are idempotent success conditions.

Unexpected infrastructure failures are logged and isolated to the affected template; other due templates continue processing.

No persistent retry-count/error-state system is required in V1 beyond the scheduler lease and existing timestamps.

## 9. API boundary

Recurring templates use their own route namespace, separate from actual chore routes:

- `POST /api/recurring-chores`
- `GET /api/recurring-chores`
- `GET /api/recurring-chores/:id`
- `PATCH /api/recurring-chores/:id`
- `DELETE /api/recurring-chores/:id`

A manual generation endpoint may trigger the same recurring service and use `generationType = manual`. Manual generation must not bypass assignment, workload, idempotency, or template-state rules.

Existing chore endpoints remain responsible for actual `Chore` instances and their lifecycle.

## 10. Testing strategy

### Recurrence

Preserve existing unit coverage for daily, weekly, monthly, yearly, intervals, invalid dates, and monthly rules.

### Assignment

Cover fixed assignment, rotation eligibility, current workload, difficulty weighting, overdue work, frequency-aware history windows, deterministic tie-breaking, and no eligible members.

### Instance creation

Verify historical snapshots, recurring identity, occurrence date, generation type, due date, and resolved assignee.

### Idempotency

Generating the same template occurrence multiple times must produce exactly one `Chore`.

### Concurrency

Two workers processing the same due template must not create duplicate occurrences. Atomic template claiming plus the unique occurrence constraint must protect this case.

### Lease recovery

A claimed template whose worker stops must become claimable after lease expiry.

### Catch-up

Verify normal catch-up and the 30-day maximum.

### Failure isolation

A failure in one template must not prevent other due templates from processing.

## 11. Explicit non-goals for V1

Do not introduce Redis, an external queue, an event bus, or a full persistent retry subsystem solely for recurring chores.

Do not add analytics/leaderboard aggregation into the recurring service. Workload calculation should remain an isolated unit that can later be reused by those subsystems.

Do not modify existing generated chores when templates are edited or deactivated.

## 12. End-to-end architecture

```text
Recurring Template API ───────┐
                              │
Scheduler ────────────────────┤
                              ▼
                    Recurring Chore Service
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
       Recurrence Engine  Assignment      Instance Creation
                              │                │
                         Workload Engine      │
                              │                │
              └───────────────┴────────────────┘
                              ▼
                            Chore
                              │
                              ▼
                    Historical Instance
```

The scheduler is responsible for finding and claiming work. The recurring service owns business logic. The recurrence engine owns calendar calculation. The workload engine owns workload/fairness calculation. MongoDB uniqueness provides final occurrence-level idempotency.

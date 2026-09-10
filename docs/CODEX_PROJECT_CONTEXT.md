# TaskForce Backend — Project Context for Codex

## Purpose of this document

This file is a persistent project-context handoff for agents working on the TaskForce backend. Read it before making architectural or feature decisions. It captures the current architecture, important existing conventions, the recurring-chore design, and the intended future direction of the project.

This document is supplementary context. The approved feature specification and implementation plan remain authoritative for the Recurring Chore Engine:

- `docs/superpowers/specs/2026-09-11-recurring-chore-engine-design.md`
- `docs/superpowers/plans/2026-09-11-recurring-chore-engine-implementation.md`

If this context conflicts with those documents, inspect the current code and the approved spec/plan before changing anything.

---

# 1. Project overview

TaskForce is a household chore-management backend. The long-term product direction is to make household chores structured, recurring, assignable, auditable, and useful for calendars, leaderboards, analytics, and proof/history.

The backend currently supports users, authentication, households/memberships, and Chore instances. The next major subsystem is the Recurring Chore Engine.

The important product distinction is:

- A **Chore** is an actual historical work item/occurrence.
- A **RecurringChoreTemplate** is the reusable definition that describes when and how future Chore instances should be generated.

Do not collapse these concepts into one model.

---

# 2. Current repository

Repository:
`shivamsingh200431/taskforce-backend`

Default branch: `main`

The project is a Node.js/Express/Mongoose backend.

Current source layout includes:

```text
src/
  config/
  constants/
  controllers/
  middleware/
  models/
  routes/
  server.js
  utils/

docs/
  superpowers/
```

The project currently has a mixture of CommonJS and ESM conventions. `package.json` currently declares `"type": "module"`, while much of the older application code is CommonJS. Be careful when adding imports/exports or changing existing modules. Do not perform a broad module-system migration unless explicitly required.

Relevant dependencies include Express, Mongoose, `date-fns`, and `date-fns-tz`.

---

# 3. Existing application architecture

The existing backend generally follows:

```text
Routes → Controllers → Models / permission helpers
```

The recurring-chore subsystem should evolve this toward:

```text
Schema → Validation Helpers → pre("validate") Middleware

Routes → Thin Controllers → Services → Models / Permission Helpers

Recurring Template
        ↓
Recurrence Utilities
        ↓
Recurring Chore Service
        ↓
Actual Chore Instance
```

Business rules should live in helpers/services rather than controllers or Mongoose schemas where practical.

Schemas should remain thin and responsible mainly for persistence shape and validation hooks.

Avoid unnecessary abstraction. Prefer small, focused helpers and services over a framework-like architecture.

---

# 4. Existing authentication and household model

Authentication currently uses JWT Bearer authentication middleware and places the authenticated user on `req.user`.

Household membership is represented by a `Membership` model with fields including:

- `userId`
- `householdId`
- `role`
- timestamps

Existing household permission helpers include checks equivalent to:

- `isMember(userId, householdId)`
- `isAdmin(userId, householdId)`

Recurring-chore API operations must respect household membership/authorization. Do not invent a second permission system when the existing helpers can be reused.

---

# 5. Existing Chore model

The existing Chore model represents actual chore instances.

Important existing fields include:

- `title`
- `description`
- `householdId`
- `assignedTo`
- `createdBy`
- `choreType`
- `completionStatus`
- `suggestedDifficulty`
- `approvedDifficulty`
- `approvalStatus`
- `source`
- `feedback`
- `dueDate`
- timestamps

Important: `approvalStatus` and `completionStatus` are separate concepts. Never treat one as the other.

The Chore model already has a `choreType` concept including recurring/one-time, but the new recurring subsystem still uses a separate recurring-template model. A recurring template is not itself the historical occurrence.

The approved recurring design adds these Chore concepts:

- `recurringTemplateId`
- `occurrenceDate`
- `generationType`

Recurring instances should have a unique identity based on:

```text
(recurringTemplateId, occurrenceDate)
```

The unique database constraint is the final idempotency guard.

A generated Chore should be a historical snapshot of the relevant template state at generation time. Future template edits affect future occurrences, not already-created Chores.

Relevant snapshot information includes title, description, household, difficulty, resolved assignment, creator/template relationship, recurring nature, due date, and other fields required by the existing Chore model/business behavior.

`occurrenceDate` identifies the recurrence occurrence. It is not interchangeable with `dueDate`.

---

# 6. Existing constants

`src/constants/chore.constants.js` already contains recurring-related constants including:

- `ASSIGNMENT_STRATEGY`
  - `fixed`
  - `rotation`
- `ASSIGNED_BY`
  - `admin`
  - `system`
- `GENERATION_TYPE`
  - `normal`
  - `recovery`
  - `manual`
- completion/status values
- frequency values
- monthly rule values
- weekday values
- history action values

Do not duplicate these constants unnecessarily. Reuse the existing constants.

`src/constants/metadata.constants.js` contains chore difficulty and difficulty points. The current difficulty mapping is:

```text
1 → 10 points
2 → 20 points
3 → 30 points
4 → 40 points
5 → 50 points
```

Use these existing definitions for workload/difficulty calculations rather than inventing another scale.

---

# 7. RecurringChoreTemplate — current model direction

`RecurringChoreTemplate` is the central model for recurring chore definitions.

Its current design includes:

## Schedule

- `frequency`
- `interval`
- `weekdays`
- `dayOfMonth`
- `month`
- `monthlyRule`

The recurrence utilities determine the actual calendar occurrences.

## Assignment

Two strategies exist:

### Fixed

A specific `assignedTo` user is configured.

The assigned user must still be a member of the household when an occurrence is generated. If they are no longer eligible, the system must **not silently reassign** the chore.

### Rotation

The system selects an eligible household member using the workload-balancing rules described below.

If there are no eligible members, do not create an unassigned Chore and do not advance the template's scheduler state. The occurrence should be retried later.

## Notification

V1 notification design is:

- `enabled`
- `reminderOffset`
  - `value`
  - `unit`

When notifications are enabled, both reminder offset fields are required.

When disabled, the reminder offset fields are null.

`repeatReminder` was deliberately removed from the design. Do not reintroduce it unless the product specification changes.

## Active period

- `startsAt`, defaulting to the creation/current time
- `endsAt`, nullable

Validation rejects an `endsAt` earlier than `startsAt`.

## Scheduler metadata

- `nextRunAt` — required
- `lastProcessedAt` — nullable
- `processingLeaseUntil` is part of the approved scheduler design for atomic worker claiming/lease recovery.

The template has indexes supporting scheduler queries and household/template lookup. There is also a unique household/title constraint in the current model.

---

# 8. Recurrence engine

Recurrence calculation is deliberately pure.

The recurrence utility layer must NOT know about:

- MongoDB
- Mongoose
- users
- memberships
- recurring templates
- Chore documents
- HTTP requests
- scheduler state

It should only calculate/validate calendar occurrences.

Existing recurrence utilities cover:

- date range validation
- interval validation
- daily occurrences
- weekday validation
- weekly occurrences
- monthly rule validation
- day-of-month validation
- monthly argument validation
- monthly occurrences
- month validation
- yearly occurrences

The recurrence utilities use calendar dates represented as `YYYY-MM-DD` and existing calendar/date helper functions.

Important behavior: fixed calendar dates that do not exist in a particular month are skipped rather than producing invalid dates. This matters for short months and leap years.

Do not add database/business concerns to these utilities.

---

# 9. Recurring Chore Engine — approved architecture

The long-term flow is:

```text
RecurringChoreTemplate
        ↓
recurrence.utils.js
        ↓
Recurring Chore Service
        ├── validate template/eligibility
        ├── calculate occurrence
        ├── resolve assignment
        ├── calculate due date
        ├── build historical Chore snapshot
        ├── persist Chore
        └── advance scheduler state
```

The template is the definition. The Chore is the historical instance.

Do not generate all future Chores ahead of time. Generate occurrences when they become due through the scheduler.

---

# 10. Rotation assignment algorithm

Rotation is not simple round-robin.

For each eligible household member, rank candidates lexicographically by:

1. Lowest current workload
2. Lowest recent assignment burden
3. Lowest recent difficulty burden
4. Deterministic tie-breaker

### Current workload

Current workload includes pending approved chores and overdue chores.

The existing Chore model has separate fields, so the workload query must account for both:

```text
approvalStatus = approved
AND
completionStatus ∈ relevant pending/overdue states
```

Completed, rejected, and inactive work should not count as current workload.

Difficulty-weighted workload uses the existing difficulty points mapping.

### Recent history

Use a rolling history window:

- daily/weekly recurrence → previous 7 days
- monthly/yearly recurrence → previous 30 days

Recent assignment burden and recent difficulty burden are separate signals.

The workload calculator should be isolated/reusable so that it can later support:

- statistics
- leaderboards
- difficulty balancing
- reports
- analytics

Do not build those future features now unless the active task explicitly requires them.

---

# 11. Fixed assignment rules

For a fixed-assignment template:

1. A user must be configured as `assignedTo`.
2. The user must still be an eligible member of the template's household when the occurrence is generated.
3. If they are no longer eligible, do not silently assign the chore to another member.
4. Do not create an invalid/unassigned occurrence just to advance the scheduler.
5. The scheduler state should remain retryable when generation cannot validly occur.

---

# 12. Scheduler design

The scheduler is database-backed and designed to work safely with multiple application instances.

The worker should find templates whose scheduler metadata indicates they are due:

```text
schedulerMetadata.nextRunAt <= now
```

Templates must be claimed atomically so two workers cannot simultaneously process the same template.

Use a processing lease. The initial lease duration is five minutes and should be configurable.

The unique `(recurringTemplateId, occurrenceDate)` constraint is the final correctness/idempotency guard.

### Catch-up

Do not generate an unlimited backlog.

Maximum catch-up is 30 days. If a template has been missed for 90 days, for example, the engine must not flood the household with 90 days of historical occurrences.

### Failure behavior

- If a template cannot currently generate a valid occurrence because of an expected business condition, do not crash the scheduler.
- Do not create bad/unassigned work.
- Do not advance scheduler state when the occurrence was not successfully handled.
- If database creation fails, do not advance scheduler state; the occurrence should be retryable.
- If the Chore was successfully created but the scheduler state update fails, a retry should hit the unique occurrence constraint. Treat that duplicate as idempotent success and then advance scheduler state.
- One template failure must not prevent other due templates from being processed.
- Unexpected infrastructure failures should be logged and isolated.

V1 deliberately does not introduce Redis, an external queue, or a full persistent retry system.

---

# 13. Recurring template API

Recurring templates have their own API namespace. Existing `/api/chores` remains the namespace for actual Chore instances.

Planned routes:

```text
POST   /api/recurring-chores
GET    /api/recurring-chores
GET    /api/recurring-chores/:id
PATCH  /api/recurring-chores/:id
DELETE /api/recurring-chores/:id
```

Manual generation may be exposed as:

```text
POST /api/recurring-chores/:id/generate
```

Manual generation must use the same recurring generation service as scheduled generation rather than duplicating business logic. It should use:

```text
GENERATION_TYPE.MANUAL
```

Controllers should remain thin. Business rules belong in services.

---

# 14. Idempotency and concurrency

Idempotency is a core requirement, not an optional enhancement.

The engine must guarantee that the same template does not produce duplicate Chores for the same occurrence date, even if:

- a worker retries
- two workers race
- the scheduler state update fails after Chore creation
- manual and scheduled generation overlap

The database unique constraint is the final guard.

Application-level checks are useful but are not sufficient by themselves.

Atomic scheduler claiming and the occurrence unique constraint are complementary:

```text
Atomic lease/claim
        ↓
reduce duplicate work
        ↓
Unique occurrence constraint
        ↓
final correctness guarantee
```

---

# 15. Testing expectations

Tests should cover the recurrence utilities and the business engine independently.

At minimum, recurring-engine work should test:

### Recurrence

- daily occurrences
- weekly occurrences
- monthly occurrences/rules
- yearly occurrences
- intervals
- invalid schedule arguments
- short-month behavior
- leap-year behavior

### Assignment

- fixed assignment
- fixed-assignment eligibility
- no silent reassignment
- rotation
- current workload calculation
- overdue workload
- difficulty weighting
- recent 7-day window
- recent 30-day window
- deterministic tie-breaking
- no eligible rotation members

### Instance generation

- historical snapshot behavior
- occurrence identity
- correct generation type
- template changes affecting only future occurrences

### Scheduler

- idempotency
- two concurrent workers producing one occurrence
- processing lease
- lease recovery
- catch-up within 5 days
- catch-up capped at 30 days
- 90-day missed period does not flood the system
- one template failing does not stop other templates
- DB failure leaves scheduler state retryable
- duplicate-key retry is treated as idempotent success

### API/integration

Where applicable, test authentication, household authorization, validation, and CRUD behavior for recurring templates.

Do not weaken tests simply to make implementation pass.

---

# 16. Future product direction

The project is intended to grow beyond basic CRUD.

The recurring-chore foundation is being built specifically so later features can rely on clean historical data.

Future directions discussed for the project include:

- calendar views
- recurring chore management
- fair household rotation
- workload statistics
- difficulty balancing
- leaderboards
- analytics/reports
- proof/history/audit capabilities
- recovery generation for missed work
- richer notification/reminder behavior

The historical Chore snapshot and occurrence identity are especially important for these future features.

Do not prematurely implement future features just because the architecture anticipates them. Build the reusable foundation now and keep V1 focused.

---

# 17. Existing documentation/workflow

The approved recurring design is documented at:

`docs/superpowers/specs/2026-09-11-recurring-chore-engine-design.md`

The implementation plan is documented at:

`docs/superpowers/plans/2026-09-11-recurring-chore-engine-implementation.md`

The plan was reviewed and refined to account for the actual codebase, including the distinction between `approvalStatus` and `completionStatus` and the repository's CommonJS/ESM situation.

When implementing the plan, use the project's established Superpowers workflow where available:

- isolated worktree/branch
- task-by-task implementation
- tests before claiming completion
- separate review/verification
- final broad code review
- finish/integrate the development branch only after verification

Never claim that a subagent/reviewer/test was run if the environment did not actually run it.

---

# 18. Important engineering principles

1. **Read the existing code before changing it.** Do not design against an imagined repository.
2. **The approved spec wins over assumptions.** If something is unclear, inspect the spec and implementation plan.
3. **Preserve existing behavior.** Recurring work should not unnecessarily rewrite existing Chore/auth/household functionality.
4. **Keep responsibilities separated.** Pure recurrence calculations should stay pure; business rules belong in services/helpers.
5. **Do not duplicate constants.** Reuse the existing chore constants and difficulty definitions.
6. **Do not silently reassign fixed chores.** Fairness rules apply to rotation, not as a fallback for invalid fixed assignments.
7. **Never create unassigned recurring work merely to keep the scheduler moving.**
8. **Do not advance scheduler state after a failed generation.**
9. **Database uniqueness is part of correctness.** Do not rely solely on application-level duplicate checks.
10. **Keep generated Chores historically stable.** Template edits are not retroactive.
11. **Do not over-engineer V1.** No Redis/queue/retry infrastructure unless the approved design changes.
12. **Use deterministic behavior.** Rotation and scheduler behavior should be reproducible where ties exist.
13. **Treat failure isolation as a requirement.** One bad template must not take down processing for every other template.
14. **Tests are part of the feature.** New business rules require corresponding tests.
15. **Avoid unrelated cleanup.** Keep feature work reviewable and focused.

---

# 19. Current implementation starting point

At the point this context was written, the following recurring foundation already exists:

- recurring chore constants
- difficulty constants and points
- calendar/date utility helpers
- recurrence calculation/validation utilities
- `RecurringChoreTemplate` model
- recurring design specification
- recurring implementation plan

The remaining implementation work is to build the business/service, assignment/workload, scheduler, Chore integration, API, and associated tests according to the approved plan.

Before touching those areas, inspect the current files rather than assuming their exact contents from this document.

---

# 20. Agent instruction

When starting work on this repository:

```text
Read this file first.
Then read the approved recurring-chore design spec.
Then read the recurring-chore implementation plan.
Then inspect the actual source files involved in the current task.
Only then implement.
```

The goal is not merely to make tests pass. The goal is to preserve a coherent backend architecture that can support the planned recurring-chore, calendar, fairness, history, analytics, and leaderboard features without rewriting the foundation later.

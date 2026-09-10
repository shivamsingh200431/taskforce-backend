# Recurring Chore Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the recurring chore subsystem that generates historical `Chore` instances from `RecurringChoreTemplate` definitions with workload-aware rotation, bounded catch-up, idempotency, and multi-instance scheduler coordination.

**Architecture:** Keep calendar calculations in the existing pure recurrence utilities. Add focused workload/assignment and recurring-service layers for business rules, and keep HTTP controllers/routes thin. Use MongoDB atomic template claiming plus a unique `(recurringTemplateId, occurrenceDate)` index for scheduler coordination and final occurrence idempotency.

**Tech Stack:** Node.js, Express 5, Mongoose 9, MongoDB, existing `date-fns`/`date-fns-tz` recurrence utilities, JWT auth, existing CommonJS application code with the repository's current `package.json` module setting.

**Spec:** `docs/superpowers/specs/2026-09-11-recurring-chore-engine-design.md`

## Global Constraints

- `recurrence.utils.js` remains pure and must not access MongoDB, users, templates, or chores.
- Generated recurring chores are historical snapshots; future template edits do not modify existing instances.
- Recurring occurrence identity is `(recurringTemplateId, occurrenceDate)` and must be uniquely indexed.
- Fixed assignments are never silently reassigned when the configured member leaves the household.
- Rotation uses current workload first, then recent assignment burden, then recent difficulty burden, then a deterministic tie-breaker.
- Current workload counts outstanding chores with `approvalStatus = approved` and `completionStatus` representing pending/overdue work; completed/rejected/inactive work is excluded.
- Recent history uses 7 days for daily/weekly templates and 30 days for monthly/yearly templates.
- Catch-up is limited to 30 days.
- No Redis, external queue, event bus, or persistent retry subsystem is introduced for V1.
- One template failure must not stop other due templates from processing.
- Scheduler state must not advance when an occurrence has not been successfully accounted for.
- Duplicate occurrence creation is treated as idempotent success.
- Scheduler lease duration is 5 minutes and must be configuration rather than a scattered magic number.
- Manual generation uses the same recurring service and safeguards as scheduled generation.

---

## File map

### Existing files to modify

- `src/models/Chore.js` — add recurring-instance identity/snapshot fields and the unique occurrence index.
- `src/models/RecurringChoreTemplate.js` — add `processingLeaseUntil` to scheduler metadata and retain scheduler indexes/validation.
- `src/constants/chore.constants.js` — extend or reuse recurring-related constants only where required by implementation; preserve the existing `GENERATION_TYPE` values.
- `src/server.js` — mount the recurring-template routes and start the scheduler after MongoDB is connected.
- `package.json` — add a test command only if required by the repository's eventual test harness; do not add a runtime dependency unless implementation demonstrates it is necessary.

### New files

- `src/services/recurringChore.service.js` — orchestration for occurrence generation, snapshot creation, scheduler state, idempotency, and failure isolation.
- `src/services/assignment.service.js` — fixed/rotation assignee resolution and eligibility checks.
- `src/services/workload.service.js` — current workload and recent assignment/difficulty calculations.
- `src/services/recurringScheduler.service.js` — due-template discovery, atomic lease claiming, per-template processing, and lease completion.
- `src/config/recurringScheduler.config.js` — scheduler lease/catch-up configuration.
- `src/controllers/recurringChoreController.js` — HTTP handlers for template CRUD and manual generation.
- `src/routes/recurringChoreRoutes.js` — authenticated recurring-template routes.

### Tests to create or extend

- `tests/services/workload.service.test.js` — workload/history calculations and deterministic selection inputs.
- `tests/services/assignment.service.test.js` — fixed and rotation assignment behavior.
- `tests/services/recurringChore.service.test.js` — generation, snapshotting, idempotency, catch-up, and failure behavior.
- `tests/services/recurringScheduler.service.test.js` — atomic claiming, lease expiry, concurrency behavior, and failure isolation.
- `tests/controllers/recurringChoreController.test.js` — recurring API permission and request behavior.
- Model tests for the recurring fields/indexes.
- Existing recurrence utility tests — keep passing unchanged; add no recurrence logic to service tests that duplicates utility behavior.

---

### Task 1: Establish the recurring instance schema boundary

**Files:**
- Modify: `src/models/Chore.js`
- Modify: `src/models/RecurringChoreTemplate.js`
- Test: `tests/models/chore.model.test.js`
- Test: `tests/models/recurringChoreTemplate.model.test.js`

**Interfaces:**
- `Chore` gains `recurringTemplateId`, `occurrenceDate`, and `generationType`.
- `RecurringChoreTemplate.schedulerMetadata` gains nullable `processingLeaseUntil`.
- Recurring chores are uniquely identified by `(recurringTemplateId, occurrenceDate)`.

- [ ] **Step 1: Write failing model tests**

Create tests that construct a recurring `Chore` with a template id, occurrence date, and `generationType: "normal"`, and verify those values persist. Add a test that attempts two recurring chores with the same template id and occurrence date and expects the second save to fail with MongoDB's duplicate-key error. Add a template test showing `processingLeaseUntil` may be null.

- [ ] **Step 2: Run the model tests and verify they fail for the missing fields/index**

Run the repository's configured Node test command against the model test files. Expected result: the recurring fields/index behavior is not yet available.

- [ ] **Step 3: Add the recurring fields and unique index**

Add `recurringTemplateId` as an ObjectId reference to `RecurringChoreTemplate`, `occurrenceDate` as a Date, and `generationType` using the existing `GENERATION_TYPE` values. Require `occurrenceDate` and `generationType` when `choreType` is `recurring` through schema validation while keeping one-time chores compatible. Add the unique compound index `{ recurringTemplateId: 1, occurrenceDate: 1 }`. Add `processingLeaseUntil` with a default of null under scheduler metadata.

- [ ] **Step 4: Run the model tests and existing recurrence tests**

Run the focused model tests followed by the existing recurrence test suite. Expected result: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/models/Chore.js src/models/RecurringChoreTemplate.js tests/models
git commit -m "feat: add recurring chore instance fields"
```

---

### Task 2: Build reusable workload calculations

**Files:**
- Create: `src/services/workload.service.js`
- Test: `tests/services/workload.service.test.js`
- Use: `src/models/Chore.js`
- Use: `src/constants/metadata.constants.js`

**Interfaces:**
- `getCurrentWorkload(userId, householdId)` returns the user's current outstanding chore count and difficulty-point workload.
- `getRecentAssignmentBurden(userId, householdId, windowStart)` returns the number of relevant assignments in the supplied rolling window.
- `getRecentDifficultyBurden(userId, householdId, windowStart)` returns difficulty points assigned in the supplied rolling window.
- The service exposes data needed by assignment selection without deciding the winner itself.

- [ ] **Step 1: Write failing workload tests**

Cover: an approved pending difficulty-3 chore contributes 30 points; a completed or rejected chore contributes nothing; an overdue outstanding chore contributes to current workload; historical/inactive work does not count; recent assignments are counted only inside the requested window; recent difficulty uses the same window; users with no matching chores return zeroes.

- [ ] **Step 2: Run the focused workload tests and verify failure**

Run the workload test file. Expected result: the new service functions are unavailable.

- [ ] **Step 3: Implement the minimum database queries**

Use `Chore` queries scoped by both `householdId` and `assignedTo`. Current workload must require `approvalStatus: "approved"` and include outstanding `completionStatus` values (`pending` and `overdue`), excluding completed/rejected/skipped/other terminal states and any inactive records represented by the current model. Sum difficulty through the existing difficulty-point mapping, treating a missing difficulty as zero. Recent assignment burden and recent difficulty burden must use the requested `windowStart` and only chores belonging to the household/user.

- [ ] **Step 4: Run workload tests and verify all pass**

Run the focused tests and confirm the existing Chore behavior is unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/services/workload.service.js tests/services/workload.service.test.js
git commit -m "feat: add chore workload calculations"
```

---

### Task 3: Implement assignment resolution

**Files:**
- Create: `src/services/assignment.service.js`
- Test: `tests/services/assignment.service.test.js`
- Use: `src/models/Membership.js`
- Use: `src/services/workload.service.js`

**Interfaces:**
- `resolveFixedAssignee(template)` returns the configured assignee only when the user is an eligible household member; otherwise returns a business failure result.
- `resolveRotationAssignee(template, now)` returns the selected eligible member using the four-level lexicographic ordering.
- `resolveAssignee(template, now)` dispatches by `ASSIGNMENT_STRATEGY`.

- [ ] **Step 1: Write failing assignment tests**

Test fixed assignment for a valid member and rejection when the member has left. Test rotation with multiple household members where current workload selects the lowest-loaded member, recent assignment burden breaks an otherwise equal workload, recent difficulty breaks another tie, and a stable user-id ordering breaks a final tie. Test 7-day windows for daily/weekly templates and 30-day windows for monthly/yearly templates. Test no eligible rotation members as a business failure rather than returning an unassigned successful result.

- [ ] **Step 2: Run focused assignment tests and verify failure**

Run the assignment tests. Expected result: the resolver functions are not yet implemented.

- [ ] **Step 3: Implement household eligibility**

Query `Membership` for household members and use membership records as the eligibility boundary. Fixed assignment must verify the configured user has a membership in the template household. Rotation candidates must be household members represented by membership records.

- [ ] **Step 4: Implement frequency-aware ranking**

For daily/weekly templates, calculate `windowStart` as seven calendar days before `now`; for monthly/yearly templates, calculate it as thirty calendar days before `now`. Build one ranking tuple per eligible member: current workload, recent assignment count, recent difficulty points, deterministic user id. Sort ascending by each component and choose the first member.

- [ ] **Step 5: Run assignment tests and verify all pass**

Run the focused workload and assignment suites together. Expected result: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/services/assignment.service.js tests/services/assignment.service.test.js
git commit -m "feat: add workload-aware chore assignment"
```

---

### Task 4: Implement recurring occurrence generation

**Files:**
- Create: `src/services/recurringChore.service.js`
- Test: `tests/services/recurringChore.service.test.js`
- Modify: `src/models/Chore.js` if generation-specific validation requires a small schema adjustment

**Interfaces:**
- `generateOccurrence(template, occurrenceDate, options)` creates or idempotently finds the recurring `Chore` for one occurrence.
- `processTemplate(template, now)` calculates and processes all due occurrences within the catch-up boundary.
- `options.generationType` is one of `normal`, `recovery`, or `manual`.

- [ ] **Step 1: Write failing generation tests**

Test that a generated chore contains the template snapshot, resolved assignee, recurring template reference, occurrence date, generation type, and due date. Test that changing the template after generation does not change the stored chore. Test duplicate generation returns the existing occurrence rather than creating another. Test fixed assignment failure and rotation no-candidate failure do not create an unassigned chore. Test a five-day missed window generates each missing occurrence and advances scheduler state only after successful accounting. Test the catch-up boundary limits processing to 30 days.

- [ ] **Step 2: Run focused service tests and verify failure**

Run the recurring chore service test file. Expected result: the generation service is unavailable.

- [ ] **Step 3: Implement occurrence calculation integration**

Select the existing pure recurrence helper based on the template frequency and pass a bounded date range into it. Do not reproduce daily/weekly/monthly/yearly calendar logic inside the service. Treat the calculated date as the occurrence identity.

- [ ] **Step 4: Implement snapshot creation**

Build the `Chore` payload from the template at generation time: title, description, household, difficulty, recurring type, source/creator fields required by the existing Chore schema, resolved assignee, occurrence date, due date, template reference, and generation type. Preserve the existing Chore lifecycle defaults instead of introducing a second status model.

- [ ] **Step 5: Implement idempotent creation**

Create the occurrence using the unique compound index as the database guard. When a duplicate-key error means the requested occurrence already exists, fetch and return the existing chore. Do not treat unrelated database errors as duplicates.

- [ ] **Step 6: Implement scheduler-state advancement**

Advance `nextRunAt` and set `lastProcessedAt` only after every occurrence that is considered successfully accounted for. If occurrence creation or assignment fails, leave the relevant scheduler state retryable. When an occurrence already exists because a previous attempt succeeded, treat it as accounted for.

- [ ] **Step 7: Run generation tests and the full existing recurrence suite**

Expected result: snapshot, idempotency, catch-up, and failure tests pass, and recurrence utility tests remain green.

- [ ] **Step 8: Commit**

```bash
git add src/services/recurringChore.service.js tests/services/recurringChore.service.test.js
git commit -m "feat: generate recurring chore instances"
```

---

### Task 5: Add scheduler claiming and lease recovery

**Files:**
- Create: `src/services/recurringScheduler.service.js`
- Create: `src/config/recurringScheduler.config.js`
- Test: `tests/services/recurringScheduler.service.test.js`
- Modify: `src/models/RecurringChoreTemplate.js` only if atomic claim fields/indexes need adjustment

**Interfaces:**
- `claimTemplate(templateId, now)` atomically claims a due template when its lease is absent or expired and returns the claimed template or null.
- `runSchedulerTick(now)` finds due templates, claims them independently, and delegates each to `processTemplate`.
- `completeClaim(templateId, leaseUntil, updates)` finalizes scheduler metadata without overwriting a newer claim.

- [ ] **Step 1: Write failing scheduler tests**

Test two simulated workers claiming the same due template: exactly one receives the template. Test an unexpired lease cannot be stolen. Test an expired lease can be reclaimed. Test a worker that processes one template unsuccessfully does not prevent another due template from running. Test the scheduler does not create chores directly and instead calls the recurring service.

- [ ] **Step 2: Run scheduler tests and verify failure**

Run the scheduler test file. Expected result: claim and tick functions are unavailable.

- [ ] **Step 3: Add scheduler configuration**

Create a focused configuration module exporting a five-minute processing lease and a thirty-day catch-up limit. Keep these values out of service methods as repeated literals.

- [ ] **Step 4: Implement atomic claim**

Use a single Mongoose `findOneAndUpdate` condition that requires `schedulerMetadata.nextRunAt <= now` and either no `processingLeaseUntil` or an expired lease. Set a new `processingLeaseUntil` to `now + 5 minutes`. Return the updated document. This operation is the multi-instance coordination boundary.

- [ ] **Step 5: Implement scheduler tick**

Query due templates using the existing `schedulerMetadata.nextRunAt` index. Attempt an atomic claim for each. Skip templates another worker already claimed. Wrap each template's processing in its own error boundary so one failure cannot stop the remaining templates.

- [ ] **Step 6: Implement lease completion**

Finish a claim only when the current lease still belongs to the worker's claim. Clear `processingLeaseUntil` and persist `nextRunAt`/`lastProcessedAt` from the service result. Do not clear or overwrite a lease belonging to a later worker.

- [ ] **Step 7: Run concurrency, lease, catch-up, and failure-isolation tests**

Expected result: one worker wins a claim, expired leases recover, duplicate occurrences remain impossible, and one template failure does not stop the scheduler.

- [ ] **Step 8: Commit**

```bash
git add src/services/recurringScheduler.service.js src/config/recurringScheduler.config.js src/models/RecurringChoreTemplate.js tests/services/recurringScheduler.service.test.js
git commit -m "feat: add recurring chore scheduler"
```

---

### Task 6: Add recurring template API

**Files:**
- Create: `src/controllers/recurringChoreController.js`
- Create: `src/routes/recurringChoreRoutes.js`
- Modify: `src/server.js`
- Test: `tests/controllers/recurringChoreController.test.js`

**Interfaces:**
- `POST /api/recurring-chores` creates a template for an authorized household user, following the project's existing household permission rules.
- `GET /api/recurring-chores` lists templates visible to the authenticated user.
- `GET /api/recurring-chores/:id` returns one authorized template.
- `PATCH /api/recurring-chores/:id` updates an authorized template.
- `DELETE /api/recurring-chores/:id` deactivates/removes an authorized template according to the existing project convention.
- `POST /api/recurring-chores/:id/generate` performs manual generation through the same recurring service with `generationType = manual`.

- [ ] **Step 1: Write failing route/controller tests**

Test authentication is required, household authorization is enforced, valid template creation reaches the model, unauthorized users cannot read/update/delete another household's template, and manual generation uses the same recurring service rather than duplicating generation logic.

- [ ] **Step 2: Run focused API tests and verify failure**

Run the controller/route test file. Expected result: the recurring route is not mounted yet.

- [ ] **Step 3: Implement thin controllers**

Follow the existing Express controller style. Controllers should parse request parameters/body, obtain `req.user`, call the relevant recurring service operation, and return HTTP responses. Do not put recurrence calculation, assignment ranking, or scheduler logic in controllers.

- [ ] **Step 4: Implement authenticated routes**

Attach the existing `authMiddleware` to every recurring-template route. Use the project's established household admin/member permission helpers for mutations. Keep actual generated-chore lifecycle routes under `/api/chores`.

- [ ] **Step 5: Mount the router**

Register the recurring router in `src/server.js` at `/api/recurring-chores` without changing existing `/api/chores` behavior.

- [ ] **Step 6: Run API tests and existing chore tests**

Expected result: recurring API tests pass and existing auth/household/chore tests remain green.

- [ ] **Step 7: Commit**

```bash
git add src/controllers/recurringChoreController.js src/routes/recurringChoreRoutes.js src/server.js tests/controllers/recurringChoreController.test.js
git commit -m "feat: add recurring chore API"
```

---

### Task 7: Wire the scheduler into application startup safely

**Files:**
- Modify: `src/server.js`
- Modify: `src/config/recurringScheduler.config.js` if startup interval belongs there
- Test: `tests/services/recurringScheduler.service.test.js`

**Interfaces:**
- Application startup connects to MongoDB before starting the recurring scheduler loop.
- The scheduler loop calls `runSchedulerTick` at a fixed configured interval and never overlaps its own tick execution.

- [ ] **Step 1: Write a failing startup/scheduler-loop test**

Test that the scheduler loop invokes a tick at the configured interval and that a slow tick prevents a second overlapping tick from starting.

- [ ] **Step 2: Run the focused test and verify failure**

Expected result: server startup has no recurring scheduler loop.

- [ ] **Step 3: Make startup await database connection**

Refactor the current `connectDB()` startup call into an async startup function so the scheduler is not started before MongoDB is ready. Preserve the existing route registrations and HTTP startup behavior.

- [ ] **Step 4: Add the scheduler loop**

Start the loop only after the database connection resolves. Guard the loop with an in-flight flag so one application instance does not run overlapping ticks. Keep the interval configurable and do not expose scheduler execution as an HTTP endpoint.

- [ ] **Step 5: Run startup and service tests**

Run the complete test suite plus a manual server startup check against the configured development database environment. Confirm the process starts normally and the scheduler does not prevent HTTP routes from loading.

- [ ] **Step 6: Commit**

```bash
git add src/server.js src/config/recurringScheduler.config.js tests/services/recurringScheduler.service.test.js
git commit -m "feat: run recurring chore scheduler"
```

---

### Task 8: Full verification and cleanup

**Files:**
- Modify: only files required by verification failures
- Test: all existing and new tests

**Interfaces:**
- The completed subsystem satisfies the recurring design spec without changing existing one-time chore behavior.

- [ ] **Step 1: Run every recurrence utility test**

Confirm daily, weekly, monthly, yearly, interval, invalid-input, and calendar-edge tests pass.

- [ ] **Step 2: Run every workload and assignment test**

Confirm current workload, difficulty points, recent history windows, eligibility, ranking, tie-breaking, and no-candidate behavior pass.

- [ ] **Step 3: Run every recurring-service test**

Confirm snapshots, idempotency, normal generation, recovery generation, manual generation, bounded catch-up, and failure handling pass.

- [ ] **Step 4: Run scheduler concurrency and lease tests**

Confirm atomic claiming, lease expiry recovery, duplicate protection, and failure isolation pass.

- [ ] **Step 5: Run API and existing chore tests**

Confirm recurring routes are authenticated/authorized and existing `/api/chores` behavior remains unchanged.

- [ ] **Step 6: Inspect the final diff for accidental scope expansion**

Verify no unrelated model migrations, dependency churn, route changes, or refactors were introduced. In particular, do not convert the existing CommonJS application to ESM merely to accommodate the recurring code; keep module boundaries consistent with the final implementation.

- [ ] **Step 7: Commit final verification fixes**

```bash
git add .
git commit -m "test: verify recurring chore engine"
```

# TaskForce System Workflows

This document describes the workflows currently implemented by the TaskForce backend and identifies capabilities that remain planned.

---

# Recurring Chore Workflow

Recurring chores use two persisted concepts.

## RecurringChoreTemplate

Stores the recurrence rule, assignment strategy, schedule, and scheduler metadata. It defines future work; it is not itself a chore to complete.

## Chore occurrence

Each generated occurrence is a normal persisted `Chore` document linked to its template through `recurringTemplateId`. It has its own assigned member, due date, completion status, occurrence date, and generation type. Later template edits do not rewrite existing occurrences.

---

# Daily Generation Workflow

The backend scheduler:

1. Finds due recurring templates.
2. Claims each template with an atomic processing lease.
3. Calculates due occurrence dates.
4. Resolves the fixed or rotation assignee.
5. Creates idempotent `Chore` occurrence records.
6. Stores scheduler progress and releases the lease.

Catch-up is bounded to avoid unbounded historical generation. A failed template is isolated from other due templates.

---

# Recovery Workflow

When the scheduler has been offline, it identifies missed dates within the configured catch-up window and creates those occurrences with:

- `normal` for the current calendar date
- `recovery` for an earlier missed date
- `manual` for an admin-triggered generation

**Additional approval for recovery-generated chores remains a product requirement to implement.** The current occurrence generator assigns and approves generated chores using the existing admin-assigned completion flow.

---

# Assignment Workflow

Assignment strategies:

## Fixed

The same configured household member receives each occurrence. Generation does not silently assign the chore to another person if that member is no longer eligible.

## Rotation

Assignment is selected from household members using current workload, recent assignment burden, and recent difficulty burden. A separate availability-driven redistribution service is not implemented yet.

---

# One-Time Chore Workflows

## Admin-assigned chore

Admin creates and assigns a chore.

The assigned member completes the chore through the completion endpoint. The persisted completion state changes from `pending` to `completed`.

## Member-submitted chore

A member submits work for review.

```text
Member submits
      |
      v
   pending
   /  |  \
  /   |   \
approve | reject
  |    |    |
  v    v    v
approved needs-improvement rejected
           \          /
            \        /
              resubmit
                 |
                 v
               pending
```

- `approved` means the submission is accepted and completed.
- `needs-improvement` means the member must correct or finish the work before resubmitting.
- `rejected` means the submission is not accepted; the member may revise it and resubmit.
- Resubmission is limited to the submitting member and returns the chore to admin review.
- Prior submissions and review decisions are retained in `reviewHistory`.

See [chore-lifecycle.md](chore-lifecycle.md) for the complete transition rules.

---

# Notification Workflow

Generation and notifications are separate responsibilities.

Generation creates chore records. A future notification service can remind members about new, upcoming, or overdue work. Notification delivery is not implemented yet.

---

# Audit Workflow

The Chore model's `reviewHistory` records member submissions, admin decisions, feedback, and resubmissions.

A broader audit service for assignments, completions, manual overrides, attachments, reports, and sensitive administrative actions remains planned.

---

# Future Systems

Planned capabilities include:

- Notifications
- Proof uploads and attachments
- Activity feed and broader audit logs
- Anonymous reporting
- Analytics and leaderboards
- Availability-based workload redistribution
- Smart scheduling and suggestions

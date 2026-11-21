# Chore Review Lifecycle

This document defines the current one-time chore lifecycle. It distinguishes work assigned by an admin from work submitted by a member for review.

## Chore sources

### Admin-assigned

An admin creates a chore and assigns it to a household member.

- `source`: `admin-assigned`
- `approvalStatus`: `approved` (the assignment is authorized)
- `completionStatus`: `pending`

The assigned member completes the chore through `PATCH /api/chores/:id/complete`. Completion changes `completionStatus` to `completed`. This flow does not use member-submission review.

### Member-submitted

A member submits a completed chore for admin review.

- `source`: `member-submitted`
- `assignedTo`: the submitting member
- `approvalStatus`: `pending`
- `completionStatus`: `pending`

An admin reviews the submission and chooses one of three outcomes:

| Admin decision | `approvalStatus` | `completionStatus` | Meaning |
|---|---|---|---|
| Approve | `approved` | `completed` | Work accepted |
| Needs improvement | `needs-improvement` | `pending` | Member must correct or finish the work |
| Reject | `rejected` | `pending` | Submission not accepted; member may revise it |

## Allowed transitions

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
           \           /
            \         /
             resubmit
                |
                v
             pending
```

- Only an admin of the chore's household may review a member-submitted chore.
- A review can only be applied while the submission is `pending`.
- Only the member assigned to the submission may resubmit it.
- Resubmission is allowed only from `needs-improvement` or `rejected`.
- Resubmission returns the submission to `pending`; the admin must review it again.
- An approved member submission is complete and cannot be resubmitted.
- A member-submitted chore cannot be completed through the admin-assigned completion endpoint.
- Admin-assigned chores cannot be reviewed or resubmitted through member-submission review routes.

## Feedback and review history

The `feedback` field contains the latest admin feedback shown to the member. Resubmission clears this current feedback so old instructions are not mistaken for the current decision.

The `reviewHistory` array preserves the sequence of member submissions and admin decisions. Each entry records the action, actor, feedback, and timestamp. Resubmission does not erase earlier feedback or decisions.

Supported history actions:

- `submitted`
- `approved`
- `needs-improvement`
- `rejected`
- `resubmitted`

## API surface

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/chores` | Create an admin-assigned chore or submit a completed chore |
| GET | `/api/chores?householdId=:id` | List chores visible to a household member |
| PATCH | `/api/chores/:id/approve` | Approve or request improvements on a pending submission |
| PATCH | `/api/chores/:id/reject` | Reject a pending submission with optional feedback |
| PATCH | `/api/chores/:id/resubmit` | Revise and resubmit a rejected or needs-improvement submission |
| PATCH | `/api/chores/:id/complete` | Complete an admin-assigned chore |

### Resubmission payload

Only the submitting member may update these optional fields while resubmitting:

- `title`
- `description`
- `suggestedDifficulty`

A member may also resubmit without changing text fields when the required correction was made outside the application.

## Regression requirements

Tests must cover:

- Admin-assigned completion and the prohibition on member-submission review actions for those chores.
- All three admin decisions for member-submitted chores.
- Resubmission from both `needs-improvement` and `rejected`.
- Re-review after resubmission.
- Preservation of prior review feedback in `reviewHistory`.
- Rejection of duplicate reviews, duplicate resubmissions, and invalid state transitions.
- Household role checks and assigned-member-only resubmission.
- Validation of optional resubmission fields.

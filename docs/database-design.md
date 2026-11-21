# TaskForce Database Design

## Overview

TaskForce is designed around one core principle:

> Preserve historical data instead of overwriting it.

Each recurring occurrence is stored as its own `Chore` record so completion and review data remain associated with the original work.

---

# Core Principles

## 1. Calendar Driven

Recurring chores are generated automatically according to the calendar. The backend scheduler does not wait for a user to open the application.

## 2. Templates Define Future Work

A `RecurringChoreTemplate` stores recurrence rules and assignment settings. Editing a template changes future generation; it does not rewrite existing `Chore` occurrences.

## 3. Every Occurrence Is Stored

Each occurrence is a separate `Chore` document with its own:

- Household and assigned member
- Occurrence date and due date
- Completion and approval states
- Generation type
- Snapshot of the template's chore details

## 4. History Is Preserved

The system retains individual occurrences and the review decisions attached to member-submitted chores. Additional audit records, proof history, reports, leaderboards, and analytics remain planned domains.

---

# Models

## User

Stores user authentication information.

## Household

Represents a household.

One household contains multiple members.

## Membership

Connects Users and Households and stores the household role and join metadata.

## RecurringChoreTemplate

Represents a recurring rule, including its schedule, assignment strategy, metadata, and scheduler progress.

A template is not itself an occurrence and cannot be completed.

## Chore

Represents actual work. It can be a one-time chore or a generated recurring occurrence.

Important fields include:

- `householdId`
- `assignedTo`
- `createdBy`
- `choreType`
- `recurringTemplateId` and `occurrenceDate` for recurring occurrences
- `generationType` for recurring occurrences
- `approvalStatus`
- `completionStatus`
- `feedback`
- `reviewHistory` for member-submission and admin review events

## Future Models

These are not currently implemented:

- Availability
- Report
- AuditLog
- Notification
- Attachment / proof metadata

---

# Chore Workflows

## One-Time Admin Assigned

1. Admin creates and assigns the chore to a household member.
2. The chore is created with `source: admin-assigned`, `approvalStatus: approved`, and `completionStatus: pending`.
3. The assigned member marks it complete.
4. `completionStatus` becomes `completed`.

## Member Submitted

1. Member submits work for admin review.
2. The chore is stored with `source: member-submitted`, `approvalStatus: pending`, and `completionStatus: pending`.
3. An admin chooses one of three decisions:

| Decision | `approvalStatus` | `completionStatus` |
|---|---|---|
| Approved | `approved` | `completed` |
| Needs improvement | `needs-improvement` | `pending` |
| Rejected | `rejected` | `pending` |

4. A member may revise and resubmit a chore in either the `needs-improvement` or `rejected` state.
5. Resubmission returns the chore to `pending` for another admin review.
6. `reviewHistory` retains the earlier feedback and decisions.

## Recurring Chore

1. The scheduler identifies a due `RecurringChoreTemplate`.
2. It generates a separate `Chore` occurrence and resolves an eligible assignee.
3. The occurrence preserves the template details as they were at generation time.
4. The assigned member completes the occurrence through the completion endpoint.

---

# Services

## Recurrence and Scheduler

Calculate due dates, claim due templates, create idempotent occurrences, and track scheduler progress.

## Assignment

Resolve fixed assignments and select rotation assignees using workload and recent history.

## Household Permissions

Resolve household membership and admin privileges.

## Future Services

- Availability and workload redistribution
- Notification delivery
- Reports and anonymous reporting
- Broader audit logging
- Analytics and leaderboards
- Proof upload and storage

---

# Design Philosophy

TaskForce prioritizes:

- Fairness
- Transparency
- Historical accuracy
- Accountability
- Automation where appropriate
- Human oversight for important decisions

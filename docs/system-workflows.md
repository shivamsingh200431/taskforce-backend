# TaskForce System Workflows

This document describes how the major systems inside TaskForce operate.

It focuses on application behaviour rather than implementation details.

---

# Recurring Chore Workflow

Recurring chores are managed using two separate models.

## RecurringChoreTemplate

Stores:

- recurrence rules
- assignment strategy
- scheduling information

Templates never represent actual work.

---

## ChoreInstance

Represents one occurrence of a recurring chore.

Every generated instance is independent.

Changes made to the template do not modify historical instances.

---

# Daily Generation Workflow

Every day:

Scheduler

↓

Calendar Service

↓

Recurring Templates

↓

Generate Chore Instances

↓

Store in Database

↓

Notification Service

---

Generation always occurs before notifications.

---

# Recovery Workflow

If the server is offline:

Calendar Service compares

lastGeneratedDate

with

today

and generates every missing occurrence.

Generated instances are marked with:

Generation Type

- Normal
- Recovery
- Manual

Recovery-generated chores require additional review before approval.

---

# Assignment Workflow

Assignment strategies:

## Fixed

The same member always receives the chore.

## Rotation

Assignment is determined by the Rotation Service.

Unavailable members are skipped during assignment.

---

# Completion Workflow

Pending

↓

Pending Review (if review required)

↓

Approved

OR

↓

Needs Improvement

OR

↓

Rejected

---

Some chores may become:

Overdue

or

Skipped

depending on household actions.

---

# Notification Workflow

Generation and notifications are independent.

Generation creates work.

Notifications remind members about work.

Preferred Completion Time controls reminders.

It does not affect generation.

---

# Audit Workflow

Every important action creates a history entry.

Examples:

- Generated
- Assigned
- Reassigned
- Completed
- Approved
- Rejected
- Skipped
- Comments
- Attachments

History should provide a complete audit trail of a chore's lifecycle.

---

# Future Systems

Planned services include:

- Suggestion Service
- Analytics
- Smart Workload Balancing
- AI Recommendations
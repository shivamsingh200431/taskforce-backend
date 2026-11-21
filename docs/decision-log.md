# TaskForce Decision Log

This document records important architectural and product decisions made during the development of TaskForce.

The purpose is to document not only the chosen solution, but also the reasoning behind it.

---

# ADR-001

## Title

Separate Recurring Chores into Templates and Occurrences

## Status

Accepted

## Problem

Recurring chores should preserve historical data.

Resetting the same database document would overwrite:

* Completion history
* Proofs
* Reports
* Leaderboards
* Analytics

## Decision

Recurring chores use two persisted concepts:

* `RecurringChoreTemplate` — the recurring rule and schedule.
* `Chore` — an actual chore occurrence, linked to its template through `recurringTemplateId`.

Each occurrence records its `occurrenceDate` and `generationType`. This preserves the history of individual occurrences instead of resetting one document.

## Alternatives Considered

Store everything in one document and reset it.

Rejected because historical information would be lost.

## Benefits

* Complete history
* Calendar view
* Monthly statistics
* Proof tracking
* Audit trails
* Better scalability

---

# ADR-002

## Title

Calendar Driven Chore Generation

## Status

Accepted

## Problem

Generating chores only when users open the application causes:

* Slower dashboard loading
* Missing historical records
* Difficult notification scheduling

## Decision

Recurring chore occurrences are generated automatically according to the calendar by the backend scheduler.

The system remains aware of due dates even when no users are online, while generation is bounded by the configured catch-up limit.

## Alternatives Considered

Generate chores lazily during API requests.

Rejected because it tightly couples business logic with user activity.

## Benefits

* Faster requests
* Reliable future notification foundation
* Accurate historical data
* Easier analytics

---

# ADR-003

## Title

Separate Rotation Engine from Workload Balancer

## Status

Accepted

## Problem

Rotation and workload balancing solve different problems.

## Decision

Rotation Engine

Determines who should receive the next recurring chore.

Workload Balancer

Redistributes work when members become unavailable.

The current recurring engine implements fixed assignment and workload-aware rotation. A separate availability-driven redistribution subsystem remains future work.

## Benefits

* Clear separation of responsibilities
* Easier maintenance
* Independent testing
* Better scalability

---

# ADR-004

## Title

Anonymous Reporting with Audited Identity Access

## Status

Accepted — planned capability

## Problem

Members should be able to report false completions without fear of retaliation.

Admins must still be able to investigate report abuse.

## Decision

Reports remain anonymous by default.

Reporter identity is stored securely.

Identity may only be revealed through an audited administrative action with a required reason.

This is a product/architecture decision; the reporting subsystem is not yet implemented.

## Benefits

* Protects reporters
* Prevents abuse
* Maintains accountability

---

# ADR-005

## Title

Availability Is Household Specific

## Status

Accepted — planned capability

## Problem

A user may be unavailable in one household while remaining active in another.

## Decision

Availability records belong to households instead of users.

Availability includes:

* Start Date
* End Date
* Optional Reason

Historical availability should be preserved.

This is a design decision for a future availability subsystem and is not part of the current recurring engine.

## Benefits

* Flexible scheduling
* Better workload balancing
* Historical records

---

# ADR-006

## Title

Shared Chore Contributions

## Status

Accepted — planned capability

## Problem

Some chores may need multiple contributors during workload redistribution.

## Decision

Chore occurrences may contain multiple contributors.

Each contributor receives a configurable share of points.

Examples include:

* Shared dishwashing
* Large cleaning tasks
* Temporary workload balancing

This capability is not implemented in the current Chore model.

## Benefits

* Fair point distribution
* Collaborative work
* Flexible assignment model

---

# Future ADRs

This document will continue to grow as TaskForce evolves.

Every major architectural decision should be recorded before implementation whenever possible.

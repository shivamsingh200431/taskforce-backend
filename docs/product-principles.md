# TaskForce Product Principles

## Vision

TaskForce is designed to make household management fair, transparent, and collaborative.

The goal is not simply to assign chores, but to create a system that encourages accountability while reducing conflict between household members.

Every feature should support this vision.

---

# Core Principles

## 1. Fairness Over Simplicity

Work should be distributed fairly rather than equally.

The system should consider:

* Member availability
* Workload
* Difficulty
* Household changes

instead of using simple round-robin assignment.

---

## 2. Preserve History

Historical information should never be overwritten.

Historical data enables:

* Leaderboards
* Monthly reports
* Analytics
* Audit trails
* Calendar views

Every recurring occurrence should become its own record.

---

## 3. Calendar Awareness

TaskForce is a calendar-driven application.

Recurring chores are generated according to the calendar rather than user activity.

The system should always know:

* Today
* This week
* This month

without requiring users to open the application.

---

## 4. Human Oversight

Automation should reduce repetitive work.

Important decisions should remain under human control.

Examples:

* Approving member submissions
* Difficulty adjustments
* Workload overrides
* Identity reveal requests

---

## 5. Transparency

Users should understand why decisions were made.

Examples:

* Feedback after rejection
* Approval history
* Chore status
* Assignment changes

Hidden system behavior should be avoided whenever possible.

---

## 6. Accountability

Actions performed by members and administrators should be traceable.

Sensitive actions should generate audit records.

Examples:

* Difficulty changes
* Reporter identity access
* Manual assignment overrides

---

## 7. Respect Privacy

Reports should remain anonymous to household members.

Reporter identity should only be accessible through a controlled and audited process.

Members should be able to report concerns without fear of retaliation.

---

## 8. Encourage Collaboration

Some chores can be completed by multiple contributors.

The system should support:

* Shared assignments
* Shared points
* Teamwork when appropriate

instead of forcing one-person ownership for every task.

---

## 9. Admins Guide, Not Dominate

Administrators should have the tools to manage a household, but their actions should remain transparent and accountable.

The goal is to support collaboration, not unchecked authority.

---

## 10. Build for Growth

New features should extend the architecture instead of replacing it.

Examples:

* Rotation Engine
* Availability System
* Notifications
* Analytics
* Reports

should integrate into the existing design with minimal refactoring.

---

# Decision Framework

Before implementing a new feature, ask:

1. Does it improve fairness?
2. Does it preserve historical data?
3. Is automation appropriate?
4. Does it respect privacy?
5. Can users understand what happened?
6. Is someone accountable for important actions?
7. Can this feature scale without redesigning the system?

If the answer to most of these questions is yes, the feature is likely aligned with TaskForce's vision.

---

# Long-Term Goal

TaskForce should evolve from a household chore tracker into a household management platform that balances automation, fairness, transparency, and accountability while remaining simple enough for everyday families to use.

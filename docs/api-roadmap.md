# TaskForce API Roadmap

This document tracks the development progress of the TaskForce backend.

Each sprint represents a major milestone in the application's architecture.

---

# Sprint 1 — Authentication

## Status

Completed ✅

### Features

* User Registration
* User Login
* Password Hashing
* JWT Authentication
* Protected Routes
* Rate Limiting

### Endpoints

POST /api/auth/register

POST /api/auth/login

---

# Sprint 2 — Household Management

## Status

Completed ✅

### Features

* Create Household
* Join Household
* Household Membership
* Invite Codes
* Role Management

### Endpoints

POST /api/households

POST /api/households/join

GET /api/households

---

# Sprint 3 — Basic Chore Management

## Status

Completed ✅

### Features

* Create Chore
* View Household Chores
* Assignment Validation
* Difficulty Suggestions

### Endpoints

POST /api/chores

GET /api/chores

---

# Sprint 4 — Review Workflow

## Status

In Progress 🚧

### Completed

* Admin Approval
* Admin Rejection
* Feedback
* Source Tracking
* Permission Checks

### Remaining

* Completion Workflow
* Needs Improvement Workflow
* Resubmission Workflow

### Endpoints

PATCH /api/chores/:id/approve

PATCH /api/chores/:id/reject

PATCH /api/chores/:id/complete (Planned)

PATCH /api/chores/:id/resubmit (Planned)

---

# Sprint 5 — Recurring Chore Engine

## Status

Planned

### Features

* Calendar Engine
* Chore Templates
* Chore Instances
* Rotation Engine
* Workload Balancer
* Availability System
* Shared Contributors

### Planned Endpoints

POST /api/chore-templates

GET /api/chore-templates

PATCH /api/chore-templates/:id

DELETE /api/chore-templates/:id

GET /api/chore-instances

PATCH /api/chore-instances/:id/complete

PATCH /api/chore-instances/:id/reassign

---

# Sprint 6 — Household Collaboration

## Status

Planned

### Features

* Anonymous Reports
* Audit Logs
* Activity Feed
* Household Notifications

### Planned Endpoints

POST /api/reports

GET /api/reports

PATCH /api/reports/:id/review

GET /api/activity

---

# Sprint 7 — Analytics

## Status

Planned

### Features

* Leaderboards
* Monthly Reports
* Member Statistics
* Household Statistics
* Difficulty Analytics
* Completion Rate

### Planned Endpoints

GET /api/leaderboard

GET /api/statistics/member/:id

GET /api/statistics/household/:id

GET /api/reports/monthly

---

# Sprint 8 — Productivity

## Status

Planned

### Features

* Reminder Notifications
* Smart Suggestions
* Streak System
* Achievements
* Badges

---

# Sprint 9 — Administration

## Status

Planned

### Features

* Household Settings
* Invite Management
* Chore Categories
* Permission Management
* Backup & Restore

---

# Future Ideas

* AI workload balancing
* Smart difficulty prediction
* Voice reminders
* Mobile application
* Offline support
* Family calendar integration

---

# Current Progress

Authentication

██████████ 100%

Households

██████████ 100%

Basic Chores

██████████ 100%

Review Workflow

████████░░ 80%

Recurring Engine

░░░░░░░░░░ 0%

Collaboration

░░░░░░░░░░ 0%

Analytics

░░░░░░░░░░ 0%

# TaskForce API Roadmap

This document tracks the backend API that exists in the repository today and separates it from proposed endpoints.

All household, chore, and recurring-chore endpoints are authenticated. Household-specific operations also enforce membership and role permissions.

---

# Sprint 1 — Authentication

**Status: Completed**

### Implemented
- User registration
- User login
- Password hashing
- JWT authentication
- Protected routes
- Login rate limiting

### Routes
| Method | Endpoint |
|---|---|
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |
| GET | `/api/auth/profile` |

---

# Sprint 2 — Household Management

**Status: Completed**

### Implemented
- Create household
- Join household using invite code
- Household membership
- Admin/member roles

### Routes
| Method | Endpoint |
|---|---|
| POST | `/api/households` |
| POST | `/api/households/join` |
| GET | `/api/households/me` |

---

# Sprint 3 — Basic Chore Management

**Status: Implemented**

### Implemented
- Create chores
- List household chores
- Admin assignment to household members
- Member-submitted chores
- Assignment and membership validation

### Routes
| Method | Endpoint |
|---|---|
| POST | `/api/chores` |
| GET | `/api/chores?householdId=:id` |

---

# Sprint 4 — Chore Review Lifecycle

**Status: Completed**

### Implemented
- Admin approval
- Admin rejection
- Distinct `needs-improvement` approval state
- Member resubmission from `needs-improvement` or `rejected`
- Admin re-review after resubmission
- Feedback and persisted `reviewHistory`
- Assigned-member completion for admin-assigned chores
- Household, admin, and assigned-member permission checks
- Explicit transition guards and integration tests

### Routes
| Method | Endpoint |
|---|---|
| PATCH | `/api/chores/:id/approve` |
| PATCH | `/api/chores/:id/reject` |
| PATCH | `/api/chores/:id/resubmit` |
| PATCH | `/api/chores/:id/complete` |

The approve endpoint accepts `needsImprovement: true` to move a pending member submission into the distinct `needs-improvement` state. An approval marks a member-submitted chore completed. A rejected or needs-improvement submission can only be resubmitted by its assigned member and returns to `pending` for another admin review.

See [chore-lifecycle.md](chore-lifecycle.md) for the state transitions and [system-workflows.md](system-workflows.md) for system-level behavior.

---

# Sprint 5 — Recurring Chore Engine

**Status: Completed**

### Implemented
- Recurring chore templates
- Daily, weekly, monthly, and yearly recurrence
- Historical `Chore` occurrences
- Fixed assignment and workload-aware rotation
- Difficulty-weighted balancing
- Manual, normal, and recovery generation
- Idempotent occurrence creation
- Scheduler with atomic claims and processing leases
- Bounded catch-up and per-template failure isolation

### Routes
| Method | Endpoint |
|---|---|
| POST | `/api/recurring-chores` |
| GET | `/api/recurring-chores` |
| GET | `/api/recurring-chores/:id` |
| PATCH | `/api/recurring-chores/:id` |
| DELETE | `/api/recurring-chores/:id` |
| POST | `/api/recurring-chores/:id/generate` |

---

# Sprint 6 — Household Collaboration

**Status: Planned**

### Proposed features
- Anonymous reports
- Audited identity access
- Activity feed
- Household notifications
- Optional proof uploads

No Sprint 6 API routes are implemented yet.

---

# Sprint 7 — Analytics

**Status: Planned**

### Proposed features
- Leaderboards
- Monthly reports
- Member statistics
- Household statistics
- Difficulty analytics
- Completion rates

No Sprint 7 API routes are implemented yet.

---

# Sprint 8 — Productivity

**Status: Planned**

### Proposed features
- Reminder notifications
- Smart suggestions
- Streaks
- Achievements and badges

---

# Sprint 9 — Administration

**Status: Planned**

### Proposed features
- Household settings
- Invite management and expiry
- Chore categories
- Permission management
- Backup and restore

---

# Current implementation summary

| Area | Status |
|---|---|
| Authentication | Completed |
| Household management | Completed |
| Basic chore APIs | Implemented |
| Chore review lifecycle | Completed |
| Recurring chore engine | Completed |
| Collaboration | Planned |
| Analytics | Planned |
| Productivity | Planned |
| Administration | Planned |

# TaskForce Roadmap

This roadmap records implemented backend capabilities separately from work that is still planned. A feature is not considered complete merely because it appears in an architectural decision or future design.

## Release readiness — In Progress

- [x] Correct the server to read the standard `PORT` environment variable.
- [x] Align project and API documentation with the implemented routes.
- [x] Add automated CI coverage for the Node.js test suite and MongoDB integration tests.
- [ ] Review production environment configuration and deployment settings.
- [ ] Perform a final end-to-end API review against a clean database.

---

## Sprint 1 — Authentication <badge>Completed</badge>

- User registration and login
- Password hashing
- JWT authentication
- Protected routes
- Login rate limiting

## Sprint 2 — Household Management <badge>Completed</badge>

- Household creation
- Invite-code joining
- Household membership
- Admin/member roles

## Sprint 3 — Basic Chore Management <badge>Implemented</badge>

- Create and list chores
- Admin assignment to household members
- Member-submitted chores
- Difficulty suggestions
- Household membership checks

## Sprint 4 — Chore Review Lifecycle <badge color="warning">In progress</badge>

### Implemented
- Admin approval
- Admin rejection and feedback
- Completion endpoint for the assigned member
- Source tracking and household permission checks

### Remaining
- Define a distinct needs-improvement state and its transitions.
- Add a resubmission endpoint and admin re-review flow.
- Add explicit transition validation and lifecycle regression tests.
- Decide whether lifecycle history should be persisted separately.

## Sprint 5 — Recurring Chore Engine <badge>Completed</badge>

### Implemented
- Recurring chore templates
- Daily, weekly, monthly, and yearly schedules
- Historical `Chore` occurrence records linked to templates
- Fixed assignment and workload-aware rotation
- Difficulty-weighted workload balancing
- Normal, recovery, and manual generation
- Idempotent occurrence creation and a unique template/occurrence index
- Scheduler with atomic claims and processing leases
- Bounded 30-day catch-up
- Per-template failure isolation
- Recurring chore API

### Verification
- Unit, model, service, and API test coverage
- Optional MongoDB integration coverage using `TEST_MONGO_URI`
- Persistence, unique-index, scheduler lease, idempotency, and catch-up checks

---

## Sprint 6 — Household Collaboration <badge color="secondary">Planned</badge>

- Optional proof uploads
- Household notifications
- Activity feed
- Anonymous reports
- Audited administrative actions

## Sprint 7 — Analytics <badge color="secondary">Planned</badge>

- Leaderboards
- Member and household statistics
- Completion rates
- Difficulty and workload analytics
- Monthly reports

## Sprint 8 — Productivity <badge color="secondary">Planned</badge>

- Reminder notifications
- Streaks and achievements
- Badges
- Smart suggestions

## Sprint 9 — Administration <badge color="secondary">Planned</badge>

- Household settings
- Invite management and expiry
- Chore categories
- Fine-grained permissions
- Backup and restore

## Later ideas

- AI-assisted workload suggestions
- Smart scheduling
- Mobile client
- Offline support
- Family calendar integration

These ideas remain proposals until they have requirements, implementation, and tests.

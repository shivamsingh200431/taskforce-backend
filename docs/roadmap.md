# TaskForce Roadmap

## ✅ Sprint 1
- User Authentication
- JWT
- Login
- Registration

---

## ✅ Sprint 2
- Households
- Invite System

---

## ✅ Sprint 3
- Chore Management
- Approval / rejection workflow
- Chore completion lifecycle

---

## 🟢 Sprint 5 — Recurring Chore Engine

### Core implementation
- Recurring chore templates
- Daily / weekly / monthly / yearly recurrence
- Historical Chore instances
- Fixed assignment
- Workload-aware rotation
- Difficulty-weighted balancing
- Manual / normal / recovery generation
- Idempotent occurrence creation
- Scheduler with atomic claims and leases
- 30-day bounded catch-up
- Failure isolation
- Recurring chore API surface

### Verification
- Unit, service, model, API, and MongoDB integration coverage
- Real persistence and unique-index verification via TEST_MONGO_URI
- Scheduler lease, idempotency, catch-up, and terminal-state coverage
- Sprint 5 implementation complete; release cleanup remains

---

## 🔜 Sprint 6
- Optional Proof Uploads
- Notifications
- Activity Feed

---

## 🔮 Future
- Leaderboards
- Household Statistics
- Difficulty Balancing
- Monthly Reports
- AI Suggestions
- Smart Scheduling
- Household Insights

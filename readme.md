# TaskForce Backend

TaskForce is a household chore management backend built with **Node.js**, **Express 5**, **MongoDB**, and **Mongoose**. It supports user authentication, household membership, chore review, and scheduled recurring chores.

> **Project status:** Active development. The recurring chore engine is implemented. The chore review lifecycle and production-readiness work are still being completed.

## Implemented features

### Authentication
- User registration and login
- Password hashing
- JWT-protected routes
- Login rate limiting
- Authenticated profile endpoint

### Household management
- Create a household
- Join a household using an invite code
- View the authenticated user's households
- Household-scoped admin/member permissions

### Chore management
- Create and list household chores
- Admin assignment to household members
- Member-submitted chores for admin review
- Admin approval or rejection with feedback
- Assigned-member completion endpoint

### Recurring chore engine
- Recurring templates with daily, weekly, monthly, and yearly schedules
- Fixed assignment or workload-aware rotation
- Difficulty-weighted workload balancing
- Historical chore occurrences
- Normal, recovery, and manual generation
- Idempotent occurrence creation
- Scheduler with atomic claims, processing leases, and bounded catch-up
- Per-template failure isolation

## API routes

All routes except registration and login require authentication where indicated.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/profile` | Read the authenticated profile |
| POST | `/api/households` | Create a household |
| POST | `/api/households/join` | Join a household |
| GET | `/api/households/me` | List the user's households |
| POST | `/api/chores` | Create/submit a chore |
| GET | `/api/chores?householdId=:id` | List household chores |
| PATCH | `/api/chores/:id/approve` | Approve a submitted chore |
| PATCH | `/api/chores/:id/reject` | Reject a submitted chore |
| PATCH | `/api/chores/:id/complete` | Mark an assigned chore complete |
| POST | `/api/recurring-chores` | Create a recurring template |
| GET | `/api/recurring-chores` | List recurring templates |
| GET | `/api/recurring-chores/:id` | Read a recurring template |
| PATCH | `/api/recurring-chores/:id` | Update a recurring template |
| DELETE | `/api/recurring-chores/:id` | Delete a recurring template |
| POST | `/api/recurring-chores/:id/generate` | Generate an occurrence manually |

The recurring-chore routes are protected by authentication. Household membership and role checks are applied by the relevant controllers/services.

## Tech stack

- Node.js (ES modules)
- Express 5
- MongoDB and Mongoose
- JSON Web Tokens
- bcryptjs
- dotenv
- express-rate-limit
- date-fns and date-fns-tz

## Getting started

### Requirements
- Node.js compatible with the installed dependencies
- MongoDB connection string

### Install

```bash
git clone https://github.com/shivamsingh200431/taskforce-backend.git
cd taskforce-backend
npm ci
```

### Configure environment

Copy `.env.example` to `.env` and set the values:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
```

### Run locally

```bash
npm run dev
```

The server connects to MongoDB, runs an initial recurring-chore scheduler tick, then starts the scheduler loop and HTTP server.

## Tests

Run the test suite:

```bash
npm test
```

The MongoDB integration tests use a separate `TEST_MONGO_URI`. Set it to a disposable test database before running:

```bash
npm run test:integration
```

When `TEST_MONGO_URI` is not set, those integration tests are skipped. Never point it at a database containing data you need to keep.

## Project structure

```text
src/
├── config/
├── constants/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
└── server.js

tests/
├── controllers/
├── integration/
├── models/
└── services/

docs/
```

## Current roadmap

- **Completed:** Authentication, household management, basic chore APIs, recurring chore engine.
- **In progress:** Explicit needs-improvement and resubmission workflow; final release hardening.
- **Planned:** Proof uploads, notifications, activity feed, audit logs, analytics, and productivity features.

See [docs/roadmap.md](docs/roadmap.md) and [docs/api-roadmap.md](docs/api-roadmap.md) for the detailed status.

## Project

Repository: https://github.com/shivamsingh200431/taskforce-backend

Author: **Shivam Singh**

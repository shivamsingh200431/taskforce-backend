# TaskForce Architecture

## Overview

TaskForce is a modular backend built with Node.js, Express 5, MongoDB, and Mongoose. It separates HTTP routing, authentication and authorization middleware, controllers, domain services, and persistence models.

The architecture is intentionally incremental: simple flows can remain in controllers while recurring-chore generation and scheduler behavior live in dedicated services.

---

## High-level request flow

```text
Client
  |
  v
Express Routes
  |
  v
Authentication / Permission Middleware
  |
  v
Controllers
  |
  +--> Domain Services (where business logic is shared or complex)
  |
  v
Mongoose Models
  |
  v
MongoDB
  |
  v
HTTP Response
```

## Source structure

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
```

## Responsibilities

### Routes
Routes define HTTP methods, paths, and middleware composition. They should not contain domain logic.

### Middleware
Middleware handles cross-cutting request concerns such as JWT authentication, login rate limiting, and access checks.

### Controllers
Controllers coordinate request handling: validate request data, invoke the appropriate model or service operations, and return HTTP responses. Complex reusable business rules belong in services.

### Services
Services contain domain operations that need to be reused, tested independently, or coordinated across multiple models.

The recurring-chore service handles occurrence generation and assignment decisions. The recurring scheduler service finds due templates, claims work atomically with a processing lease, invokes the generation service, and records scheduler progress.

### Models
Mongoose models define persisted domain structures and indexes. Important models include User, Household, Membership, Chore, and RecurringChoreTemplate.

## Authentication and authorization

Authentication uses JWTs. Protected routes use the authentication middleware to resolve the current user.

Authorization is household-scoped and based on Membership records. The current roles are Admin and Member. Admin-only actions must verify the user's role in the target household rather than trusting a role supplied by the client.

## Chore model

A Chore is an actual chore record. It may be a one-time chore or a generated occurrence linked to a recurring template. Historical occurrences are retained rather than resetting a single document for every recurrence.

## Recurring-chore architecture

```text
RecurringChoreTemplate
        |
        v
Recurrence calculation
        |
        v
Assignment selection
        |
        v
Chore occurrence
        |
        v
Member completion / review
```

The template stores recurrence and assignment rules. Each generated Chore stores the occurrence's identity and its own snapshot of the chore details.

The scheduler runs after MongoDB connects. The server performs an initial scheduler tick and then starts the recurring scheduler loop. The scheduler uses atomic claims and time-limited leases to avoid processing the same due template concurrently. Catch-up is bounded to avoid unbounded historical generation.

## Design principles

- Preserve historical records.
- Keep household authorization explicit.
- Make recurring generation idempotent.
- Keep scheduler failures isolated by template.
- Keep controllers focused on request/response coordination.
- Avoid adding infrastructure before the product requirements need it.

## Planned domains

The following are roadmap items, not currently implemented subsystems:

- Notifications
- Proof uploads
- Activity feed and audit logs
- Reports and anonymous reporting
- Analytics and leaderboards
- Workload redistribution based on availability

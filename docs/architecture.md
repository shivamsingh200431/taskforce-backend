# TaskForce Architecture

## Overview

TaskForce follows a modular backend architecture built with Node.js, Express.js, and MongoDB.

The application separates responsibilities into models, controllers, middleware, routes, utilities, and future services to keep the codebase scalable and maintainable.

---

# High Level Architecture

Client

↓

Routes

↓

Middleware

↓

Controllers

↓

Services (Future)

↓

Database

↓

Response

---

# Folder Structure

```
src/
│
├── config/
│
├── controllers/
│
├── middleware/
│
├── models/
│
├── routes/
│
├── services/        (Future)
│
├── utils/
│
└── server.js
```

---

# Responsibilities

## Routes

Routes only define endpoints.

Responsibilities:

* Receive requests
* Apply middleware
* Call controllers

Routes should never contain business logic.

---

## Middleware

Middleware performs work before controllers execute.

Examples:

* Authentication
* Rate Limiting
* Input Validation
* Logging (Future)

Middleware should not contain business logic.

---

## Controllers

Controllers coordinate application flow.

Responsibilities:

* Validate request
* Call business logic
* Return response

Controllers should remain lightweight.

---

## Services (Future)

Services contain business logic.

Examples:

Calendar Engine

Rotation Engine

Notification Service

Workload Balancer

Controllers should eventually delegate complex operations to services.

---

## Models

Models define database structure.

Each model should represent one domain concept.

Examples:

User

Household

Membership

Availability

Chore Template

Chore Instance

Report

Audit Log

---

# Authentication Flow

User Login

↓

Password Verification

↓

Generate JWT

↓

Client Stores Token

↓

Protected Requests

↓

Auth Middleware

↓

Controller

---

# Authorization

Authorization is household based.

Permissions are determined using Membership records.

Roles:

Admin

Member

Future:

Moderator (Optional)

---

# Recurring Chore Architecture

Recurring chores are separated into two parts.

Template

↓

Calendar Engine

↓

Chore Instance

↓

Member Completion

↓

Reports

↓

Leaderboards

↓

Statistics

The template defines recurring behavior.

Instances preserve history.

---

# Rotation Architecture

Rotation Engine

↓

Checks Available Members

↓

Determines Next Assignment

↓

Returns Assignment

↓

Calendar Engine Creates Instance

The Rotation Engine does not create chores.

It only determines assignment.

---

# Workload Balancing

If members become unavailable:

Availability

↓

Workload Balancer

↓

Suggested Distribution

↓

Admin Review (Optional)

↓

Chore Instances

Automatic balancing should always allow manual admin override.

---

# Reporting Architecture

Member

↓

Anonymous Report

↓

Report Queue

↓

Admin Review

↓

Optional Identity Request

↓

Audit Log

Reporter identity is stored securely.

Identity access is logged.

---

# Core Principles

Single Responsibility

Each module should perform one responsibility only.

History Preservation

Historical data should never be overwritten.

Automation

Automate repetitive work while keeping important decisions under human control.

Fairness

Workloads should remain balanced whenever possible.

Transparency

Users should understand why decisions were made.

Accountability

Sensitive actions should always leave an audit trail.

---

# Future Architecture

As TaskForce grows, additional services will be introduced.

Examples:

Notification Service

Statistics Service

Leaderboard Service

Reminder Scheduler

Calendar Engine

Rotation Engine

Workload Balancer

These services should remain independent and communicate through well-defined interfaces rather than tightly coupling business logic across controllers.

# 🏠 TaskForce Backend

TaskForce is a household chore management backend built with **Node.js**, **Express.js**, and **MongoDB**.

The goal of TaskForce is to make household management fair by assigning chores, tracking completion, reviewing member submissions, and maintaining accountability through a role-based workflow.

> **Project Status:** 🚧 Active Development

---

# Features

## Authentication

- User Registration
- User Login
- JWT Authentication
- Password Hashing using bcrypt
- Login Rate Limiting
- Protected Routes

---

## Household Management

- Create Household
- Join Household using Invite Code
- View User Households
- Admin & Member Roles

---

## Chore Management

### Admin

- Create Chores
- Assign Chores to Household Members
- Approve Member Submitted Chores
- Reject Member Submitted Chores
- Edit Title
- Edit Description
- Adjust Difficulty

### Members

- Submit Completed Chores
- Suggest Difficulty
- View Household Chores
- Receive Feedback from Admin

---

## Permission System

Role-based authorization using household memberships.

- Admin
- Member

---

## Current API

### Authentication

| Method | Endpoint |
|---------|----------|
| POST | /api/auth/register |
| POST | /api/auth/login |

---

### Households

| Method | Endpoint |
|---------|----------|
| POST | /api/households |
| POST | /api/households/join |
| GET | /api/households |

---

### Chores

| Method | Endpoint |
|---------|----------|
| POST | /api/chores |
| GET | /api/chores |
| PATCH | /api/chores/:id/approve |
| PATCH | /api/chores/:id/reject |

---

# Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- bcrypt
- dotenv
- express-rate-limit

---

# Database Models

Current Models:

- User
- Household
- Membership
- Chore

---

# Chore Workflow

## Admin Assigned

```text
Admin
   │
   ▼
Assign Chore
   │
   ▼
Member Completes
   │
   ▼
Admin Reviews
```

---

## Member Submitted

```text
Member
   │
   ▼
Submit Chore
   │
   ▼
Pending Review
   │
 ┌─┴─────────┐
 │           │
 ▼           ▼
Approve    Reject
```

---

# Planned Features

## Sprint 4

- Chore Approval
- Chore Rejection
- Completion Workflow

## Sprint 5

- Recurring Chore Engine
- Rotation System
- Calendar Awareness
- Chore Templates
- Chore Instances

## Sprint 6

- Optional Proof Uploads
- Notifications
- Activity Feed

## Sprint 7

- Leaderboards
- Household Statistics
- Difficulty Balancing
- Monthly Reports

---

# Future Architecture

Recurring chores will be redesigned using:

- Chore Templates
- Chore Instances

This preserves historical data for:

- Leaderboards
- Audit Trails
- Calendar View
- Proof History
- Analytics

instead of overwriting previous completions.

---

# Environment Variables

Create a `.env` file.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key
```

---

# Installation

```bash
git clone https://github.com/shivamsingh200431/taskforce-backend.git

cd taskforce-backend

npm install

npm run dev
```

---

# Project Structure

```
src/
│
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
└── server.js
```

---

# Vision

TaskForce is being designed as more than a simple CRUD application.

The long-term vision is to build a fair household management platform featuring:

- Intelligent chore rotation
- Calendar-based recurring chores
- Optional proof verification
- Gamification through leaderboards
- Historical analytics
- Role-based household management

---

# Author

**Shivam Singh**

Backend Developer (Learning Project)

GitHub:
https://github.com/shivamsingh200431
# TaskForce Engineering Principles

These principles guide how TaskForce is developed. Every contribution to the project should follow these standards to keep the codebase clean, maintainable, and scalable.

---

## 1. Single Source of Truth

A value should exist in only one place.

Examples include:
- Constants
- Configuration
- Utility functions

Avoid duplicating values throughout the codebase.

✅ Good

```js
COMPLETION_STATUS.PENDING
```

❌ Bad

```js
"pending"
```

---

## 2. Boy Scout Rule

> Always leave the code a little cleaner than you found it.

Whenever modifying an existing file:

- Replace magic strings with constants.
- Improve variable names.
- Remove dead code.
- Improve readability.
- Add missing validation where appropriate.

Small improvements made consistently are better than large refactoring sessions.

---

## 3. Don't Break Working Code

Avoid unnecessary rewrites.

If existing code works and isn't related to the current task, leave it alone.

Refactor code naturally when working on that file.

---

## 4. Build for Today, Design for Tomorrow

Design with future growth in mind, but only implement features that are currently required.

Avoid overengineering.

---

## 5. No Magic Strings

Business values should always come from constants.

Examples:

- Statuses
- Roles
- Frequencies
- Categories
- Assignment strategies

---

## 6. Self-Documenting Code

Code should explain itself whenever possible.

Prefer descriptive variable and function names over comments.

---

## 7. Validate at the Lowest Responsible Layer

Validation priority:

1. Database Schema
2. Service Layer
3. Controller
4. Frontend

Never trust client input.

---

## 8. Thin Controllers

Controllers should only:

- Receive requests
- Validate input
- Call services
- Return responses

Business logic belongs inside services.

---

## 9. Consistency Over Cleverness

Follow existing project patterns.

A consistent codebase is easier to maintain than a clever one.

---

## 10. Security by Default

Always assume user input is untrusted.

Use:

- Authentication
- Authorization
- Validation
- Rate limiting
- Environment variables

Never expose sensitive information.

---

## 11. Documentation is Part of Development

Architecture decisions should be documented.

If a decision is important enough to discuss, it is important enough to document.

---

## 12. Test Before Merge

Every new feature should be:

- Implemented
- Reviewed
- Tested
- Documented

before being considered complete.
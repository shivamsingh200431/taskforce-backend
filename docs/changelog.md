# Changelog

## Unreleased — Chore Review Lifecycle and Release Cleanup

### Fixed
- Server configuration now reads and parses the standard `PORT` environment variable.

### Added
- Distinct `needs-improvement` review status for member-submitted chores.
- Member resubmission from both rejected and needs-improvement states.
- Review history entries that retain earlier feedback and admin decisions.
- `PATCH /api/chores/:id/resubmit` with assigned-member and household-membership checks.
- MongoDB-backed integration coverage for chore review transitions, authorization, and admin-assigned completion.
- GitHub Actions workflow for automated Node.js and MongoDB-backed test execution.
- Separate MongoDB databases for integration suites to prevent cross-suite test data interference.

### Changed
- Refreshed the README, API roadmap, architecture, workflow, and database documentation to match implemented routes and model names.
- Clarified that availability-based redistribution, shared contributors, reporting, notifications, and collaboration features remain planned.

### Verification
- Release cleanup: 62 tests passed, 0 failed, 0 skipped on Node.js 22 and MongoDB 7.0.
- Chore review lifecycle: 69 tests passed, 0 failed, 0 skipped on Node.js 22 and MongoDB 7.0.

---

## v0.5.0 — Recurring Chore Engine

### Added
- Recurring chore templates and calendar recurrence rules.
- Historical recurring Chore instances with occurrence identity.
- Fixed and workload-aware rotation assignment.
- Difficulty-weighted current workload and recent assignment history.
- Manual, normal, and recovery generation paths.
- Idempotent occurrence creation with a unique template/occurrence constraint.
- MongoDB atomic scheduler claiming with five-minute processing leases.
- Bounded 30-day catch-up and per-template scheduler failure isolation.
- Recurring chore API route surface.
- Unit coverage for recurrence, assignment, workload, instance generation, scheduler, and lease behavior.
- Optional MongoDB integration coverage for real persistence and unique-index behavior.

### Changed
- Existing Chore and supporting modules were aligned with the repository's ESM configuration.
- Recurring templates retain scheduler state independently from historical Chore instances.

### Verification
- Unit, model, service, API, and MongoDB integration coverage was added for the recurring chore engine.
- The integration suite uses a dedicated `TEST_MONGO_URI` and verifies real persistence, unique-index, and scheduler state behavior.

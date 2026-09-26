# Changelog

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
- Recurring templates now retain scheduler state independently from historical Chore instances.

### Verification
- Unit, model, service, API, and MongoDB integration coverage was added for the recurring chore engine.
- The integration suite uses a dedicated TEST_MONGO_URI and verifies real persistence, unique-index, and scheduler state behavior.

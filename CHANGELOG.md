# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.1] — 2026-07-24

### Fixed

- Login response contract: `user.type` → `user.role` in `services/auth.ts`, shared types, test assertions
- Auth test assertions updated to match `role` field
- `closeDb()` in `sqljs-adapter.ts` now nulls the `db` variable to prevent stale closed-DB reuse
- Session restoration: `AuthContext` now verifies stored tokens via `GET /api/auth/me` on page load

### Added

- Test DB auto-setup: `tests/helpers/setupDb.ts` runs migration + seed in-memory per worker
- `vitest.config.ts` env vars: `NODE_ENV=test`, `JWT_SECRET`, `DATABASE_PATH` for test isolation
- `skipClose` option on `migrate()` and `seed()` for programmatic usage without closing DB
- `SqlJsDatabase | null` typing on `db` variable for proper nullability

### Changed

- `migrate.ts` and `seed.ts` export their functions; auto-execution gated by `require.main === module`

### Removed

- Redundant `process.env.JWT_SECRET` overrides in all 4 integration test files

## [0.1.0] — 2026-07-22

### Added

- Project foundation established
- Architecture document (ARCHITECTURE.md)
- Engineering principles (PRINCIPLES.md)
- Development phases (PHASES.md)
- Implementation roadmap (ROADMAP.md)
- AI agent conventions (AGENTS.md)
- Repository structure design (docs/repository-structure.md)
- Coding standards (docs/coding-standards.md)
- Git branching strategy (docs/git-strategy.md)
- Environment strategy (docs/environment-strategy.md)
- CI/CD pipeline design (docs/ci-cd.md)
- Dependency management policy (docs/dependency-management.md)
- Documentation standards (docs/documentation-standards.md)
- Logging and error handling standards (docs/logging-error-handling.md)
- Configuration conventions (docs/configuration.md)
- Security baseline requirements (docs/security-baseline.md)
- Testing standards (docs/testing-standards.md)
- Definition of Done checklist (docs/definition-of-done.md)
- Contributing guide (CONTRIBUTING.md)
- Security policy (SECURITY.md)

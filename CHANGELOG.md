# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] — 2026-07-24

### Added

- API service layer (`apiService.ts`) with typed wrappers for all 23 backend endpoints
- 7 new frontend pages: StudentDashboard, FacultyDashboard, AdminDashboard, StudentsPage, CategoriesPage, SessionsPage, ActivityLogsPage
- Role-based navigation in Layout (student/faculty/admin each see different nav items)
- RoleRoute guard component for role-gated pages
- Dashboard dispatcher that renders role-appropriate dashboard
- Admin dashboard with live stats (students, categories, sessions counts)
- Student dashboard with active session status + session history table
- Faculty dashboard with active/pending sessions overview + scanner link
- Students management page: paginated list, status filter, create form, suspend/depart actions
- Categories management page: list with inline edit, create form, archive action
- Sessions management page: status filter, complete-with-summary modal, archive action
- Activity Logs page: actor-type filter, paginated audit trail table

### Fixed

- Activity log snake_case→camelCase conversion (`created_at`→`createdAt`, `actor_type`→`actorType`, etc.)
- Session list snake_case→camelCase conversion (`student_roll`→`studentRoll`, `student_name`→`studentName`)
- Student history snake_case→camelCase conversion (`category_name`→`categoryName`)
- AuthContext null token TypeScript error (`saved.token!` assertion)

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

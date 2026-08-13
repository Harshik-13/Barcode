# Agent Context File

This file documents conventions and instructions for AI agents working on the Hive (workspace attendance) system.

## Project Identity

This is the **Hive (workspace attendance) system** — NOT a hostel meal attendance system. The domain is workspace attendance for startup environments.

**Status: ReadyVersion-1.4** — All development phases complete. System is production-ready and running. Google OAuth migration complete (phases 1–6 implemented: `/api/auth/google`, JWKS verification, `users.google_sub` migration, student auto-provisioning, faculty/admin binding, legacy auth removal). Phase 7 (regression testing) complete. UI polish pass complete — fixed misleading stats, removed non-functional controls, aligned with DESIGN.md flat/hairline doctrine, extracted inline styles, improved notification readability. New features should follow existing patterns and maintain backward compatibility.

## Source of Truth

- `ARCHITECTURE.md` — Locked architecture, domain model, workflows
- `PRINCIPLES.md` — Engineering principles, security, definition of done
- `AGENTS.md` — This file: agent conventions

## Key Directives

### Before Implementation

1. Read the existing code first. Understand patterns before changing them.
2. Check if existing components can be reused before creating new ones.

### During Implementation

1. No architectural changes without approval.
2. No product decisions without the architect.
3. Server-side validation is mandatory for all inputs.
4. Authorization checks on every endpoint.
5. Use transactions for session state changes (race condition prevention).
6. Prefer existing patterns over new patterns.

### After Implementation

1. Verify existing functionality is preserved.
2. Check for remaining hostel/meal references.
3. Run tests if available.
4. No commits unless explicitly asked.

## Common Terms Mapping

| Old (Hostel) | New (Workspace) |
|---|---|
| Hostel | Workspace |
| Meal | Work session |
| Food type | Work category |
| Warden/security | Faculty |
| Scan (meal) | Session entry/exit |
| Breakfast/Lunch/Dinner | Coding/Design/Research/etc |
| Meal time window | Workspace hours |
| Duplicate meal | Double entry/exit prevention |

## Testing Notes

- Tests use PostgreSQL database `workspace_test` (configured in `vitest.config.ts` via `DATABASE_URL`).
- The test suite is **idempotent** — all 177 tests pass whether run once or repeatedly.
- Each test file cleans up its own test-specific data in `beforeAll`:
  - `tests/scan.integration.test.ts` — deletes `workspace_sessions`, `notifications`, `activity_logs`, `faculty_notifications`
  - `tests/domain.integration.test.ts` — deletes `workspace_sessions`, `notifications`, `activity_logs`, test-created students
  - `tests/domain-extended.integration.test.ts` — deletes `workspace_sessions`, `notifications`, `activity_logs`, `faculty_notifications`, test-created faculty users
  - `tests/googleAuth.integration.test.ts` — deletes its `*.google@vnrvjiet.in` test users/students in `afterAll`
  - `tests/migration.integration.test.ts` — deletes its test-created users in `afterAll` (verify `google_sub` column + unique index, idempotency)
- Seeded data (students, categories, users) is preserved and reused across test files.
- Run `node scripts/create-test-db.js` from `backend/` to create the test database if missing.

## Google OAuth Migration Notes

- `AUTH_MIGRATION_GOOGLE_OAUTH.md` is the **single source of truth** for the auth migration (phases 1–6 implemented: `/api/auth/google`, JWKS verification, `users.google_sub` migration, student auto-provisioning, faculty/admin binding, legacy auth removal).
- **Both login paths must work until Phase 6** — never remove email/password or OTP/activation flow before then.
- `users.google_sub` is the permanent Google identity binding (unique, NULL for legacy users); it must NOT be written until Phase 5 (faculty/admin binding) and must be matched before email fallback.
- All Google token verification is **server-side only** (JWKS RS256: `iss`, `aud`, `exp`, `iat`, `email_verified`, domain allowlist + `hd`). Never trust client-supplied profile data.
- New test JWKS is served by a local HTTP server in `googleAuth.integration.test.ts`; set `GOOGLE_JWKS_URI` to it in tests.
- `/api/auth/google` must stay behind the auth rate limiter.

## Production Hardening Notes

- IDOR protection middleware (`requireOwnStudentResource`) must be applied to all student-scoped endpoints
- Session transitions must use `SELECT ... FOR UPDATE` row locking to prevent race conditions
- All search endpoints must have a `LIMIT` clause (max 20 results)
- Camera scanner must handle tab visibility changes (`visibilitychange` event)
- Graceful shutdown handlers (`SIGTERM`/`SIGINT`) must close HTTP server and DB connections
- Stats polling intervals should be reasonable (no less than 60s)

## Verification Checklist

Before completing any task:
- [ ] Does the code follow existing patterns?
- [ ] Is authorization enforced?
- [ ] Is input validated server-side?
- [ ] Are hostel/meal terms removed?
- [ ] Are race conditions handled?
- [ ] Is IDOR protection applied where needed?
- [ ] Are search queries bounded?
- [ ] Are camera/scanner lifecycle events handled?
- [ ] Are tests passing?

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [ReadyVersion-1.2] — 2026-08-11

### Added

- **Google OAuth Phase 2 — backend** — `services/googleAuth.ts`: `verifyGoogleIdToken` (cryptographic verification against Google JWKS via jwks-rsa + jsonwebtoken RS256: issuer, audience, exp/iat, `email_verified === true`, domain allowlist with `hd` check) and `loginWithGoogleToken` (email+`hd` domain gate, inactive-account rejection, `GOOGLE_LOGIN`/`GOOGLE_LOGIN_FAILED`/`GOOGLE_LOGIN_REJECTED_DOMAIN` audit). New `POST /api/auth/google` endpoint behind the auth rate limiter. `signToken` exported and shared `buildLoginResponse` helper extracted in `services/auth.ts` (password login refactored onto it — behavior identical).
- **Google OAuth Phase 2 — frontend** — "Continue with Google" button (Google Identity Services) + "or sign in with email" divider on `Login.tsx`, rendered only when `VITE_GOOGLE_CLIENT_ID` is set; `AuthContext.loginWithGoogle` and `authApi.googleLogin` (same session handling as login). Email/password path untouched — **both login paths work during Phase 2**.
- **Google OAuth Phase 3 — database migration** — `users.google_sub TEXT` (nullable) + unique index `idx_users_google_sub` in `db/migrate.ts` (idempotent; legacy rows unaffected — all `google_sub` NULL). Pre-migration dump: `backend/backups/workspace-pre-google-sub-*.dump`.
- **Tests** — `tests/googleAuth.integration.test.ts` (19 tests: faculty/admin/student success, invalid domain, unverified email, wrong aud/iss, expired/future/tampered tokens, suspended/unknown accounts, audit trail) and `tests/migration.integration.test.ts` (4 tests: column, unique index, idempotency, NULL + duplicate rejection).

### Changed

- **Config** — `config.googleAuth` block (`clientId`, `jwksUri` overridable via `GOOGLE_JWKS_URI` for tests, `allowedDomains` from `ALLOWED_EMAIL_DOMAINS`); `rateLimit.authMax` from `AUTH_RATE_LIMIT_MAX`.
- **Shared constants** — new error codes `DOMAIN_NOT_ALLOWED`, `ACCOUNT_NOT_FOUND_OR_INACTIVE`, `IDENTITY_CONFLICT`.
- **Test count** — backend suite 160 → 183 tests across 13 suites.

### Security

- Google ID token verified **server-side only** (JWKS signature, `iss`, `aud`, `exp`, `iat`, `email_verified`, domain). Client never supplies profile data.
- Domain gate rejects every account outside `@vnrvjiet.in` with `DOMAIN_NOT_ALLOWED` (audited as `GOOGLE_LOGIN_REJECTED_DOMAIN`).
- `/api/auth/google` inherits the same `authLimiter` protection as `/auth/login`.

### Verified (E2E, live Google account)

- Real OAuth client + authorized JS origin `http://localhost:5173`; full Google sign-in (2FA + consent) posts a real ID token; backend cryptographically verifies it and rejects `@gmail.com` with `DOMAIN_NOT_ALLOWED`; UI shows "Only @vnrvjiet.in accounts can sign in."; audit row written.

## [ReadyVersion-1.1] — 2026-07-26

### Fixed

- **CRITICAL — Scan network error**: `submitScan` in `scanService.ts` was using `fetch('/api/scan', ...)` with a relative URL, making it dependent on the Vite dev proxy. Replaced with the centralized `api()` client from `api.ts` which uses `VITE_API_BASE_URL` for absolute URLs and inherits retry logic (2 retries on `TypeError`) and shared auth token management.

### Removed

- **Stale design docs and legacy code**: Removed `docs/` (67 design-phase artifacts), `passport/` (68 legacy files), `PHASES.md`, and `ROADMAP.md` from the repo.

### Changed

- **Installation guide**: `create-db.js`/`create-test-db.js` now read `DATABASE_URL` from env instead of hardcoded password. Quick Start steps fixed to run scripts from `backend/`. Added frontend `.env` setup step.

## [ReadyVersion-1.0] — 2026-07-26

### Added

- **Change Password** (`PATCH /api/profile/change-password`) — Authenticated users can change their password with bcrypt verification, password policy enforcement (8+ chars, uppercase, lowercase, digit, special), and session invalidation via `password_changed_at` mechanism
- **Forgot Password** (`POST /api/auth/forgot-password`) — Email-based password reset with SHA-256 hashed tokens, 15-minute expiry, anti-enumeration (always returns same message), and rate limiting
- **Reset Password** (`POST /api/auth/reset-password`) — Token-based password reset with single-use tokens, atomic transaction (password update + token invalidation + session invalidation), and reuse of `password_changed_at` mechanism
- **Password Reset Tokens table** — `password_reset_tokens` with bcrypt-free SHA-256 hashing, opportunistic cleanup of stale/used tokens, and automatic invalidation of previous unused tokens on new request
- **Frontend Security section** — Change Password form in Profile page with show/hide toggle
- **Forgot Password page** — Email input with consistent response message
- **Reset Password page** — Token-based form with show/hide password toggle and redirect to login
- **"Forgot password?" link** on Login page

### Security

- Reset tokens use SHA-256 with `crypto.timingSafeEqual` (constant-time comparison)
- Existing unused tokens are deleted before creating new ones
- Expired/used tokens cleaned up opportunistically
- All existing sessions invalidated on password change/reset via `password_changed_at` JWT claim verification

## [working-mvp-v-0-1-with-student-side-updation] — 2026-07-26

### Fixed

- **CRITICAL — Notification identity mismatch**: notification routes (`GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`) were querying with `users.id` instead of `students.id`. Added `resolveStudentId()` helper in `services/student.ts` that resolves `users.id` → `students.id` via the `JOIN students s ON s.email = u.email` pattern already used by the IDOR middleware. Student dashboard now correctly shows live notifications and unread counts after entry/exit scans.

### Changed

- Pre-existing TypeScript build errors fixed: `getDb` import added to `routes/sessions.ts`, `req.params` type coercion in `middleware/auth.ts`

## [production-mvp-1] — 2026-07-25

### Added

- **Session Statistics Endpoint** (`GET /sessions/stats/:studentId`) — total sessions, total duration, category breakdown, streak calculation
- **Duration tracking** — `durationSeconds` field in all session responses for real-time elapsed time display
- **Paginated Student History** (`getStudentHistory()`) with `page`, `limit`, `total`, `totalPages`
- **Faculty Review Endpoint** (`POST /sessions/:id/review`) — faculty can approve/reject sessions with feedback, includes audit logging
- **Notification calls** in `startSession`, `exitSession`, `manualExitSession` (formerly only in scan route)
- **Force-exit dialog** in Scanner — "Force Exit" button appears on `SUMMARY_REQUIRED`/`DUPLICATE_SCAN` errors, calls `manualExit` with reason
- **Camera tab-visibility handling** — pauses scanner when tab hidden, resumes when visible

### Changed

- **StudentDashboard** — stats cards with `formatDuration()`, paginated history table, stats fetched every 60s instead of 5s
- **FacultyDashboard** — date range/status filters, paginated historical sessions, paginated student history with duration column, category filter support
- **Scanner.tsx** — replaced state-based scanner instance with ref-based `scannerInstanceRef` + `mountedRef` guard to prevent duplicate camera streams
- **scanService.ts error parsing** — now handles all 4xx status codes and preserves `details` from backend
- **Backend scan route errors** — responses now include `message` and `details` for force-exit dialog

### Security

- **CRITICAL — User/Student ID mismatch resolved**: `authenticate()` now queries `SELECT id FROM students WHERE email = $1` for student users; returns `studentId` in auth response; frontend `AuthContext` updated to use `user.studentId ?? user.id`
- **HIGH — IDOR protection**: new `requireOwnStudentResource` middleware resolves student ownership via email join; applied to `GET /students/:id`, `GET /students/:id/history`, `GET /sessions/active/:studentId`, `GET /sessions/stats/:studentId`; inline checks for `GET /sessions` and `GET /sessions/:id`
- **HIGH — Race condition fix**: `transition()` now uses `SELECT ... FOR UPDATE` row lock + checks `rowCount` on update to prevent concurrent transitions from overwriting each other
- **MEDIUM — Search limit**: `searchStudents()` limited to 20 rows to prevent unbounded queries
- **MEDIUM — Graceful shutdown**: `SIGTERM`/`SIGINT` handlers call `closeDb()` before exit
- **MEDIUM — Stats polling frequency**: reduced from 5s to 60s to reduce server load

## [0.4.0] — 2026-07-24

### Added

- **Secure Student Account Activation** — multi-step OTP-based activation flow
- `activation_otps` database table with OTP hash, expiry, attempts counter, activation token
- `services/email.ts` — Email service for OTP delivery (console-logged, SMTP-ready)
- `services/activation.ts` — Full activation business logic: start, verify OTP, set password, resend
- 5 endpoints under `/api/activation`: `start`, `verify-otp`, `set-password`, `resend-otp`, `status`
- OTP security: bcrypt hashed, 10min expiry, max 5 attempts, 30s cooldown, single-use
- Server-side email derivation: `roll@vnrvjiet.in` (configurable via `STUDENT_EMAIL_DOMAIN`)
- Login now supports roll number → auto-derives college email
- Frontend `ActivatePage.tsx` — 3-step wizard: Roll → OTP → Password
- Resend cooldown with visual countdown timer
- "Activate your account" link on Login page
- 15 integration tests covering all security requirements
- Configurable via env vars: `STUDENT_EMAIL_DOMAIN`, `OTP_EXPIRY_MINUTES`, `OTP_MAX_ATTEMPTS`, `ACTIVATION_COOLDOWN_SECONDS`

### Security

- OTP hashed with bcrypt (10 rounds) — never stored in plaintext
- Activation token is a cryptographic random 32-byte hex string
- Multiple rate limit layers: global (100/min), per-endpoint, OTP attempt limit (5), cooldown (30s)
- Password set endpoint is gated behind OTP verification — never accessible with roll number alone
- Existing login flow unchanged: admin/faculty/student email+password login continues to work identically

## [0.3.0] — 2026-07-24

### Added

- Notification system: `services/notification.ts` with `createNotification`, `getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`
- 4 notification endpoints: `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`
- Auto-notifications on scan entry (`"Entry recorded..."`), scan exit (`"Session exited — submit summary"`), session complete, session archive
- Student can now call `PATCH /api/sessions/:id/complete` on own sessions (with `requireOwnership` middleware)
- `NotificationsPage.tsx` — full notification center with mark-read, mark-all-read, session links
- `SessionDetailPage.tsx` — session detail view + summary submission form for `awaiting_summary` status
- Student dashboard rewrite — 3-card grid: active session, pending summaries, recent notifications widget
- Notification bell with live unread badge in Layout header (30s auto-poll)
- `notificationsApi` in frontend API service layer

### Changed

- `PATCH /api/sessions/:id/complete` now accepts `student` role with ownership verification
- `StudentDashboard.tsx` now shows pending summaries and recent notifications alongside active session
- `Layout.tsx` — notification bell icon + nav link for student role
- `App.tsx` — new routes: `/notifications`, `/sessions/:id`

### Fixed

- N/A (all changes are additive)

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

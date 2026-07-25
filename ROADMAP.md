# 8Hour Workspace Attendance System — Adaptation Roadmap

This roadmap aligns with the [7 development phases](PHASES.md). Current phase: **Phase 7 — Production Readiness ✅ Complete**. Tag: `production-mvp-1`.

---

## Phase 1: Foundation ✅ Completed

**Tag:** `v0.1.0-foundation`

### Deliverables Produced

| Area | Documents |
|------|-----------|
| Project structure | `docs/repository-structure.md` |
| Coding standards | `docs/coding-standards.md` |
| Git workflow | `docs/git-strategy.md`, `CONTRIBUTING.md` |
| Environment strategy | `docs/environment-strategy.md` |
| CI/CD design | `docs/ci-cd.md` |
| Dependency management | `docs/dependency-management.md` |
| Documentation standards | `docs/documentation-standards.md` |
| Logging & error handling | `docs/logging-error-handling.md` |
| Configuration conventions | `docs/configuration.md` |
| Security baseline | `docs/security-baseline.md`, `SECURITY.md` |
| Testing standards | `docs/testing-standards.md` |
| Definition of Done | `docs/definition-of-done.md` |
| Architecture | `ARCHITECTURE.md` |
| Engineering principles | `PRINCIPLES.md` |
| Development phases | `PHASES.md` |
| AI agent conventions | `AGENTS.md` |

---

## Phase 2: Domain Design ✅ Completed

**Tag:** `v0.2.0-domain-design`

### Deliverables Produced

| Document | Covers |
|----------|--------|
| `docs/domain/domain-definition.md` | Purpose, scope, boundaries, primary entity |
| `docs/domain/actors.md` | Student, Faculty, Admin, System roles |
| `docs/domain/entities.md` | 7 business entities with attributes and lifecycle |
| `docs/domain/relationships.md` | Entity relationships and business rationale |
| `docs/domain/ownership.md` | Ownership matrix (create, modify, view, delete) |
| `docs/domain/business-rules.md` | 45 business rules across all entities |
| `docs/domain/lifecycles.md` | 5-state session lifecycle with transition diagrams |
| `docs/domain/permissions.md` | Full capability matrix per actor × entity |
| `docs/domain/validation.md` | 33 business validation rules |
| `docs/domain/constraints.md` | 12 invariant rules |
| `docs/domain/business-events.md` | 17 business events with triggers and effects |
| `docs/domain/edge-cases.md` | 22 edge cases with expected behavior |
| `docs/domain/glossary.md` | Standardized vocabulary and term usage rules |

### Key Business Decisions Incorporated

- Category is mandatory for session completion
- Summary grace period with auto-completion
- Manual exit as exceptional Faculty action
- Formal 5-state lifecycle: Created → Active → Awaiting Summary → Completed → Archived
- Completion Reason: NORMAL, AUTO_COMPLETED, MANUAL_EXIT, ADMIN_OVERRIDE

---

## Phase 3: System Design ✅ Completed

**Tag:** `v0.3.0-system-design`

### Deliverables Produced

| Document | Covers |
|----------|--------|
| `docs/workflows/user-workflows.md` | 9 user workflows with step-by-step flows and error handling |
| `docs/workflows/system-workflows.md` | 3 system workflows: auto-completion, archival, reminders |
| `docs/workflows/sequence-diagrams.md` | 14 sequence diagrams covering all workflows |
| `docs/architecture/component-architecture.md` | Component diagram, layer responsibilities, key design decisions |
| `docs/architecture/module-responsibilities.md` | 4 modules with endpoints, responsibilities, key patterns |
| `docs/architecture/data-flow.md` | Entry/exit/summary/notification/auto-completion data flows |
| `docs/architecture/notification-flow.md` | Notification creation, delivery, read lifecycle |
| `docs/architecture/error-flow.md` | Error propagation, recovery strategies, user-facing error patterns |
| `docs/architecture/integration-architecture.md` | Identity provider, notification delivery, background jobs |
| `docs/architecture/architecture-decisions.md` | 10 key ADRs with context, decision, consequences |

---

## Phase 4: Data & API Design ✅ Completed

**Tag:** `v0.4.0-data-api-design`

### Deliverables Produced

| Document | Covers |
|----------|--------|
| `docs/data-api/data-model.md` | Logical data model with attributes, types, enums |
| `docs/data-api/database-schema.md` | Full relational schema with 8 tables, PKs, FKs |
| `docs/data-api/entity-relationships.md` | ER diagram, cardinality, cascade rules |
| `docs/data-api/constraints.md` | Business constraints, referential integrity, immutable records |
| `docs/data-api/index-strategy.md` | 30+ indexes with workflow justification |
| `docs/data-api/data-lifecycle.md` | Lifecycle for all entities, archival policy, cleanup jobs |
| `docs/data-api/api-inventory.md` | 40 endpoints across 9 modules |
| `docs/data-api/api-contracts.md` | Every endpoint with method, path, request/response schemas |
| `docs/data-api/validation-contracts.md` | Field rules, business validations, ownership, duplicate prevention |
| `docs/data-api/authorization-matrix.md` | Per-endpoint permissions for Student/Faculty/Admin |
| `docs/data-api/error-contracts.md` | Standardized error format, 30+ error codes |
| `docs/data-api/query-contracts.md` | Pagination, sorting, filtering, rate limiting, caching |
| `docs/data-api/audit-contracts.md` | 20 logged actions, retention, visibility, sensitivity rules |
| `docs/data-api/integration-contracts.md` | JWT, bcrypt, background jobs, CORS, rate limit headers |
| `docs/data-api/api-versioning.md` | URL path versioning, deprecation policy, backward compatibility |

---

## Phase 5: UI/UX Design ✅ Completed

**Tag:** `v0.5.0-ui-ux-design`

### Deliverables Produced

| Document | Covers |
|----------|--------|
| `docs/ui-ux/information-architecture.md` | App structure, nav maps per role, screen hierarchy, PWA identity |
| `docs/ui-ux/screen-inventory.md` | 28 screens across Auth/Student/Faculty/Admin/System |
| `docs/ui-ux/ui-flows.md` | 10 complete flows with decision points and failure paths |
| `docs/ui-ux/wireframes.md` | Text-based wireframes for all 28 screens |
| `docs/ui-ux/component-library.md` | 14 reusable components with variants, states, usage rules |
| `docs/ui-ux/design-system.md` | Typography, spacing, grid, color roles, elevation, icons, motion |
| `docs/ui-ux/responsive-design.md` | 4 breakpoints, PWA-specific behavior, QR/Barcode viewfinder adaptation |
| `docs/ui-ux/accessibility.md` | WCAG 2.1 AA, keyboard nav, focus management, screen reader, contrast |
| `docs/ui-ux/feedback-states.md` | Success/warning/info/confirmation/progress/validation patterns |
| `docs/ui-ux/loading-states.md` | Page/form/dashboard/report/background loading with timing |
| `docs/ui-ux/empty-states.md` | 8 empty states with action buttons |
| `docs/ui-ux/error-states.md` | 8 error states with recovery actions |
| `docs/ui-ux/notification-ux.md` | HTTP polling (30s), badge, toast, reminder timing, future migration path |
| `docs/ui-ux/dashboards.md` | Student/Faculty/Admin dashboards with widgets, metrics, quick actions |
| `docs/ui-ux/ux-guidelines.md` | PWA guidelines, scanner mode guidelines, global UX rules |

### Implementation Decisions Locked

| Decision | Value |
|----------|-------|
| Application type | Progressive Web App (PWA) — single React codebase |
| Scanner format | Dual: QR Code + 1D Barcode, user-selectable toggle |
| Notification delivery | HTTP polling at 30s interval (MVP), WebSocket/SSE future |

---

## Phase 6: Implementation ✅ Complete

**Tag:** `v0.4.0` (sub-tag: `production-mvp-1` for production hardening)

### Work Package 6.1 — Database & Auth ✅

- [x] Create `backend/` project with Express + SQLite
- [x] Create migration script with new schema
- [x] Add tables: `roles`, `users`, `categories`, `workspace_sessions`, `notifications`, `activity_logs`
- [x] Deprecate legacy `scans`, `devices`, `memberships` tables
- [x] Seed data: default roles, default categories, admin user
- [x] Add role field to JWT payload
- [x] Create auth middleware with role checking
- [x] Update `/api/auth/login` to return role

### Work Package 6.2 — Session Management API ✅

- [x] `POST /api/scan` — Faculty/Admin scans barcode for entry/exit
- [x] `POST/PATCH /api/sessions` — CRUD with state machine (created → active → awaiting_summary → completed → archived)
- [x] `GET /api/sessions/active/:studentId` — Check active session
- [x] `GET /api/students/:id/history` — Session history
- [x] `GET /api/categories` — List work categories
- [x] `GET/POST/PUT/PATCH /api/categories` — Full CRUD with archive
- [x] `POST /api/students` + lookup/search — Student management
- [x] Notification endpoints (via activity logs)

### Work Package 6.3 — Frontend ↔ Backend Alignment ✅

- [x] Frontend API service layer with typed wrappers for all 23 endpoints
- [x] Role-based dashboards: Student (current session + history), Faculty (active sessions + scanner link), Admin (stats + quick links)
- [x] Students management page: paginated list, create, suspend, depart
- [x] Categories management page: list, create, inline edit, archive
- [x] Sessions management page: status filter, complete-with-summary modal, archive
- [x] Activity Logs page: actor-type filter, paginated audit trail
- [x] Role-based navigation: each role sees only their relevant pages
- [x] Full role guards (RoleRoute) on admin-gated pages
- [x] Backend snake_case→camelCase conversion for all API responses
- [x] 101/101 tests passing, frontend + backend builds clean

### Work Package 6.4 — Security Hardening ✅

- [x] Rate limiting on all endpoints
- [x] Input sanitization and validation
- [x] Ownership verification middleware
- [x] Duplicate scan prevention (race condition safe)
- [x] Concurrent request handling with transactions
- [x] Audit logging for all state changes

### Work Package 6.5 — Testing ✅

- [x] Unit tests for session state machine
- [x] Unit tests for auth middleware
- [x] Integration tests for entry/exit flow
- [x] Integration tests for role enforcement
- [x] Authorization tests (every role × every endpoint)
- [x] Post-Milestone 4 stabilization (10-step audit, 101/101 tests)

### Work Package 6.6 — Polish ✅

- [x] Loading and empty states on all new pages
- [x] Error handling with user-facing messages
- [x] Pagination on list pages (students, sessions, activity logs)
- [x] Confirmation dialogs for destructive actions (suspend, depart, archive)
- [x] Inline edit mode for categories
- [x] Complete-with-summary modal for sessions
- [x] Removed remaining hostel/meal references in codebase
- [x] Integration contract fixes (login response `type`→`role`, session restoration, test DB auto-setup)
- [x] Backend snake_case→camelCase conversion for all list/history endpoints

### Work Package 6.7 — Student Experience & Notification System ✅

- [x] Notification service (`services/notification.ts`) — `createNotification`, `getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`
- [x] Notification routes (`routes/notifications.ts`) — 4 endpoints under `/api/notifications`
- [x] Auto-create notifications on scan entry/exit and session complete/archive
- [x] Student session complete via `PATCH /api/sessions/:id/complete` with ownership check
- [x] Frontend notification center (`NotificationsPage.tsx`) — full list, mark read, mark all read
- [x] Student dashboard rewrite with active session card, pending summaries, recent notifications widget
- [x] Session detail page (`SessionDetailPage.tsx`) — session details + summary submission form
- [x] Notification bell + live unread badge in Layout for students (30s polling)
- [x] Frontend API layer — `notificationsApi` with all 4 endpoints
- [x] All 34 backend endpoints consumed by frontend — 100% alignment
- [x] 101/101 tests passing, frontend + backend builds clean

### Work Package 6.9 — Session Stats & Faculty Dashboard Expansion ✅

- [x] `GET /sessions/stats/:studentId` — per-student stats: total sessions, total duration, category breakdown, streaks
- [x] `durationSeconds` added to all session responses
- [x] `getStudentHistory()` with pagination for student's past sessions
- [x] StudentDashboard stats cards (total sessions, hours, category breakdown, streak count)
- [x] `formatDuration()` utility for human-readable time display
- [x] FacultyDashboard: date range filters, status filters, paginated historical sessions, paginated student history with duration column, category filter
- [x] `POST /sessions/:id/review` — faculty review endpoint with validation and audit logging
- [x] Force-exit dialog in Scanner for `SUMMARY_REQUIRED`/`DUPLICATE_SCAN` errors
- [x] Ref-based scanner instance fix (`scannerInstanceRef`) to prevent duplicate camera streams
- [x] Notification calls added to `startSession`, `exitSession`, `manualExitSession` code paths
- [x] scanService.ts error parsing handles 4xx and preserves `details` from backend
- [x] Stats fetched every 60s instead of 5s on StudentDashboard
- [x] All 160 tests passing

### Work Package 6.10 — Production Hardening ✅

- [x] **CRITICAL — User/Student ID mismatch**: `authenticate()` queries `students` table by email, returns `studentId` in auth response; frontend uses `user.studentId ?? user.id`
- [x] **HIGH — IDOR protection**: `requireOwnStudentResource` middleware applied to all student-scoped endpoints; inline ownership checks for `GET /sessions` and `GET /sessions/:id`
- [x] **HIGH — Race condition fix**: `FOR UPDATE` row lock in `transition()` + rowCount check on update
- [x] **MEDIUM — Search limit**: `LIMIT 20` on `searchStudents()`
- [x] **MEDIUM — Graceful shutdown**: `SIGTERM`/`SIGINT` handlers with HTTP drain + DB close
- [x] **MEDIUM — Camera tab visibility**: `visibilitychange` listener pauses/resumes scanner
- [x] **MEDIUM — Stats polling**: reduced from 5s to 60s
- [x] All 160 tests passing idempotently
- [x] Tagged `production-mvp-1`

---

**Milestone 5.5** — Students can securely activate their own accounts via OTP verification without admin-set passwords.

- [x] `activation_otps` table with OTP hash, attempts, expiry, activation token
- [x] Email service (`services/email.ts`) — OTP delivery (logged to console, extensible for SMTP)
- [x] Activation service (`services/activation.ts`) — `startActivation`, `verifyOtp`, `setPassword`, `resendOtp`, `checkActivationStatus`
- [x] 5 activation endpoints under `/api/activation` — start, verify-otp, set-password, resend-otp, status
- [x] OTP hashed with bcrypt before storage
- [x] OTP expiry (10min), max attempts (5), cooldown (30s), single-use
- [x] New OTP invalidates previous OTPs
- [x] Server-side email derivation: `roll@vnrvjiet.in` (configurable domain)
- [x] Password set only after OTP verification (activation token gated)
- [x] Activation token expires after password set
- [x] Login now accepts roll number (derives college email automatically)
- [x] Frontend multi-step activation wizard (`ActivatePage.tsx`) — roll → OTP → password → done
- [x] Cooldown timer with visual countdown on resend
- [x] "Activate your account" link on Login page
- [x] Designed for future Forgot Password reuse (same OTP framework)
- [x] 15 comprehensive activation tests (valid/invalid/expired/used/rate-limited)
- [x] 116/116 tests passing, zero regressions, both builds clean

---

## Phase 7: Production Readiness ✅ Complete

**Tag:** `production-mvp-1`

### Completed

- [x] **Security audit** — comprehensive review of all endpoints (see Session 3 audit findings):
  - IDOR protection added (`requireOwnStudentResource` middleware)
  - User/Student ID mapping fixed in authentication
  - Race condition prevention with `SELECT ... FOR UPDATE`
  - Search query bounded to 20 results
- [x] **Graceful shutdown** — `SIGTERM`/`SIGINT` handlers with HTTP drain, DB close, and force timeout
- [x] **Resource usage optimization** — stats polling reduced from 5s to 60s, camera pauses when tab hidden
- [x] **Deployment readiness** — all 160 tests pass idempotently, PostgreSQL production database supported
- [x] **Release checklist** — automated via `production-mvp-1` tag

---

## Migration Notes

### What to Reuse (Don't Rewrite)

| Legacy Code | Reuse As |
|-------------|----------|
| CameraScanner.tsx | Faculty barcode scanner (unchanged) |
| GoogleLogin.tsx | Auth component (unchanged) |
| ReportsView.tsx | Analytics reports (adapted) |
| IndexedDB wrapper (idb.ts) | Offline storage (unchanged) |
| Service worker (sw.ts) | PWA offline support (unchanged) |
| PWA manifest | Single app manifest (updated) |
| API auth middleware pattern | Role-based auth (extended) |
| Database connection (db.js) | Database access (unchanged) |

### What to Remove

- Hostel roster text files (BH1, GH1) — or repurpose as student roster
- Meal time configuration variables
- Meal type selection UI
- Hostel selector dropdown
- QR generation in student app
- Demo/dev tools for QR secrets

### What to Rename

- `scans` → `workspace_sessions`
- `foodType` → `categoryId`
- `hostelId` → (removed)
- `device` → (removed)
- `mode` (meal/Hostel In) → `session_type` (entry/exit)

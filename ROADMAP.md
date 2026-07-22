# 8Hour Workspace Attendance System — Adaptation Roadmap

This roadmap aligns with the [7 development phases](PHASES.md). Current phase: **Phase 3 — System Design**.

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

## Phase 3: System Design

User workflows, system workflows, component architecture, data flow, sequence diagrams, offline strategy.

---

## Phase 4: Data & API Design

Database schema, API contracts, request/response schemas, validation rules, authorization matrix.

---

## Phase 5: UI/UX Design

Wireframes, navigation maps, component library, responsive layouts, loading/empty/error states.

---

## Phase 6: Implementation

### Work Package 6.1 — Database & Auth

- [ ] Create `backend/` project with Express + SQLite
- [ ] Create migration script with new schema
- [ ] Add tables: `roles`, `users`, `categories`, `workspace_sessions`, `notifications`, `activity_logs`
- [ ] Deprecate legacy `scans`, `devices`, `memberships` tables
- [ ] Seed data: default roles, default categories, admin user
- [ ] Add role field to JWT payload
- [ ] Create auth middleware with role checking
- [ ] Update `/api/auth/login` and `/api/auth/google` to return role

### Work Package 6.2 — Session Management API

- [ ] `POST /api/session/entry` — Faculty creates pending session
- [ ] `POST /api/session/exit` — Faculty closes active session
- [ ] `GET /api/session/active/{roll}` — Check active session
- [ ] `GET /api/session/history/{roll}` — Session history
- [ ] `GET /api/categories` — List work categories
- [ ] `POST /api/session/category` — Student selects category
- [ ] `POST /api/session/summary` — Student submits summary
- [ ] `GET /api/session/summary/{sessionId}` — View summary
- [ ] Notification endpoints (fetch, mark read)

### Work Package 6.3 — Single PWA Restructure

- [ ] Create `frontend/` project (React + Vite + TypeScript)
- [ ] Merge passport-pwa + vjscanner-pwa into single app
- [ ] Role-based routing (student / faculty / admin)
- [ ] Shared component library

### Work Package 6.4 — Student Dashboard

- [ ] Dashboard homepage with active session status
- [ ] Work category selector
- [ ] Notification list
- [ ] Attendance history
- [ ] Streaks and statistics

### Work Package 6.5 — Faculty Scanner

- [ ] Camera scanning (reuse html5-qrcode from legacy)
- [ ] Entry/exit mode toggle (replace meal type selector)
- [ ] Live occupancy count
- [ ] Student search
- [ ] Reports and analytics (adapted from legacy ReportsView)

### Work Package 6.6 — Admin Panel

- [ ] User management (CRUD for faculty accounts)
- [ ] Category management
- [ ] Workspace settings
- [ ] Global analytics dashboard

### Work Package 6.7 — Security Hardening

- [ ] Rate limiting on all endpoints
- [ ] Input sanitization and validation
- [ ] Ownership verification middleware
- [ ] Duplicate scan prevention (race condition safe)
- [ ] Concurrent request handling with transactions
- [ ] Audit logging for all state changes

### Work Package 6.8 — Testing

- [ ] Unit tests for session state machine
- [ ] Unit tests for auth middleware
- [ ] Integration tests for entry/exit flow
- [ ] Integration tests for role enforcement
- [ ] Concurrency tests (race conditions)
- [ ] Authorization tests (every role × every endpoint)

### Work Package 6.9 — Polish

- [ ] Loading states and UX feedback
- [ ] Offline support for faculty scanning
- [ ] PWA manifest update
- [ ] Remove all remaining hostel/meal references
- [ ] Error boundary implementation
- [ ] Final cleanup

---

## Phase 7: Production Readiness

- [ ] Security audit
- [ ] Performance optimization and load testing
- [ ] Monitoring and logging review
- [ ] Backup and disaster recovery plan
- [ ] Deployment guide
- [ ] Release checklist
- [ ] Operational documentation review

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

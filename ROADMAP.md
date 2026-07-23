# 8Hour Workspace Attendance System — Adaptation Roadmap

This roadmap aligns with the [7 development phases](PHASES.md). Current phase: **Phase 6 — Implementation**.

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

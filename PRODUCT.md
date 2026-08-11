# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Students** — workspace participants at the incubator. They arrive after classwork, get scanned in/out by faculty, pick a work category, submit summaries, and check their history, streaks, and notifications on their phones.
- **Faculty** — staff who scan student barcodes at entry/exit, monitor live occupancy, search students, and review sessions.
- **Admin** — system administrators who manage students, faculty, categories, sessions, activity logs, and global configuration.

## Product Purpose

A role-based platform that records student attendance and daily work activity inside a college startup workspace ("8Hour Workspace"). It exists so faculty and admin know who is actually working in the workspace on a given day, what category of work they are doing, and for how long — with the student side staying in the loop through notifications, summaries, and their own statistics.

## Positioning

The workspace is a physical place, and the product is its accountability layer: instead of a generic time-in/time-out punch clock, every visit becomes a **session** (entry → work category → exit → summary) that the student sees in real time and faculty can review and correct. The distinguishing fact is the session lifecycle: nothing is recorded by students themselves — only faculty scanning makes a visit real, which keeps attendance trustworthy.

## Operating Context

- **Daily rhythm:** students stay in the workspace up to 8 PM after their classwork; the product's daily usage centers on that afternoon/evening window.
- **Entry flow:** faculty scans the student's barcode → a session starts (status PENDING) → the student receives a notification and selects today's work category → the session becomes ACTIVE.
- **Exit flow:** faculty scans again → session closes → the student submits a work summary → session COMPLETED.
- **Only faculty scan.** Students never scan; their phones are used for notifications, category selection, summary submission, dashboards, and history.
- **Demo environment:** seeded demo accounts exist (admin/faculty/student) and tests run against a separate `workspace_test` database.

## Capabilities and Constraints

- Role-based dashboards (Student / Faculty / Admin) in a single React PWA.
- Camera-based barcode/QR scanning via `html5-qrcode`, with tab-visibility handling and offline scan queueing.
- Session state machine: PENDING → ACTIVE → COMPLETED, with auto-completion and manual/override exits.
- Real-time notifications (in-app + push) for entry/exit/completion/archive; faculty notifications as well.
- Student statistics: duration, streaks, category breakdown; faculty analytics and reports; admin audit trail.
- Management: students (create, suspend, depart, bulk `.xlsx` import), categories, sessions (archive/override/review), faculty, activity logs.
- Account lifecycle: Google OAuth migration in progress (phases 1–3: `/api/auth/google`, JWKS verification, `users.google_sub`; see `AUTH_MIGRATION_GOOGLE_OAUTH.md`); legacy OTP-based student activation, password change/reset remain active until Phase 6.
- Security baseline: JWT auth, rate limiting, server-side validation, IDOR protection via ownership middleware, row-level locking for race-condition prevention, audit logging, bounded search (max 20 results).
- **Architecture is locked:** single React PWA, single Express REST API, single PostgreSQL database. No separate apps, no new stacks.
- Terminology is workspace/session-based; hostel/meal concepts were deliberately removed and must not return.

## Brand Commitments

None binding. The product currently goes by the name "8Hour Workspace" (title, manifest, theme color #2563EB) but the owner has explicitly marked all visual identity negotiable.

## Evidence on Hand

- `README.md` — features, quick start, tech stack, default credentials.
- `ARCHITECTURE.md` — locked architecture, domain model, session states, full API surface (43 endpoints), database schema, design decisions.
- `PRINCIPLES.md` — engineering and security principles.
- `CHANGELOG.md` — version history and rationale.
- Seed data (`backend/src/db/seed.ts`): demo users (admin@workspace.com, faculty@workspace.com, student@workspace.com), demo students, work categories (Coding, Design, Research).
- 183 passing integration tests across 13 suites against a `workspace_test` PostgreSQL database.
- No logo files or brand kit exist in the repository.

## Product Principles

1. **Sessions, not punches.** A visit is a full lifecycle (entry → category → exit → summary), not a timestamp; every transition is a deliberate, authorized action.
2. **Faculty-scan authority.** Trust comes from scanning, not self-reporting — students can view and contribute, but only faculty/admin can change session state.
3. **The student stays informed.** Every state change is communicated to the student (in-app and push notifications) so the workspace feels transparent, not surveilled.
4. **Rapid entry/exit at the door.** The scanner flow must be fast and unambiguous — entry/exit, occupancy, and duplicate handling must never make a faculty member hesitate at the gate.
5. **Correctable history.** Faculty review, admin override, and audit logs exist so the record can always be repaired and explained.

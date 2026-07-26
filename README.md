# 8Hour Workspace Attendance System

Role-based platform that records student attendance and daily work activity inside the startup workspace.

![Status](https://img.shields.io/badge/status-production-brightgreen)
![Tests](https://img.shields.io/badge/tests-160%20passing-brightgreen)
![Phase](https://img.shields.io/badge/phase-7%20Complete-brightgreen)
![Tag](https://img.shields.io/badge/tag-working--mvp--v--0--1--with--student--side--updation-blue)

---

## Current Status

| Phase | Status | Tag |
|-------|--------|-----|
| 1 — Foundation | ✅ Complete | `v0.1.0-foundation` |
| 2 — Domain Design | ✅ Complete | `v0.2.0-domain-design` |
| 3 — System Design | ✅ Complete | `v0.3.0-system-design` |
| 4 — Data & API Design | ✅ Complete | `v0.4.0-data-api-design` |
| 5 — UI/UX Design | ✅ Complete | `v0.5.0-ui-ux-design` |
| **6 — Implementation** | **✅ Complete** | **`v0.4.0`** |
| **7 — Production Readiness** | **✅ Complete** | **`production-mvp-1` → `working-mvp-v-0-1-with-student-side-updation`** |

### Delivered

- Full REST API (auth, students, sessions, categories, scan, activity logs, notifications, activation, faculty review) — **43 endpoints**
- QR barcode scanning pipeline with entry/exit/summary lifecycle
- Role-based auth (admin, faculty, student) with JWT
- Secure student account activation via OTP (bcrypt hashed, 10min expiry, max 5 attempts, cooldown)
- Validation, rate limiting, audit trail, error handling
- **160 tests passing** across 11 test suites
- **Student Experience**: notification system (auto-created on entry/exit/complete/archive), notification center with unread badges, session detail page with summary submission, stats dashboard (duration, streaks, category breakdown), self-activation via OTP
- **Role-based frontend** with separate dashboards for Student, Faculty, and Admin
- **Faculty Experience**: expanded dashboard with date range/status filters, paginated historical sessions, paginated student history with duration column, category filter support, faculty review endpoint (`POST /sessions/:id/review`)
- **Management pages**: Students (list/create/suspend/depart), Categories (list/create/edit/archive), Sessions (list/filter/complete/archive), Activity Logs (filter/paginated audit trail)
- All 43 backend endpoints consumed by the UI — 100% alignment
- **PostgreSQL migration**: migrated from SQLite (sql.js) to PostgreSQL (node-postgres) with lazy pool, ended-pool recovery, timestamp string compatibility
- Backend snake_case→camelCase conversion for consistent API contracts
- **Session Stats**: per-student aggregation (total sessions, total duration, category breakdown, streaks)
- **Duration tracking**: `durationSeconds` in all session responses
- **Force-exit dialog**: Scanner shows force-exit button on `SUMMARY_REQUIRED`/`DUPLICATE_SCAN` errors
- **Production-hardened**:
  - IDOR protection via `requireOwnStudentResource` middleware on all student-scoped endpoints
  - Race condition prevention with `SELECT ... FOR UPDATE` row-level locking in session transitions
  - Student search limited to 20 results to prevent unbounded queries
  - Graceful `SIGTERM`/`SIGINT` shutdown (HTTP drain, DB close, force timeout)
  - Camera pauses on tab hidden, resumes on tab visible
  - Stats polling optimized to 60s instead of 5s
  - Notification identity mismatch fixed: notification routes now resolve `users.id` → `students.id` so student dashboards show live notifications and unread counts after every scan

---

## Quick Start

### Prerequisites

- **PostgreSQL 15+** running on `localhost:5432`
- Databases: `workspace` (main) and `workspace_test` (tests)

```bash
# Create databases
node backend/scripts/create-db.js
node backend/scripts/create-test-db.js

# Backend
cd backend
npm install
npm run build   # compile TypeScript
npm run dev     # starts on port 8080 (auto migrate + seed)

# Frontend
cd frontend
npm install
npm run dev     # starts on port 5173
```

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@workspace.com | admin123 |
| Faculty | faculty@workspace.com | faculty123 |
| Student | student@workspace.com | student123 |

### Email Setup (Gmail SMTP)

1. Generate a [Google App Password](https://myaccount.google.com/apppasswords) for `8hattendance@gmail.com`
2. Copy `.env.example` to `.env` and set:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=8hattendance@gmail.com
SMTP_PASS=<your-16-char-app-password>
SMTP_FROM="Barcode Attendance <8hattendance@gmail.com>"
```

On startup, the server runs `transporter.verify()` and logs `Gmail SMTP initialized successfully.` if credentials are valid. Invalid credentials will terminate startup with a clear error.

### Push Notification Setup (VAPID)

For push notifications (entry/exit alerts), generate VAPID keys:

```bash
cd backend
node -e "const w=require('web-push');const k=w.generateVAPIDKeys();console.log('VAPID_PUBLIC_KEY='+k.publicKey);console.log('VAPID_PRIVATE_KEY='+k.privateKey)"
```

Then add to `backend/.env`:

```env
VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
VAPID_SUBJECT=mailto:admin@8hour-workspace.com
```

In development, if VAPID keys are omitted, ephemeral keys are generated on startup (subscriptions invalidate after restart). Production requires configured keys.

### Run Tests

```bash
cd backend
npm test         # runs all 160 tests (fresh DB each run)
```

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite (single PWA)
- **Backend**: Node.js + Express
- **Auth**: JWT (email/password)
- **Scanning**: html5-qrcode (camera-based QR/barcode)
- **Database**: PostgreSQL (via node-postgres)
- **Testing**: Vitest + Supertest

---

## Project Structure

```
├── backend/           # REST API server (Express + PostgreSQL)
│   ├── src/
│   │   ├── config/    # App configuration
│   │   ├── db/        # Database setup, migrations, seeds
│   │   ├── middleware/ # Auth, rate limiting, logging, security
│   │   ├── routes/    # API route handlers
│   │   ├── services/  # Business logic
│   │   └── utils/     # Validation, errors, pagination, logger
│   └── tests/         # Integration and unit tests
├── frontend/          # Single React PWA
│   └── src/
│       ├── components/# Reusable UI components
│       ├── hooks/     # Custom React hooks
│       ├── pages/     # Route pages
│       ├── services/  # API client, offline queue
│       └── store/     # Auth context
├── shared/            # Shared types, constants, validators
├── docs/              # Project documentation
└── passport/          # Legacy code (reference only)
```

---

## Core Workflow

1. **Faculty scans** student barcode → creates workspace session
2. **Faculty exits** session on second scan → session awaits summary
3. **Summary submitted** → session completed
4. **Admin** can scan, manage categories, view audit logs

---

## Documentation

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | Locked architecture, domain model, API design |
| `PRINCIPLES.md` | Engineering principles, security, definition of done |
| `ROADMAP.md` | Implementation phases and migration plan |
| `PHASES.md` | Development phase definitions and current status |
| `AGENTS.md` | Conventions for AI agents |

### Detailed (`docs/`)

| Document | Purpose |
|----------|---------|
| `repository-structure.md` | Complete folder structure and rationale |
| `coding-standards.md` | Naming, formatting, conventions |
| `git-strategy.md` | Branching, merge, and PR strategy |
| `environment-strategy.md` | Environment configuration and secrets |
| `ci-cd.md` | CI/CD pipeline design and quality gates |
| `testing-standards.md` | Test types, coverage, naming conventions |
| `definition-of-done.md` | Engineering completion checklist |
| `security-baseline.md` | Mandatory security requirements |
| `logging-error-handling.md` | Logging levels, error codes, response format |

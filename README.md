# 8Hour Workspace Attendance System

Role-based platform that records student attendance and daily work activity inside the startup workspace.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Tests](https://img.shields.io/badge/tests-101%20passing-brightgreen)
![Phase](https://img.shields.io/badge/phase-6%20Implementation-blue)

---

## Current Status

| Phase | Status | Tag |
|-------|--------|-----|
| 1 — Foundation | ✅ Complete | `v0.1.0-foundation` |
| 2 — Domain Design | ✅ Complete | `v0.2.0-domain-design` |
| 3 — System Design | ✅ Complete | `v0.3.0-system-design` |
| 4 — Data & API Design | ✅ Complete | `v0.4.0-data-api-design` |
| 5 — UI/UX Design | ✅ Complete | `v0.5.0-ui-ux-design` |
| **6 — Implementation** | **✅ Milestone 4** | **`v0.6.0-backend-impl`** |

### Milestone 4 Delivered

- Full REST API (auth, students, sessions, categories, scan, activity logs)
- QR barcode scanning pipeline with entry/exit/summary lifecycle
- Role-based auth (admin, faculty, student) with JWT
- Validation, rate limiting, audit trail, error handling
- **101 tests passing** across 9 test suites
- SPA frontend scaffold with scanner, dashboard, auth pages

---

## Quick Start

```bash
# Backend
cd backend
npm install
npm run setup    # build + migrate + seed
npm run dev      # starts on port 8080

# Frontend
cd frontend
npm install
npm run dev      # starts on port 5173
```

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@workspace.com | admin123 |
| Faculty | faculty@workspace.com | faculty123 |
| Student | student@workspace.com | student123 |

### Run Tests

```bash
cd backend
npm test         # runs all 101 tests
npm run test:scan   # scan pipeline tests only
```

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite (single PWA)
- **Backend**: Node.js + Express + better-sqlite3
- **Auth**: JWT (email/password)
- **Scanning**: html5-qrcode (camera-based QR/barcode)
- **Database**: SQLite (via sql.js)
- **Testing**: Vitest + Supertest

---

## Project Structure

```
├── backend/           # REST API server (Express + SQLite)
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

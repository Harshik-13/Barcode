# 8Hour Workspace Attendance System

Role-based platform that records student attendance and daily work activity inside the startup workspace.

## Current Phase

**Phase 1 — Foundation (Complete)**

Engineering foundation established. Ready for Phase 2 (Domain Design).

---

## Documentation

### Top-Level

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | Locked architecture, domain model, API design |
| `PRINCIPLES.md` | Engineering principles, security, definition of done |
| `ROADMAP.md` | Implementation phases and migration plan |
| `PHASES.md` | Development phase definitions and current status |
| `AGENTS.md` | Conventions for AI agents |
| `CONTRIBUTING.md` | How to contribute and code review process |
| `SECURITY.md` | Security policy and vulnerability reporting |
| `CHANGELOG.md` | Release changelog |

### Detailed Standards (`docs/`)

| Document | Purpose |
|----------|---------|
| `repository-structure.md` | Complete folder structure and rationale |
| `coding-standards.md` | Naming, formatting, conventions |
| `git-strategy.md` | Branching, merge, and PR strategy |
| `environment-strategy.md` | Environment configuration and secrets |
| `ci-cd.md` | CI/CD pipeline design and quality gates |
| `dependency-management.md` | Dependency policy and audit process |
| `documentation-standards.md` | Documentation rules and templates |
| `logging-error-handling.md` | Logging levels, error codes, response format |
| `configuration.md` | App config, feature flags, constants |
| `security-baseline.md` | Mandatory security requirements for every feature |
| `testing-standards.md` | Test types, coverage, naming conventions |
| `definition-of-done.md` | Engineering completion checklist |

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite (single PWA)
- **Backend**: Node.js + Express + better-sqlite3
- **Auth**: Google OAuth + JWT
- **Scanning**: html5-qrcode (camera-based QR/barcode)
- **Database**: SQLite

---

## Project Structure (Target)

```
├── backend/           # REST API server
├── frontend/          # Single React PWA (student + faculty + admin)
├── shared/            # Shared types, constants, validators
├── docs/              # Project documentation
├── infrastructure/    # Deployment configs
├── scripts/           # Build and utility scripts
├── tests/             # Integration and E2E tests
└── passport/          # Legacy code (reference only)
```

---

## Core Workflow

1. **Faculty scans** student barcode → creates WorkspaceSession (pending)
2. **Student notified** → selects work category → session becomes active
3. **Faculty scans** on exit → closes session
4. **Student notified** → submits work summary → session completed

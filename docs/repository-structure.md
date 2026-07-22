# Repository Structure

## Top-Level Layout

```
attendance/
├── .github/              # CI/CD workflows and GitHub configuration
├── backend/              # REST API server (Node.js + Express + SQLite)
├── docs/                 # Project documentation
├── frontend/             # Single React PWA (student + faculty + admin)
├── infrastructure/       # Deployment configs (Docker, nginx, etc.)
├── legacy/               # Reference copy of the original Campus Passport code (read-only)
├── scripts/              # Build, migration, and utility scripts
├── shared/               # Shared types, constants, and utilities
├── tests/                # Integration and E2E tests
├── AGENTS.md             # AI agent conventions
├── ARCHITECTURE.md       # Locked system architecture
├── CONTRIBUTING.md       # Contribution and review guide
├── PHASES.md             # Development phase definitions
├── PRINCIPLES.md         # Engineering principles and philosophy
├── README.md             # Project overview
├── ROADMAP.md            # Implementation roadmap
├── SECURITY.md           # Security policy and vulnerability reporting
└── CHANGELOG.md          # Release changelog
```

---

## Directory Purposes

### `backend/`

The single REST API server. Contains all server-side logic, database access, authentication, and authorization.

```
backend/
├── src/
│   ├── middleware/       # Auth, validation, rate limiting, audit middlewares
│   ├── routes/           # Express route definitions (thin — delegates to controllers)
│   ├── controllers/      # Request handling, validation, response formatting
│   ├── services/         # Business logic layer
│   ├── models/           # Database access and query logic
│   ├── validators/       # Input validation schemas
│   ├── utils/            # Shared utilities (logging, errors, crypto)
│   ├── config/           # Configuration loading and constants
│   ├── db/               # Database connection, migrations, seeds
│   └── types/            # Backend-specific TypeScript types
├── tests/                # Backend unit and integration tests
├── index.js              # Entry point
├── package.json
├── tsconfig.json
└── .env.example
```

**Why separate:** The backend has distinct concerns (auth, DB, rate limiting, session management) that don't belong in the frontend. A clean separation prevents coupling and allows independent testing.

---

### `frontend/`

The single React PWA. Serves all three roles (student, faculty, admin) via role-based routing. This replaces the two legacy PWAs (`passport-pwa` and `vjscanner-pwa`).

```
frontend/
├── public/               # Static assets, manifest.json, icons, service worker
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/       # Shared UI primitives (Button, Card, Modal, etc.)
│   │   ├── student/      # Student-only components
│   │   ├── faculty/      # Faculty-only components
│   │   └── admin/        # Admin-only components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Route-level page components
│   ├── services/         # API client, auth service, notification service
│   ├── store/            # State management (context or zustand)
│   ├── utils/            # Shared utilities
│   ├── types/            # Frontend TypeScript types
│   ├── styles/           # Global styles, theme, design tokens
│   ├── App.tsx           # Root component with role-based routing
│   └── main.tsx          # Entry point
├── tests/                # Frontend component and integration tests
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env.example
```

**Why single PWA:** The locked architecture mandates a single PWA. Students, faculty, and admin all access the same application; role-based routing renders the appropriate interface. This eliminates code duplication and ensures a consistent auth layer.

---

### `shared/`

Code shared between frontend and backend. Both `backend/` and `frontend/` import from here.

```
shared/
├── types/                # Shared domain types (Session, User, Category, etc.)
├── constants/            # Shared constants (role IDs, status enums, error codes)
├── validators/           # Shared validation rules (used by both client and server)
└── utils/                # Shared pure utilities (date formatting, string utils)
```

**Why shared:** Avoids duplicating type definitions and validation logic across frontend and backend. Single source of truth for domain types.

---

### `docs/`

All project documentation outside the top-level files.

```
docs/
├── repository-structure.md    # This file
├── coding-standards.md        # Naming, formatting, conventions
├── git-strategy.md            # Branching and merge strategy
├── environment-strategy.md    # Environment configuration
├── ci-cd.md                   # CI/CD pipeline design
├── dependency-management.md   # Dependency policy
├── documentation-standards.md # Documentation rules
├── logging-error-handling.md  # Logging and error conventions
├── configuration.md           # App configuration conventions
├── security-baseline.md       # Security requirements for every feature
├── testing-standards.md       # Testing conventions and coverage
└── definition-of-done.md      # Engineering completion checklist
```

---

### `infrastructure/`

Deployment and infrastructure configuration. Not for application code.

```
infrastructure/
├── docker/               # Dockerfiles
├── nginx/                # Nginx site configs
├── scripts/              # Deployment scripts
└── monitoring/           # Monitoring config examples
```

---

### `scripts/`

Utility scripts for common tasks.

```
scripts/
├── migrate.sh            # Run database migrations
├── seed.sh               # Seed initial data
├── build.sh              # Full project build
├── lint.sh               # Run linter across all projects
└── clean.sh              # Clean build artifacts
```

---

### `tests/`

Integration and end-to-end tests that span multiple layers. Unit tests live alongside the code they test.

```
tests/
├── integration/          # Cross-layer integration tests
├── e2e/                  # Playwright/Cypress E2E tests
└── fixtures/             # Test data and mocks
```

---

### `legacy/`

Read-only reference copy of the original Campus Passport code. Preserved for reference during adaptation. Not modified.

```
legacy/
├── passport-pwa/
├── vjscanner-pwa/
├── api-server/
└── hostel-data/
```

---

## Key Design Rules

1. **No circular dependencies** between `backend/` and `frontend/`. The `shared/` package is the only bridge.
2. **Flat is better than nested.** Keep directory depth to 3 levels maximum.
3. **Co-locate tests.** Unit tests live next to the code they test (`model.test.ts` next to `model.ts`).
4. **Feature-scoped over type-scoped** for large modules. If a module grows beyond 7 files, group by feature, not by type.
5. **`legacy/` is read-only.** New code never imports from `legacy/`. It exists as reference only.

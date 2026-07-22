# CI/CD Strategy

## Pipeline Overview

Every push to any branch triggers the CI pipeline. Merges to `develop` and `main` may trigger additional steps.

```
Push → Lint → Type Check → Test → Build → [Security Audit] → [Deploy]
```

---

## CI Pipeline (All Branches)

### 1. Lint

- **Tool:** ESLint with TypeScript parser
- **Config:** Shared config across backend and frontend
- **Action:** Lint all staged/changed files
- **Failure:** Block pipeline

### 2. Format Check

- **Tool:** Prettier
- **Action:** Verify all files match project formatting rules
- **Failure:** Block pipeline

### 3. TypeScript Compilation

- **Tool:** `tsc --noEmit`
- **Action:** Type check backend and frontend separately, then shared types
- **Failure:** Block pipeline

### 4. Unit Tests

- **Tool:** Vitest (frontend), Vitest/Jest (backend)
- **Required coverage:** 80% minimum, 90% target
- **Command:** `npm run test -- --coverage`
- **Failure:** Block pipeline if tests fail OR coverage drops below threshold

### 5. Build

- **Action:** `npm run build` for both backend and frontend
- **Purpose:** Verify the application compiles successfully
- **Failure:** Block pipeline

### 6. Security Audit (Main + Develop)

- **Tool:** `npm audit`, Socket.dev or Snyk
- **Action:** Scan dependencies for known vulnerabilities
- **Threshold:** Zero critical or high vulnerabilities
- **Failure:** Block pipeline (warn only for moderate/low)

### 7. Dependency Audit (Main + Develop)

- **Tool:** `npm outdated` + `npm audit --production`
- **Action:** Check for outdated or deprecated packages
- **Failure:** Warn (information only)

---

## CD Pipeline (Main Only)

### Staging Deployment

- **Trigger:** Merge to `develop`
- **Target:** Staging environment
- **Action:** Build → Deploy backend + frontend → Run smoke tests → Run integration tests

### Production Deployment

- **Trigger:** Tag pushed to `main` (e.g., `v1.2.3`)
- **Target:** Production environment
- **Action:** Build → Security scan → Deploy backend + frontend → Smoke tests → Health check
- **Rollback:** Automated rollback if health check fails within 5 minutes

---

## GitHub Actions Workflow Design

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop, 'feature/**', 'bugfix/**', 'hotfix/**']
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    needs: typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test -- --coverage

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build

  security-audit:
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
```

---

## Deployment Flow

```
Feature Branch
  ↓ squash merge
develop
  ↓ (auto-deploy to staging)
Staging → smoke tests → integration tests
  ↓ (create release branch)
release/v1.2.3
  ↓ (merge commit)
main
  ↓ (tag v1.2.3)
Production → health check → monitoring
```

---

## Build Output

| Artifact | Location | Contents |
|----------|----------|----------|
| Backend | `backend/dist/` | Compiled JS, package.json, node_modules (production) |
| Frontend | `frontend/dist/` | Static HTML, JS, CSS, assets, PWA manifest |

Both are deployed as separate artifacts. Frontend is served from a CDN or static host. Backend runs as a Node.js process.

---

## Quality Gates

Before a PR merges to `develop`:

- [x] Lint passes
- [x] TypeScript compiles
- [x] All tests pass
- [x] Coverage >= 80%
- [x] Build succeeds
- [x] At least 1 approval

Before a PR merges to `main`:

- [x] All of the above
- [x] Security audit passes (no critical/high)
- [x] Staging deployment verified
- [x] All integration tests pass

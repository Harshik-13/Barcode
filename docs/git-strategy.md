# Git Branch Strategy

## Branch Hierarchy

```
main ──────────────────────────────────────────── production-ready
  └── develop ─────────────────────────────────── integration branch
       ├── feature/PROJ-123-short-description     new features
       ├── bugfix/PROJ-456-short-description      non-critical fixes
       └── hotfix/PROJ-789-short-description      critical production fixes (bypass develop)
```

---

## Branch Purposes

### `main`

- Always production-ready.
- Every commit on `main` has been reviewed, tested, and deployed.
- Direct commits are forbidden. Only merge commits from `release/*` or `hotfix/*`.
- Protected: requires CI pass + review + no direct pushes.

### `develop`

- Integration branch for ongoing work.
- Feature branches are merged here after review.
- Must always compile and pass tests, but may not be deployment-ready.
- Protected: requires CI pass + review.

### `feature/*`

- Created from `develop`.
- Named: `feature/PROJ-123-short-description`
- Short-lived (1-3 days maximum).
- Merged back to `develop` via squash merge.
- Deleted after merge.

### `bugfix/*`

- Created from `develop`.
- Named: `bugfix/PROJ-456-short-description`
- Same lifecycle as feature branches.
- Merged via squash merge.

### `hotfix/*`

- Created from `main`.
- Named: `hotfix/PROJ-789-short-description`
- For critical production issues that cannot wait for the next release cycle.
- Merged to `main` (via merge commit) and cherry-picked to `develop`.
- After merge to `main`, tag with patch version bump.

### `release/*`

- Created from `develop` when preparing a release.
- Named: `release/v1.2.3`
- No new features. Only bug fixes, documentation, and release metadata.
- Merged to `main` (via merge commit) and back to `develop`.
- Tagged on `main` with version number.

---

## Merge Strategy

| Branch → Target | Strategy | Commit History |
|-----------------|----------|----------------|
| feature → develop | Squash merge | 1 commit on develop |
| bugfix → develop | Squash merge | 1 commit on develop |
| develop → main (via release) | Merge commit | Preserves full history |
| hotfix → main | Merge commit | Preserves full history |
| hotfix → develop | Cherry-pick or merge | Clean history |

**Why squash for features:** Keeps `develop` history clean. The feature branch's detailed commit history is preserved locally and on the remote branch before deletion.

**Why merge commit for releases/hotfixes:** Preserves the semantic grouping of changes for production deployments.

---

## Pull Request Expectations

Every PR must include:

1. **Description** — What does this change? Why?
2. **Related issues** — Link to GitHub issues (PROJ-123)
3. **Checklist** — Verifies Definition of Done:
   - [ ] Code follows coding standards
   - [ ] Tests written and passing
   - [ ] Authorization enforced
   - [ ] Input validation server-side
   - [ ] Race conditions handled
   - [ ] No secrets committed
   - [ ] Docs updated if needed
4. **Screenshots** (UI changes only)

### PR Size

- Maximum 400 lines changed per PR (excluding generated files, lockfiles).
- If larger, split into multiple PRs.
- Rationale: Smaller PRs get reviewed faster and more thoroughly.

### Review Requirements

- At least 1 approval required.
- All CI checks must pass.
- No merge conflicts with target branch.
- Reviewer checks: logic, security, tests, naming, edge cases.

---

## Branch Protection Rules (GitHub)

### `main`
- Require pull request before merging
- Require 1 approval
- Dismiss stale reviews
- Require status checks (lint, test, build, security audit)
- Require branches to be up to date
- Restrict deletions
- Require signed commits (optional, recommended)

### `develop`
- Require pull request before merging
- Require 1 approval
- Require status checks (lint, test, build)
- Require branches to be up to date

---

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]
```

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting, whitespace |
| `refactor` | Code change that fixes neither bug nor adds feature |
| `test` | Adding or modifying tests |
| `chore` | Build, CI, dependencies |
| `perf` | Performance improvement |
| `security` | Security fix |

### Scope (examples)

- `scope` is the module/area: `api`, `db`, `auth`, `scanner`, `dashboard`, `docs`

### Examples

```
feat(api): add session entry endpoint

Add POST /api/session/entry for faculty to scan student entry.
Validates no active session exists before creating a new one.

Closes PROJ-123
```

```
fix(scanner): prevent double-tap creating duplicate sessions

Use database transaction with unique constraint check.
Previously, rapid double-tap could create two pending sessions.

Closes PROJ-456
```

```
docs(git): add branch protection rules
```

---

## Tagging

- Semantic versioning: `v1.2.3`
- Tags applied to `main` only
- Every production release gets a tag
- Pre-release tags: `v1.2.3-rc.1`

---

## Git Hooks (Recommended)

| Hook | Action |
|------|--------|
| `pre-commit` | Run linter on staged files |
| `commit-msg` | Validate conventional commit format |
| `pre-push` | Run full test suite |

Configured via `husky` and `lint-staged`.

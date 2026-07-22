# Documentation Standards

## Required Project Documents

| File | Purpose | Owner | Updated |
|------|---------|-------|---------|
| `README.md` | Project overview, quick start, structure | Tech lead | On every release |
| `ARCHITECTURE.md` | Locked architecture, domain model, workflows | Architect | On architecture change |
| `CONTRIBUTING.md` | How to contribute, code review, setup | Tech lead | On process change |
| `CHANGELOG.md` | Versioned release notes | Tech lead | On every release |
| `SECURITY.md` | Security policy, vulnerability reporting | Security lead | On policy change |
| `PRINCIPLES.md` | Engineering principles, philosophy | Tech lead | On principle change |
| `PHASES.md` | Development phases and current status | Tech lead | As phases progress |
| `ROADMAP.md` | Implementation roadmap | Architect | On priority change |
| `AGENTS.md` | AI agent conventions | Tech lead | As needed |

---

## `docs/` Directory Documents

| Document | Purpose |
|----------|---------|
| `repository-structure.md` | Complete folder structure and rationale |
| `coding-standards.md` | Naming, formatting, conventions |
| `git-strategy.md` | Branching, merge, and PR strategy |
| `environment-strategy.md` | Environment configuration and secrets |
| `ci-cd.md` | CI/CD pipeline design and quality gates |
| `dependency-management.md` | Dependency policy and audit process |
| `documentation-standards.md` | This file |
| `logging-error-handling.md` | Logging philosophy and error response format |
| `configuration.md` | App configuration, feature flags, constants |
| `security-baseline.md` | Mandatory security requirements |
| `testing-standards.md` | Testing conventions and coverage |
| `definition-of-done.md` | Engineering completion checklist |

---

## API Documentation

- API documentation is maintained in `docs/api/` or integrated into the `ARCHITECTURE.md`.
- Each endpoint documents: method, path, auth requirements, request schema, response schema, error codes, rate limits.
- Backward-compatible changes must note the deprecation timeline.
- Breaking changes require a new API version.

---

## Developer Documentation

- **Inline in code** for public APIs (JSDoc on exported functions, interfaces, types).
- **`README.md` per sub-project** for setup, configuration, and common tasks.
- **`docs/`** for cross-cutting concerns (architecture, security, testing).
- **Do not** duplicate information. If something lives in `ARCHITECTURE.md`, reference it from other docs rather than repeating it.

---

## Documentation Quality Rules

1. **Accuracy over completeness.** Wrong documentation is worse than no documentation.
2. **Docs are code.** Reviewed in PRs, tested for correctness, updated with changes.
3. **Keep it close to the code.** Put documentation next to what it describes.
4. **One source of truth.** When the same concept appears in multiple places, one is the source and others reference it.
5. **Plain language.** Avoid jargon unless it's domain terminology (and define it when first used).

---

## Changelog Format

Follow [Keep a Changelog](https://keepachangelog.com/) with [Semantic Versioning](https://semver.org/):

```markdown
# Changelog

## [1.2.0] - 2026-07-22

### Added
- New feature A
- New feature B

### Changed
- Refactored module X

### Fixed
- Bug in session creation

### Security
- Patched vulnerability CVE-1234
```

---

## README Template

Every major project directory (`backend/`, `frontend/`) must have a `README.md` containing:

1. **Purpose** — One-paragraph description
2. **Setup** — Prerequisites, install, configure, run
3. **Scripts** — Available npm scripts and their purpose
4. **Structure** — Key directories and what they contain
5. **Configuration** — Environment variables and their meaning
6. **Testing** — How to run tests

---

## Update Requirements

- Documentation is updated **in the same PR** as the code change.
- A PR that changes behavior without updating docs will be rejected.
- Documentation-only PRs are allowed for improvements and corrections.

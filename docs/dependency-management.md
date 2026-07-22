# Dependency Management

## Sources

- **Primary:** npm registry (`registry.npmjs.org`)
- **Blocked:** Unregistered or unknown registries require explicit approval
- **Git dependencies:** Allowed only for internal/patch-only scenarios. Must be reviewed and pinned to a specific commit hash.

---

## Version Pinning Strategy

| Dependency Type | Strategy | Example |
|----------------|----------|---------|
| Production dependencies | Exact version | `"express": "4.18.2"` |
| Development dependencies | Exact version | `"vitest": "1.6.0"` |
| Shared workspace packages | Workspace protocol | `"@shared/types": "workspace:*"` |

**Rationale:** Exact version pinning prevents unexpected breakage from semver-mismatched patch/minor releases. All updates are intentional and reviewed.

---

## Lockfile

- `package-lock.json` is committed to the repository.
- It must be regenerated (`npm install`) whenever `package.json` changes.
- Never manually edit the lockfile.
- Review lockfile changes in PRs (flag unexpected dependency additions).

---

## Adding a New Dependency

1. Verify the package is maintained (updated within the last 6 months, weekly downloads > 1000 for a production dependency).
2. Verify the package has no known vulnerabilities (`npm audit`).
3. Verify the license is compatible (MIT, Apache-2.0, ISC preferred; GPL requires legal review).
4. Add with exact version: `npm install <package>@<exact-version> --save-exact`
5. Justify in the PR description: why is this needed? Could existing code be reused instead?

---

## Update Strategy

| Cadence | Scope | Action |
|---------|-------|--------|
| Weekly | Security patches | `npm audit fix` — auto-merge if patch-only |
| Monthly | Minor updates | Review changelogs, update intentionally |
| Quarterly | Major updates | Dedicated ticket, full regression test |

### Process

1. Create a dependency update branch: `chore/deps-YYYY-MM-DD`
2. Run `npm outdated` to see available updates
3. Update one category at a time (dev deps, prod deps, tooling)
4. Run full test suite
5. Create PR with changelog summaries for each updated package

---

## Security Audit

- Run `npm audit` on every CI run for `main` and `develop` branches.
- **Critical/High:** Zero tolerance. Block pipeline and create an immediate ticket.
- **Moderate/Low:** Review and schedule within the next sprint.
- For vulnerabilities without fixes: evaluate alternatives or add a `packageOverrides` entry.

```jsonc
// package.json
{
  "overrides": {
    "semver": "^7.5.4"  // Force transitive dependency fix
  }
}
```

---

## Dependency Approval Rules

| Criteria | Auto-Approved | Requires Review |
|----------|--------------|-----------------|
| Patch update (1.2.3 → 1.2.4) | Yes | - |
| Minor update (1.2.0 → 1.3.0) | - | Yes |
| Major update (1.x → 2.x) | - | Yes, with migration plan |
| New production dependency | - | Yes, with justification |
| New dev dependency | - | Yes, with justification |
| Removing a dependency | - | Yes |
| `npm audit fix` | Yes (if patch-only) | Yes (if non-patch) |

---

## Handling Deprecated Packages

1. Identify alternatives (preferably with similar API surface).
2. Create a migration ticket with a migration plan.
3. Schedule within 2 sprints of deprecation notice.
4. For security-related deprecations: prioritize within current sprint.

---

## Current Stack (Pinned)

Once the implementation phase begins, all dependencies will be pinned here with exact versions:

### Backend (`backend/`)
```
express, better-sqlite3, jsonwebtoken, google-auth-library, cors, dotenv, helmet, express-rate-limit
```

### Frontend (`frontend/`)
```
react, react-dom, react-router-dom, vite, html5-qrcode
```

### Dev Dependencies
```
typescript, vitest, eslint, prettier, @types/*, husky, lint-staged
```

---

## Removal Policy

A dependency that is no longer used must be removed. PRs that add a dependency must verify there is no equivalent existing package. This is checked during code review.

**Suspected unused dependency:** Run `npm prune` or use tools like `depcheck` to verify before removal.

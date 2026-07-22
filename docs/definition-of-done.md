# Definition of Done — Engineering Completion Checklist

Every feature must satisfy ALL criteria before it is considered complete.

---

## Architecture

- [ ] Follows locked architecture (single PWA, single REST API, single database)
- [ ] No architectural changes introduced without approval
- [ ] Uses existing patterns before introducing new ones
- [ ] Reuses existing components before creating new ones
- [ ] No duplicate logic introduced

## Security

- [ ] Authentication required for all non-public endpoints
- [ ] Authorization (role check) enforced on every endpoint
- [ ] Input validation performed server-side (client validation is not sufficient)
- [ ] Ownership verification: users access only their own resources
- [ ] State changes use database transactions (race condition protection)
- [ ] Rate limiting applied
- [ ] Audit logging for all state-changing operations
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (output escaped, no raw HTML)
- [ ] IDOR prevented (resource ownership validated)
- [ ] No secrets committed or logged
- [ ] Sensitive data filtered from responses and logs

## Testing

- [ ] Unit tests written for business logic (services, utilities)
- [ ] Tests cover: happy path, error path, edge cases
- [ ] Authorization tests: unauthenticated (401), wrong role (403), correct role (200)
- [ ] Concurrency tests for session state transitions (if applicable)
- [ ] Coverage: 80%+ overall, 90%+ for business logic
- [ ] All existing tests still pass
- [ ] Bug fixes include a regression test

## Documentation

- [ ] API endpoints documented (or referenced from ARCHITECTURE.md)
- [ ] Code changes reflected in relevant docs
- [ ] Public APIs have JSDoc comments
- [ ] README updated if setup or configuration changed
- [ ] Changelog updated (for user-facing changes)

## Performance

- [ ] No N+1 queries on list endpoints
- [ ] Database queries use appropriate indexes
- [ ] No synchronous blocking operations in request handlers (Node.js)
- [ ] Pagination on list endpoints (default page size ≤ 100)

## Maintainability

- [ ] Code follows coding standards (naming, formatting, conventions)
- [ ] No TODO comments without ticket references
- [ ] No commented-out code
- [ ] No unnecessary console.log statements
- [ ] No magic numbers or strings (defined as constants)
- [ ] Error handling: typed errors, consistent format, no silent failures
- [ ] Logging at appropriate level (info for state changes, warn for recoverable, error for failures)
- [ ] No dead code, unused imports, or unused exports

## Review

- [ ] PR description explains what and why
- [ ] PR size ≤ 400 lines changed
- [ ] At least 1 reviewer approval
- [ ] All CI checks pass (lint, typecheck, test, build, security audit)
- [ ] No merge conflicts

## Deployment Readiness

- [ ] Database migration is idempotent (can run multiple times safely)
- [ ] Feature is backward-compatible (no breaking changes without migration plan)
- [ ] Environment variables documented in `.env.example`
- [ ] Feature flag wrapping (if partial rollout is needed)

---

## Quick Reference

```
[ ] Architecture — follows locked design, reuses existing patterns
[ ] Security — auth, roles, validation, ownership, transactions, rate limits, audit log
[ ] Testing — unit, auth, concurrency, coverage ≥ 80%
[ ] Documentation — endpoints, code changes, changelog
[ ] Performance — no N+1, proper indexes, pagination
[ ] Maintainability — clean code, no TODOs, proper error handling
[ ] Review — PR checklist, CI passes, ≤ 400 lines
[ ] Deployment — idempotent migrations, backward-compatible, env vars documented
```

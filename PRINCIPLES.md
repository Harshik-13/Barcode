# 8Hour Workspace Attendance System — Engineering Principles

## Core Philosophy

> **Reuse > Rewrite**
> **Adapt > Replace**
> **Extend > Duplicate**

Never redesign the application from scratch. The system is built by adapting an existing barcode scanner PWA while replacing the business domain.

---

## Development Philosophy

Every feature follows this lifecycle:

```
Requirement
  ↓
Architecture
  ↓
Implementation
  ↓
Threat Modeling
  ↓
Security Measures
  ↓
Testing
  ↓
Production Ready
```

Implementation is never considered complete simply because it works.

---

## Implementation Rules

1. **Reuse existing code whenever possible.** Before writing anything new, ask: "Can an existing component be reused?"

2. **Never create duplicate functionality.** If similar logic exists, reuse or extend it.

3. **Never change architecture without approval.** The single PWA, single REST API, single database architecture is locked.

4. **Never make assumptions about business rules.** If ambiguous, stop and ask the architect.

5. **Maintain backward compatibility** unless instructed otherwise.

6. **Keep components modular.** Single responsibility, well-defined interfaces.

7. **Keep code production-ready.** No console.log spam, no dead code, no TODO comments without context.

8. **Prioritize readability and maintainability.** Code is read far more often than it is written.

9. **Explain architectural tradeoffs before major refactors.** Don't surprise the team with large changes.

10. **If uncertain, ask instead of assuming.** Document the question and the answer.

---

## Security Requirements

Assume every endpoint is potentially attackable. Every implementation must consider:

- **Authentication** — Verify who the user is
- **Authorization** — Verify what the user can do
- **Input validation** — Never trust client input; validate server-side
- **Ownership verification** — Users can only access their own resources
- **Rate limiting** — Protect against abuse
- **Replay protection** — QR codes are time-bound (HMAC + timestep)
- **Duplicate scan prevention** — Prevent double entry/exit
- **Concurrent request handling** — Handle race conditions (e.g., double-tap scan)
- **IDOR prevention** — Enforce resource ownership
- **Race conditions** — Use transactions for critical paths
- **Audit logging** — Log all state-changing actions
- **Sensitive data exposure** — Never expose secrets, tokens, or PII
- **IDOR prevention** — Enforce resource ownership
- **Race conditions** — Use transactions for critical paths

Server-side validation is mandatory. Never trust client input.

---

## Definition of Done

A feature is complete only when:

- [ ] Business rules implemented correctly
- [ ] Architecture constraints respected
- [ ] Authorization enforced (role + ownership)
- [ ] Input validation completed
- [ ] Threats reviewed
- [ ] Tests written (unit + integration)
- [ ] Existing functionality preserved
- [ ] Production considerations addressed (rate limits, logging, error handling)

---

## Code Style

- No commented-out code
- No unnecessary console.log statements
- Descriptive variable and function names
- Consistent file naming (PascalCase for components, camelCase for utilities)
- TypeScript strict mode
- Follow existing patterns in the codebase

---

## Git Practices

- No commits unless explicitly requested
- Commit messages match repo style (concise, descriptive)
- Never commit secrets or API keys
- Review all changes before committing
- No force-push, no empty commits, no --no-verify

---

## Domain Boundaries

### This is NOT

- A hostel attendance system
- A meal tracking system
- A generic attendance system

### This IS

- A workspace attendance system for startup environments
- A session-based entry/exit tracking system
- A productivity analytics platform
- A notification system for workspace sessions

Any code that references hostels, meals, mess, or dormitories must be adapted to workspace terminology.

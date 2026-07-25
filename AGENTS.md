# Agent Context File

This file documents conventions and instructions for AI agents working on the 8Hour Workspace Attendance System.

## Project Identity

This is the **8Hour Workspace Attendance System** — NOT a hostel meal attendance system. The domain is workspace attendance for startup environments.

## Source of Truth

- `ARCHITECTURE.md` — Locked architecture, domain model, workflows
- `PRINCIPLES.md` — Engineering principles, security, definition of done
- `ROADMAP.md` — Implementation phases and migration plan
- `AGENTS.md` — This file: agent conventions

## Key Directives

### Before Implementation

1. Read the existing code first. Understand patterns before changing them.
2. Check if existing components can be reused before creating new ones.

### During Implementation

1. No architectural changes without approval.
2. No product decisions without the architect.
3. Server-side validation is mandatory for all inputs.
4. Authorization checks on every endpoint.
5. Use transactions for session state changes (race condition prevention).
6. Prefer existing patterns over new patterns.

### After Implementation

1. Verify existing functionality is preserved.
2. Check for remaining hostel/meal references.
3. Run tests if available.
4. No commits unless explicitly asked.

## Common Terms Mapping

| Old (Hostel) | New (Workspace) |
|---|---|
| Hostel | Workspace |
| Meal | Work session |
| Food type | Work category |
| Warden/security | Faculty |
| Scan (meal) | Session entry/exit |
| Breakfast/Lunch/Dinner | Coding/Design/Research/etc |
| Meal time window | Workspace hours |
| Duplicate meal | Double entry/exit prevention |

## Testing Notes

- Tests persist state to `backend/data/test-workspace.db`. Delete this file before running tests to get a clean run.
- The 12 `domain.integration.test.ts` failures (409 → 201 cascade) are caused by stale DB state, not code regressions.

## Verification Checklist

Before completing any task:
- [ ] Does the code follow existing patterns?
- [ ] Is authorization enforced?
- [ ] Is input validated server-side?
- [ ] Are hostel/meal terms removed?
- [ ] Are race conditions handled?
- [ ] Are tests passing?

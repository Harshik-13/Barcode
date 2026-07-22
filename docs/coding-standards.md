# Coding Standards

## Language

TypeScript (strict mode) for all production code. JavaScript is allowed only in scripts and configuration files.

---

## Naming Conventions

### General

| Construct | Convention | Example |
|-----------|------------|---------|
| Files | kebab-case | `workspace-session.ts` |
| Directories | kebab-case | `student-components/` |
| React components | PascalCase | `WorkspaceDashboard.tsx` |
| Hooks | camelCase, `use` prefix | `useSession.ts` |
| Classes | PascalCase | `SessionService` |
| Interfaces | PascalCase, no prefix | `WorkspaceSession` |
| Types | PascalCase | `SessionStatus` |
| Enums | PascalCase, enum values UPPER_SNAKE | `SessionStatus.PENDING` |
| Functions | camelCase | `createSession()` |
| Variables | camelCase | `activeSession` |
| Constants | UPPER_SNAKE | `MAX_SESSION_HOURS` |
| Private members | camelCase, no underscore | `calculateHash()` |
| Booleans | prefix with `is`, `has`, `can`, `should` | `isActive`, `hasPermission` |
| Event handlers | `handle` prefix | `handleScanSuccess` |
| Props types | Component name + `Props` suffix | `SessionCardProps` |
| State types | Component name + `State` suffix | `ScannerState` |

### API Naming

| Construct | Convention | Example |
|-----------|------------|---------|
| Endpoints | kebab-case, plural nouns | `/api/sessions/active` |
| Query params | camelCase | `?studentRoll=123` |
| Request body keys | camelCase | `{ studentRoll: "123" }` |
| Response body keys | camelCase | `{ sessionId: 1 }` |
| JSON fields in DB | snake_case | `student_roll`, `entry_time` |

### Database Naming

| Construct | Convention | Example |
|-----------|------------|---------|
| Tables | snake_case, plural | `workspace_sessions` |
| Columns | snake_case | `entry_time`, `student_id` |
| Primary keys | `id` | `id` |
| Foreign keys | `singular_table_id` | `student_id` |
| Indexes | `idx_table_column` | `idx_sessions_status` |
| Constraints | `fk_table_ref_table` | `fk_sessions_students` |

---

## Folder Conventions

- `components/` — Reusable React components only
- `pages/` — Route-level page components only (compose components)
- `services/` — API clients, external service integrations
- `hooks/` — Custom React hooks only
- `utils/` — Pure utility functions only (no React, no side effects)
- `types/` — TypeScript type definitions only
- `constants/` — Constants and enums only
- `config/` — Configuration loading only

---

## File Organization

### One component per file

Each React component gets its own file, named after the component.

### Co-located tests

Unit test files sit next to the file they test:

```
components/
├── SessionCard.tsx
└── SessionCard.test.tsx
```

### Index files for clean exports

Each module directory has an `index.ts` that re-exports public members:

```typescript
// components/index.ts
export { SessionCard } from './SessionCard';
export { SessionList } from './SessionList';
```

---

## React Component Rules

```typescript
// ✅ Preferred: function declaration
export function SessionCard({ session }: SessionCardProps) {
  return <div>{session.id}</div>;
}

// ❌ Avoid: arrow function default export
const SessionCard: React.FC<SessionCardProps> = ({ session }) => ...;
export default SessionCard;
```

- Use function declarations for components (better stack traces, hoisting)
- Name props types explicitly (not inferred)
- Use named exports, not default exports (better refactoring, explicit imports)
- One component per file
- Extract logic into hooks, not render props or HOCs

---

## Async Patterns

```typescript
// ✅ Preferred: async/await
async function createSession(data: SessionInput): Promise<Session> {
  const response = await api.post('/sessions', data);
  return response.data;
}

// ❌ Avoid: raw .then() chains
```

- Always use async/await over raw promises
- Handle errors with try/catch at the controller/hook level
- Never swallow errors silently

---

## Error Handling

```typescript
// ✅ Service layer: throw typed errors
throw new AppError('SESSION_NOT_FOUND', 404, 'Session not found');

// ✅ Controller layer: catch and format
try {
  const session = await sessionService.getById(id);
  res.json({ data: session });
} catch (error) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.toJSON() });
  }
  throw error;
}
```

---

## Comment Rules

- No comments that explain what the code does (the code should be self-documenting)
- Comments should explain **why**, not **what**
- JSDoc on public APIs and exported functions only
- No commented-out code — delete it
- TODO comments must include a ticket reference: `// TODO(PROJ-123): add rate limiting`

---

## Formatting

Automated via Prettier with project-wide configuration:

- Single quotes
- Semicolons required
- 2-space indentation
- 100-character line width
- Trailing commas where valid
- `import` order: external → internal → type imports

Run before every commit: `npm run format && npm run lint`

---

## TypeScript Strictness

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- `any` is forbidden. Use `unknown` and narrow with type guards.
- Prefer `interface` over `type` for object shapes (extends semantics, better errors).
- Use `type` for unions, intersections, and mapped types.
- Mark function return types explicitly.

---

## General Engineering Principles

1. **DRY** — Don't repeat yourself. Extract repeated logic into reusable functions/modules.
2. **KISS** — Prefer simple solutions over clever ones.
3. **Single Responsibility** — One module, one concern.
4. **Explicit over implicit** — Name things clearly. Avoid magic numbers, magic strings.
5. **Fail fast** — Validate inputs at the boundary. Crash early rather than propagate bad state.
6. **Defensive programming** — Assume external inputs are malicious. Validate, sanitize, escape.
7. **Testability** — Every function should be testable in isolation. Inject dependencies. Avoid side effects in pure logic.
8. **Consistency** — Follow existing patterns. If a pattern doesn't exist, establish it in docs first.
9. **Readability over brevity** — Code is read far more often than written. Optimize for the reader.
10. **No dead code** — Delete unused exports, components, and branches. Version control remembers them.

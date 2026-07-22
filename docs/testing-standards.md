# Testing Standards

## Test Types

### Unit Tests

- Test a single function, component, or module in isolation.
- Dependencies are mocked.
- Location: co-located with the source file (`session.service.test.ts` next to `session.service.ts`).
- Run on every push via CI.
- Coverage target: 90%+ for business logic, 80%+ overall.

### Integration Tests

- Test interaction between modules: API → controller → service → database.
- Use a test database (in-memory SQLite for speed).
- Location: `tests/integration/` or alongside the feature.
- Run on push to `develop` and `main`.
- Coverage target: exercise all API endpoints at least once.

### API Tests

- Test the HTTP layer: request parsing, validation, authentication, authorization, response formatting.
- Use supertest (or similar) against the Express app.
- Location: `backend/tests/api/`.
- Every endpoint has at least: happy path, auth failure, validation failure, role mismatch.

### Authorization Tests

- For every endpoint, test that each role gets the expected response:
  - Unauthenticated: `401`
  - Wrong role: `403`
  - Correct role (no ownership): varies
  - Correct role (with ownership): success
- Location: alongside API tests.

### Concurrency Tests

- Test that race conditions are handled:
  - Two simultaneous entry scans for the same student.
  - Two simultaneous exit scans for the same session.
  - Entry during an active session.
  - Exit without an active session.
- Use `Promise.all()` or similar to simulate concurrent requests.

### Regression Tests

- When fixing a bug, add a test that reproduces the bug before fixing it.
- The test passes after the fix and stays in the test suite.
- The test should be at the level where the bug lived (unit for logic bugs, API for endpoint bugs).

---

## Coverage Expectations

| Metric | Minimum | Target |
|--------|---------|--------|
| Overall line coverage | 80% | 90% |
| Business logic (services) | 90% | 95% |
| Controllers | 80% | 90% |
| Utilities | 85% | 95% |
| UI components | 70% | 85% |

Coverage reports are generated on every CI run. Coverage dropping below the minimum blocks the pipeline.

---

## Test Naming Conventions

### Test File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Unit test | `{name}.test.ts` | `session.service.test.ts` |
| Integration test | `{name}.integration.test.ts` | `session.integration.test.ts` |
| API test | `{name}.api.test.ts` | `session-entry.api.test.ts` |

### Test Description Style

```typescript
describe('SessionService', () => {
  describe('createEntry', () => {
    it('creates a pending session when no active session exists', () => { ... });
    it('throws SESSION_ALREADY_ACTIVE when an active session exists', () => { ... });
    it('throws STUDENT_NOT_FOUND when roll does not exist', () => { ... });
    it('validates student roll format', () => { ... });
  });
});
```

- `describe` blocks: Module → Method (nested)
- `it` blocks: Present tense, behavioral description
- Test names read as sentences: "SessionService createEntry creates a pending session when no active session exists"

---

## Test Organization

```
backend/
├── src/
│   ├── services/
│   │   ├── session.service.ts
│   │   └── session.service.test.ts       # Unit test (co-located)
│   └── controllers/
│       ├── session.controller.ts
│       └── session.controller.test.ts    # Unit test (co-located)
└── tests/
    ├── api/
    │   └── session-entry.api.test.ts     # API/Integration test
    ├── auth/
    │   └── session-entry.auth.test.ts    # Authorization test
    └── concurrency/
        └── session-entry.concurrency.test.ts  # Race condition test
```

---

## Mocking Rules

- Mock external dependencies (database, network, filesystem) in unit tests.
- Use real instances where feasible in integration tests (e.g., in-memory SQLite instead of mocking the database).
- Never mock what you don't own (third-party libraries) unless absolutely necessary.
- When mocking is unavoidable, use `vi.mock()` (Vitest) and assert that mocks are called correctly.

---

## Test Data

- Use factories or builders for test data, not raw JSON objects.
- Each test creates the data it needs; tests should not depend on shared test state.
- Clean up test data between tests (transaction rollback or truncate).

```typescript
// Test data builder
function buildSession(overrides: Partial<WorkspaceSession> = {}): WorkspaceSession {
  return {
    id: 1,
    studentId: 1,
    status: 'pending',
    entryTime: new Date().toISOString(),
    ...overrides,
  };
}
```

---

## What Not to Test

- Third-party library behavior (test that you call it correctly, not that it works).
- Framework internals (Express routing, React reconciliation).
- Generated code, lockfiles, configuration files.
- Trivial getters/setters without logic.
- UI layout details (test behavior, not pixel position).

---

## Test Scripts

| Command | Action |
|---------|--------|
| `npm run test` | Run all unit tests |
| `npm run test -- --coverage` | Run with coverage report |
| `npm run test:integration` | Run integration tests |
| `npm run test:api` | Run API tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:watch` | Run tests in watch mode |

---

## Frontend Testing

- Component tests: render, user interaction, state changes, conditional rendering.
- Hook tests: state changes, side effects, cleanup.
- Service tests: API client behavior, error handling, data transformation.
- Use `@testing-library/react` for component tests (emphasis on user behavior, not implementation).
- Avoid testing implementation details (internal state, prop names, class names).

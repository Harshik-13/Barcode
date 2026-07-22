# Security Baseline

## Mandatory Requirements

Every feature implementation MUST satisfy ALL of the following. PRs that fail any check will be rejected.

---

## 1. Authentication

- Every endpoint except public auth endpoints (`/api/auth/login`, `/api/auth/google`) requires authentication.
- Authentication is verified via JWT Bearer token in the `Authorization` header.
- Tokens are validated on every request: signature, expiry, issuer.
- Invalid/expired tokens return `401 Unauthorized`.
- No endpoint accepts unauthenticated requests (explicit whitelist only).

---

## 2. Authorization

- Every authenticated endpoint must verify the caller's role.
- Role checks are performed server-side, never client-side.
- Authorization logic is centralized in middleware, not scattered across controllers.
- Default deny: if a role is not explicitly allowed, access is denied.

```typescript
// Example middleware
export function requireRole(...roles: string[]) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }
    next();
  };
}
```

---

## 3. Input Validation

- **All** input is validated server-side. Client-side validation is UX-only, not a security control.
- Validate: type, format, length, range, allowed values.
- Reject invalid input with `400 Bad Request` and a descriptive error.
- Use a validation library (Zod, Joi, or similar) with schema definitions.
- Validate at the API boundary (controller), before the data reaches business logic.

```typescript
const sessionEntrySchema = z.object({
  studentRoll: z.string().regex(/^\d{5}[A-Z]\d{4}$/),
});

// ✅ Server-side validation
const result = sessionEntrySchema.safeParse(req.body);
if (!result.success) {
  throw new AppError('VALIDATION_ERROR', 400, 'Invalid input');
}
```

---

## 4. Ownership Verification

- Users can only access their own resources unless they have elevated roles (faculty, admin).
- Student A cannot view or modify Student B's data.
- Faculty can access all student data (by design).
- Admin can access all data.

```typescript
// Ownership check example
if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
  if (session.studentId !== req.user.studentId) {
    throw new AppError('FORBIDDEN', 403, 'Not your session');
  }
}
```

---

## 5. Transactions for State Changes

- All session state changes (create, update status) must use database transactions.
- Prevent race conditions: two concurrent requests should not create duplicate sessions.
- Use row-level locking or unique constraints where available.

```typescript
// Transaction example
const db = getDb();
const transaction = db.transaction(() => {
  const active = db.prepare(
    'SELECT id FROM workspace_sessions WHERE student_id = ? AND status IN (?, ?)'
  ).get(studentId, 'pending', 'active');
  
  if (active) {
    throw new AppError('SESSION_ALREADY_ACTIVE', 409, 'Active session exists');
  }
  
  db.prepare(
    'INSERT INTO workspace_sessions (student_id, entry_time, status) VALUES (?, ?, ?)'
  ).run(studentId, new Date().toISOString(), 'pending');
});

transaction();
```

---

## 6. Rate Limiting

- Every API endpoint is rate-limited.
- Auth endpoints have stricter limits (e.g., 10 requests/minute).
- Session endpoints have moderate limits (e.g., 60 requests/minute).
- Exceeded limits return `429 Too Many Requests`.
- Rate limit headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## 7. Audit Logging

- Every state-changing operation is logged: create, update, delete.
- Audit log includes: who (userId), what (action), when (timestamp), what changed (before/after).
- Read operations (GET) are not audited unless they access sensitive data.
- Audit logs are append-only and immutable.

```typescript
// Audit log example
function auditLog(action: string, resourceType: string, resourceId: number, details: object) {
  db.prepare(
    `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(req.user.id, action, resourceType, resourceId, JSON.stringify(details), new Date().toISOString());
}
```

---

## 8. Input Sanitization

- Strip or escape HTML/script content from user input (XSS prevention).
- Sanitize before storing and before rendering.
- Use parameterized queries for all database operations (SQL injection prevention).
- Never concatenate user input into SQL strings.

```typescript
// ✅ Safe: parameterized query
db.prepare('SELECT * FROM students WHERE roll = ?').get(roll);

// ❌ Unsafe: string concatenation
db.exec(`SELECT * FROM students WHERE roll = '${roll}'`);
```

---

## 9. Output Filtering

- Error messages returned to the client must not expose internals.
- In production, internal errors return a generic message: "An unexpected error occurred."
- Stack traces are never returned to the client (development mode is an exception).
- Sensitive fields (secrets, tokens) are filtered from API responses.

---

## 10. IDOR Prevention

- Insecure Direct Object Reference: users should not be able to access resources by guessing IDs.
- Always verify ownership before returning data.
- Use UUIDs for publicly exposed resource IDs when sequential IDs are a concern.
- The authorization layer must check: "Does this user own this resource?"

---

## 11. CSRF

- The application uses JWT Bearer tokens in headers, not cookies, so CSRF is inherently mitigated.
- If cookie-based auth is ever introduced, CSRF tokens must be implemented.
- SameSite cookies: `SameSite=Strict` or `SameSite=Lax`.

---

## 12. XSS Prevention

- React handles output escaping by default — do not use `dangerouslySetInnerHTML`.
- Never render user-generated HTML without sanitization (use DOMPurify if required).
- Set `Content-Security-Policy` headers.
- Sanitize all user input stored in the database.

---

## 13. Replay Attack Prevention

- QR codes (if used) must include a timestamp and be accepted only within a narrow time window.
- HMAC-based QR codes must include a timestep and the server verifies the window (±1 step).
- Session tokens in QR codes must be single-use.

---

## 14. Race Condition Prevention

- All session state machines use database transactions.
- Pessimistic or optimistic locking as appropriate.
- Double-click / double-scan prevention: server-side idempotency check before state change.
- Unique constraints on `(student_id, status)` where status is 'active' or 'pending'.

---

## 15. Sensitive Data Handling

- Passwords: never stored (Google OAuth only).
- JWT secrets: minimum 256 bits, rotated every 90 days.
- Database encryption: SQLite database file is not encrypted by default. In production, use filesystem-level encryption or encrypted SQLite.
- PII (student names, roll numbers): accessible only to authenticated users. Logs must not contain PII in plain text.
- API keys and secrets: stored in environment variables or secrets manager, never in the codebase.

---

## Security Checklist for Every PR

Every pull request must pass this checklist:

- [ ] Authentication: Are all non-public endpoints authenticated?
- [ ] Authorization: Are role checks in place?
- [ ] Validation: Is all input validated server-side?
- [ ] Ownership: Can users access only their resources?
- [ ] Transactions: Are state changes wrapped in transactions?
- [ ] SQL Injection: Are parameterized queries used?
- [ ] Rate Limiting: Are endpoints rate-limited?
- [ ] Audit Logging: Are state changes logged?
- [ ] Secrets: Are any secrets exposed in the code or logs?
- [ ] XSS: Is user output properly escaped?
- [ ] IDOR: Are resource IDs validated for ownership?

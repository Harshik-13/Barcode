# Logging & Error Handling Standards

## Logging Philosophy

1. **Log for operations, not for debugging.** Production logs should tell you what the system is doing, not every variable value.
2. **Structured JSON logs.** Always. Machine-readable, searchable, parseable.
3. **Log levels are enforced.** Use the correct level or the PR will be rejected.
4. **Never log secrets.** Passwords, tokens, secrets, and PII must never appear in logs.
5. **Log at the boundary.** Log incoming requests (sanitized) and outgoing responses at the API boundary. Internal function calls should not log unless they represent a meaningful state change.

---

## Log Levels

| Level | Usage | When | Example |
|-------|-------|------|---------|
| `error` | System is degraded or broken | Something failed that needs human investigation | Database connection lost, unhandled exception |
| `warn` | Something unexpected but non-critical | Recoverable issue, deprecation, rate limit approaching | Slow query (>500ms), fallback used |
| `info` | Normal operation events | State changes, significant lifecycle events | Session created, user logged in, scan recorded |
| `debug` | Development-only details | Not logged in production | Request headers, computed values, decision branches |
| `trace` | Deep function-level tracing | Only during active debugging | Every function entry/exit |

---

## Structured Log Format (JSON)

```json
{
  "timestamp": "2026-07-22T10:30:00.000Z",
  "level": "info",
  "message": "Session created",
  "module": "session-service",
  "requestId": "req_abc123",
  "userId": "user_42",
  "metadata": {
    "sessionId": 1,
    "studentRoll": "22071A0105",
    "status": "pending"
  },
  "duration": 15,
  "environment": "production"
}
```

### Required Fields

| Field | Description | Always Present? |
|-------|-------------|-----------------|
| `timestamp` | ISO 8601 UTC | Yes |
| `level` | Log level | Yes |
| `message` | Human-readable summary | Yes |
| `module` | Source module name | Yes |
| `requestId` | Traceable request identifier | Yes (request context) |
| `userId` | Authenticated user identifier | When available |
| `duration` | Operation duration in ms | For timed operations |
| `environment` | Current environment | Yes |

---

## Sensitive Data Redaction

Fields that must never appear in logs:

- `password`, `secret`, `token`, `authorization`
- `jwt`, `accessToken`, `refreshToken`
- `ssn`, `phone`, `creditCard`, `dob`
- Full `email` (log domain only: `user@example.com` → `***@example.com`)
- Database connection strings containing credentials

Implementation: Use a structured logging library with a redaction filter. Configure the filter with field name patterns.

---

## Error Response Format

All API errors follow a consistent JSON structure:

```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "No active session found for this student",
    "details": {
      "studentRoll": "22071A0105"
    },
    "requestId": "req_abc123"
  }
}
```

### HTTP Status Code Usage

| Code | Meaning | When |
|------|---------|------|
| 400 | Bad Request | Invalid input, validation failure |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | State conflict (e.g., duplicate session) |
| 422 | Unprocessable Entity | Business rule violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server failure |

---

## Error Codes

Naming convention: `MODULE_ERROR` in UPPER_SNAKE_CASE.

### General

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RATE_LIMITED` | 429 | Too many requests |

### Auth

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `TOKEN_MISSING` | 401 | No authorization token provided |
| `TOKEN_INVALID` | 401 | Token is expired or malformed |
| `TOKEN_INVALID_SIGNATURE` | 401 | Token signature verification failed |
| `FORBIDDEN` | 403 | Insufficient role permissions |
| `EMAIL_DOMAIN_NOT_ALLOWED` | 403 | Email domain not in allowed list |

### Sessions

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `SESSION_NOT_FOUND` | 404 | No matching session found |
| `SESSION_ALREADY_ACTIVE` | 409 | Student already has an active session |
| `SESSION_NOT_ACTIVE` | 409 | Session is not in active state |
| `SESSION_ALREADY_COMPLETED` | 409 | Session already completed |
| `SESSION_CATEGORY_REQUIRED` | 422 | Must select category before activating |
| `SESSION_SUMMARY_REQUIRED` | 422 | Must submit summary to complete session |

### Students

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `STUDENT_NOT_FOUND` | 404 | Student roll not found |
| `STUDENT_NOT_ELIGIBLE` | 403 | Student not eligible for this action |

---

## Exception Handling

### Backend

```typescript
// Custom application error
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

// Usage in service layer
throw new AppError('SESSION_ALREADY_ACTIVE', 409, 'Active session exists', {
  studentRoll: roll,
});

// Global error handler middleware
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    logger.warn('Application error', { code: err.code, ... });
    res.status(err.statusCode).json(err.toJSON());
    return;
  }
  
  // Unexpected error
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
});
```

### Frontend

```typescript
// API client interceptor
try {
  const response = await api.post('/sessions/entry', data);
  return response.data;
} catch (error) {
  if (error.response?.data?.error) {
    // Known API error
    showToast(error.response.data.error.message, 'error');
  } else {
    // Network or unexpected error
    showToast('Network error. Please try again.', 'error');
  }
  throw error;
}
```

---

## User-Facing Errors

- User-facing error messages must be **human-readable** and **actionable**.
- Example: "You already have an active session. Please exit before starting a new one."
- Never expose internal error codes, stack traces, or implementation details to users.
- In development mode, additional debug information may be shown (behind a feature flag).

---

## Developer-Facing Logs

- Log the `requestId` at every log statement so developers can trace a single request through the system.
- Include `duration` for performance-sensitive operations (DB queries, external API calls).
- Log the **decision reason**, not just the decision: `Session created (no active session found for roll 22071A0105)` instead of `Session created`.

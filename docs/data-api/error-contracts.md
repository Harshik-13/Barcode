# Error Contracts

## Standard Error Response Format

Every error response follows this structure:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description of the error",
  "details": {} // Optional structured details for validation errors
}
```

---

## HTTP Status Code Usage

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PATCH, POST (non-create) |
| 201 | Created | Successful POST (resource creation) |
| 400 | Bad Request | Validation failure, malformed input |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions or ownership mismatch |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate entry, duplicate session, state conflict |
| 422 | Unprocessable Entity | Business rule violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server failure |

---

## Error Codes

### Authentication Errors (401)

| Error Code | Message | Cause |
|-----------|---------|-------|
| MISSING_TOKEN | "Authentication token is required" | No Authorization header |
| INVALID_TOKEN | "The provided token is invalid or expired" | Malformed or expired JWT |
| INVALID_CREDENTIALS | "Invalid email or password" | Wrong login credentials |

### Authorization Errors (403)

| Error Code | Message | Cause |
|-----------|---------|-------|
| INSUFFICIENT_PERMISSIONS | "You do not have permission to perform this action" | Role insufficient |
| RESOURCE_NOT_OWNED | "You do not own this resource" | Ownership mismatch |
| ACCOUNT_INACTIVE | "Your account is not active" | Suspended/deactivated user |

### Not Found Errors (404)

| Error Code | Message | Cause |
|-----------|---------|-------|
| NOT_FOUND | "{Entity} not found" | Resource does not exist |
| NO_ACTIVE_SESSION | "No active session found for this student" | No session in CREATED/ACTIVE state |

### Validation Errors (400)

| Error Code | Message | Cause |
|-----------|---------|-------|
| INVALID_ROLL | "Invalid roll number format" | Roll format validation failure |
| INVALID_NAME | "Name must be 2-100 characters" | Name length violation |
| INVALID_EMAIL | "Invalid email format" | Email format violation |
| INVALID_PASSWORD | "Password must be 8-128 characters" | Password length violation |
| INVALID_STATUS | "Invalid status value" | Status not in allowed enum |
| INVALID_SUMMARY | "Summary must be 10-2000 characters" | Summary length violation |
| INVALID_REASON | "Reason must be 10-500 characters" | Reason length violation |
| INVALID_TYPE | "Invalid type value" | Type not in allowed enum |
| INVALID_DESCRIPTION | "Description must not exceed 500 characters" | Description length violation |
| INVALID_FACULTY | "Faculty not found or not active" | Faculty reference invalid |
| INVALID_STUDENT | "Student not found or not enrolled" | Student reference invalid |
| INVALID_CATEGORY | "Category not found or not active" | Category reference invalid |
| INVALID_SORT_FIELD | "Invalid sort field" | Sort parameter not in allowed list |
| INVALID_PAGINATION | "Page must be >= 1 and limit must be between 1 and 100" | Pagination parameter out of range |

### Conflict Errors (409)

| Error Code | Message | Cause |
|-----------|---------|-------|
| DUPLICATE_ROLL | "A student with roll '{roll}' already exists" | Duplicate student roll |
| DUPLICATE_EMAIL | "A user with email '{email}' already exists" | Duplicate email |
| DUPLICATE_CATEGORY | "A category with name '{name}' already exists" | Duplicate active category name |
| STUDENT_ALREADY_IN_SESSION | "Student already has an active session" | Double entry scan |

### Business Rule Violations (422)

| Error Code | Message | Cause |
|-----------|---------|-------|
| STUDENT_SUSPENDED | "Suspended students cannot start sessions" | Suspended student tries entry |
| STUDENT_DEPARTED | "Departed students cannot start sessions" | Departed student tries entry |
| FACULTY_NOT_ACTIVE | "Only active faculty can record sessions" | Non-active faculty scans |
| INVALID_STATUS_TRANSITION | "Cannot transition from {current} to {requested}" | Backward status change |
| INVALID_SESSION_STATUS | "Summary can only be submitted when status is AWAITING_SUMMARY" | Wrong status for summary |
| SESSION_NOT_ACTIVE | "Manual exit can only be performed on active sessions" | Wrong status for manual exit |
| INVALID_OVERRIDE_TARGET | "Cannot override a session in {status} status" | Wrong status for override |
| CATEGORY_ASSIGNMENT_TIMEOUT | "Category can only be assigned before session exit" | Category after exit |
| CATEGORY_ARCHIVED | "Archived categories cannot be assigned to sessions" | Archived category selected |

### Server Errors (500)

| Error Code | Message | Cause |
|-----------|---------|-------|
| INTERNAL_ERROR | "An unexpected error occurred" | Unhandled server exception |
| DATABASE_ERROR | "A database error occurred" | Query failure, constraint violation |
| INTEGRATION_ERROR | "An external service error occurred" | Third-party service failure |

---

## Validation Error Detail Format

For requests with multiple validation failures:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": {
    "fields": {
      "roll": "Invalid roll number format",
      "name": "Name must be 2-100 characters"
    }
  }
}
```

---

## Error Response Headers

| Header | Description | When Present |
|--------|-------------|--------------|
| Retry-After | Seconds to wait before retrying | Rate limit (429) |
| X-Request-Id | Unique request identifier | All errors (for debugging) |

---

## Error Logging Rules

1. **400/401/403/404:** Logged at WARN level with minimal context (endpoint, error code).
2. **409/422:** Logged at INFO level with affected resource identifiers.
3. **500:** Logged at ERROR level with full stack trace and request context.
4. **No sensitive data in error messages.** Error messages never include passwords, tokens, or personal data beyond what the user provided.

---

## Error Response Examples

### 401 - Authentication Failure
```json
{
  "error": "MISSING_TOKEN",
  "message": "Authentication token is required"
}
```

### 403 - Insufficient Permissions
```json
{
  "error": "INSUFFICIENT_PERMISSIONS",
  "message": "You do not have permission to perform this action"
}
```

### 404 - Resource Not Found
```json
{
  "error": "NOT_FOUND",
  "message": "Student not found"
}
```

### 409 - Conflict
```json
{
  "error": "STUDENT_ALREADY_IN_SESSION",
  "message": "Student already has an active session"
}
```

### 422 - Business Rule Violation
```json
{
  "error": "INVALID_SESSION_STATUS",
  "message": "Summary can only be submitted when session status is AWAITING_SUMMARY"
}
```

### 500 - Server Error
```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

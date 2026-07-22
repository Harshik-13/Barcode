# Integration Contracts

## Identity Provider Integration

The attendance system integrates with an internal identity provider for authentication.

### Protocol

| Attribute | Value |
|-----------|-------|
| Authentication Method | JWT-based token authentication |
| Token Type | Bearer JWT |
| Token Issuer | Attendance System (self-issued) |
| Token Expiry | 24 hours from issue |
| Refresh Mechanism | Not supported in V1 (re-login required) |

### JWT Token Structure

```json
{
  "sub": 1,
  "type": "faculty",
  "iat": 1721640000,
  "exp": 1721726400
}
```

| Claim | Description |
|-------|-------------|
| sub | User ID in the respective table |
| type | User role: student, faculty, admin |
| iat | Issued at (Unix timestamp) |
| exp | Expires at (Unix timestamp) |

### Password Storage

| Attribute | Value |
|-----------|-------|
| Algorithm | bcrypt |
| Cost Factor | 12 |
| Salt | Automatic (embedded in hash) |

### Password Validation

- Minimum length: 8 characters
- Maximum length: 128 characters
- No password complexity requirements in V1 (future: minimum 1 uppercase, 1 number)

---

## Notification Delivery Integration

Notifications are stored in the database and delivered to students via the notification list endpoint. In V1, there is no external notification delivery (email, push, SMS).

### Notification Storage Contract

| Field | Type | Purpose |
|-------|------|---------|
| student_id | FK to students | Recipient |
| session_id | FK to sessions (nullable) | Related session |
| type | ENUM('ENTRY','EXIT','REMINDER') | Notification category |
| message | TEXT | Display content |
| is_read | BOOLEAN | Read status |
| created_at | TIMESTAMP | Delivery time |

### Future Integration Points (Not in V1)

| Integration | Expected Contract | Priority |
|-------------|-------------------|----------|
| Email delivery | POST /notifications/send { to, subject, body } | Medium |
| Push notification | POST /notifications/push { deviceToken, message } | Low |
| SMS delivery | POST /notifications/sms { phoneNumber, message } | Low |

---

## Background Job Integration

### Auto-Completion Job

| Attribute | Value |
|-----------|-------|
| Schedule | Every 5 minutes |
| Trigger | Cron expression: `*/5 * * * *` |
| Action | Find sessions in ACTIVE status where entry_time < NOW() - 12 hours |
| Transition | ACTIVE → COMPLETED with completion_reason = 'AUTO_COMPLETED' |
| Logging | Creates activity_log entry with actor_type = 'SYSTEM' |
| Concurrency | Single instance (lock-based prevention) |

### Archival Job

| Attribute | Value |
|-----------|-------|
| Schedule | Daily at 02:00 AM |
| Trigger | Cron expression: `0 2 * * *` |
| Action | Find sessions in COMPLETED status where entry_time < NOW() - 90 days |
| Transition | COMPLETED → ARCHIVED |
| Logging | Creates activity_log entry with actor_type = 'SYSTEM' |
| Concurrency | Single instance |

### Reminder Job

| Attribute | Value |
|-----------|-------|
| Schedule | Every 10 minutes |
| Trigger | Cron expression: `*/10 * * * *` |
| Action | Find sessions in AWAITING_SUMMARY status where exit_time < NOW() - 30 minutes and no REMINDER notification exists for that session |
| Output | Creates REMINDER notification for the student |
| Logging | Creates activity_log entry with actor_type = 'SYSTEM' |
| Concurrency | Single instance |

### Background Job Contract

```json
{
  "jobName": "session-auto-completion",
  "lastRun": "2026-07-22T09:05:00Z",
  "nextRun": "2026-07-22T09:10:00Z",
  "status": "SUCCESS",
  "processedCount": 3,
  "errorCount": 0,
  "errors": []
}
```

---

## Database Integration

### Connection Pool

| Attribute | Value |
|-----------|-------|
| Pool Size | 10 (default) |
| Max Pool Size | 20 |
| Idle Timeout | 30000ms |
| Connection Timeout | 5000ms |

### Transaction Isolation

| Workflow | Isolation Level | Rationale |
|----------|----------------|-----------|
| Session entry | SERIALIZABLE | Prevent race condition on duplicate entry check |
| Session exit | SERIALIZABLE | Prevent race condition on double exit |
| Summary submission | READ COMMITTED | No concurrent writes expected |
| Admin override | SERIALIZABLE | Prevent concurrent status changes |

### Migration Strategy

| Tool | Type |
|------|------|
| Schema management | Manual SQL scripts (V1) |
| Migration files | Sequential numbered SQL files: `001_create_students.sql`, `002_create_faculty.sql`, etc. |
| Rollback | Forward-only (no rollback scripts in V1; reverse migration created separately if needed) |

---

## External API Contract

### Rate Limiting Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1721640060
```

### CORS Configuration

| Header | Value |
|--------|-------|
| Access-Control-Allow-Origin | * (development) → configured domain (production) |
| Access-Control-Allow-Methods | GET, POST, PATCH, DELETE, OPTIONS |
| Access-Control-Allow-Headers | Content-Type, Authorization |
| Access-Control-Max-Age | 86400 |

### API Response Headers

All API responses include:

| Header | Value | Purpose |
|--------|-------|---------|
| X-Request-Id | UUID | Request tracing |
| X-Response-Time | milliseconds | Performance monitoring |
| Content-Type | application/json; charset=utf-8 | Content negotiation |

# Audit Contracts

## What is Logged

Every state-changing operation produces an activity log entry. Read-only operations (GET, list) are not logged.

| Action | Trigger | Entity Type | Details Included |
|--------|---------|-------------|------------------|
| STUDENT_CREATED | POST /students | STUDENT | roll, name |
| STUDENT_UPDATED | PATCH /students/:id | STUDENT | Changed fields (before → after) |
| STUDENT_STATUS_CHANGED | PATCH /students/:id/status | STUDENT | Old status → new status, reason |
| FACULTY_CREATED | POST /faculty | FACULTY | name, email |
| FACULTY_UPDATED | PATCH /faculty/:id | FACULTY | Changed fields |
| FACULTY_STATUS_CHANGED | PATCH /faculty/:id/status | FACULTY | Old status → new status |
| ADMIN_CREATED | POST /admins | ADMIN | name, email |
| ADMIN_UPDATED | PATCH /admins/:id | ADMIN | Changed fields |
| ADMIN_STATUS_CHANGED | PATCH /admins/:id/status | ADMIN | Old status → new status |
| SESSION_ENTRY | POST /sessions/entry | WORKSPACE_SESSION | studentRoll, facultyId |
| SESSION_EXIT | POST /sessions/exit | WORKSPACE_SESSION | studentRoll, facultyId, duration |
| SESSION_MANUAL_EXIT | POST /sessions/:id/manual-exit | WORKSPACE_SESSION | facultyId, reason |
| SESSION_SUMMARY | POST /sessions/:id/summary | WORKSPACE_SESSION | Summary length (not content) |
| SESSION_OVERRIDE | POST /sessions/:id/override | WORKSPACE_SESSION | adminId, previous status, new status, reason |
| SESSION_AUTO_COMPLETED | System cron | WORKSPACE_SESSION | Session ID, reason (timeout) |
| CATEGORY_CREATED | POST /categories | CATEGORY | name, description |
| CATEGORY_UPDATED | PATCH /categories/:id | CATEGORY | Changed fields |
| CATEGORY_ARCHIVED | PATCH /categories/:id/archive | CATEGORY | Previous status |
| LOGIN | POST /auth/login | — | User type, user ID |
| LOGOUT | POST /auth/logout | — | User type, user ID |

---

## Who is Logged

| Actor Type | Source | Identifier |
|-----------|--------|------------|
| STUDENT | JWT token | student.id |
| FACULTY | JWT token | faculty.id |
| ADMIN | JWT token | admin.id |
| SYSTEM | Internal process | — (actor_id is null) |

---

## When is Logged

- **Synchronous:** Activity log entry is created in the same database transaction as the state change.
- **System actions:** Created by cron jobs and background processes with actor_type = 'SYSTEM'.
- **Login/Logout:** Logged after authentication succeeds (session token issued).

---

## What Information is Captured

| Field | Source | Description |
|-------|--------|-------------|
| actor_type | JWT or 'SYSTEM' | Who performed the action |
| actor_id | JWT sub or null | Who performed the action |
| action | Application constant | What was done |
| entity_type | Application constant | What was affected |
| entity_id | Result of operation | The affected record's ID |
| details | Application code | JSON with contextual data |
| ip_address | Request header (X-Forwarded-For or remote address) | Source IP |
| created_at | Application timestamp | When it happened (UTC) |

---

## Data Retention

| Audit Data | Retention | Action |
|-----------|-----------|--------|
| activity_logs | Indefinite | Never deleted |
| activity_logs (student departs) | Indefinite | Preserved for historical reference |

---

## Visibility

| Role | Can View | Filtered By |
|------|----------|-------------|
| Admin | All activity logs | Full access |
| Faculty | Activity logs related to their recorded sessions | entityType = WORKSPACE_SESSION AND entity_id in their recorded sessions (future) |
| Student | Activity logs related to their own sessions | entityType = WORKSPACE_SESSION AND entity_id in their sessions (future) |

**V1:** Only Admin has access to GET /activity-logs. Faculty and student access is a future enhancement.

---

## Audit Log Sensitivity

| Data | Classification | Logged? |
|------|---------------|---------|
| Session summary content | PII | No (metadata only) |
| Student roll | Internal | Yes |
| Student name | PII | Yes |
| Faculty email | Internal | Yes |
| IP address | Internal | Yes |
| Password | Secret | Never |
| JWT token | Secret | Never |
| Manual exit reason | Internal | Yes |
| Override reason | Internal | Yes |

---

## Activity Log Example

```json
{
  "id": 1,
  "actorType": "FACULTY",
  "actorId": 1,
  "action": "SESSION_ENTRY",
  "entityType": "WORKSPACE_SESSION",
  "entityId": 42,
  "details": {
    "studentRoll": "STU001",
    "studentName": "Alice Smith",
    "facultyName": "Dr. John"
  },
  "ipAddress": "192.168.1.100",
  "createdAt": "2026-07-22T09:00:00Z"
}
```

---

## Verification Rules

1. Every audit log entry must be verified as accurate at creation time.
2. Audit logs cannot be modified or deleted.
3. The `details` JSON must be immutable once written.
4. No PII-sensitive content from summaries is ever stored in the audit log.
5. Audit log timestamps are always in UTC.

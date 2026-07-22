# Data Model

## Logical Data Model

### Student

| Attribute | Type | Required | Default | Business Purpose |
|-----------|------|----------|---------|------------------|
| Identifier | String | Yes | — | Unique code for identification and scanning |
| Full Name | String | Yes | — | Student's display name |
| Email | String | No | — | Contact for notifications |
| Status | Status | Yes | Active | Enrolled, Suspended, or Departed |
| Enrolled At | Timestamp | Yes | Current | When the student was enrolled |

### Faculty

| Attribute | Type | Required | Default | Business Purpose |
|-----------|------|----------|---------|------------------|
| Full Name | String | Yes | — | Faculty's display name |
| Email | String | Yes | — | Login identifier |
| Status | Status | Yes | Active | Active, Suspended, or Deactivated |
| Created At | Timestamp | Yes | Current | When the faculty account was created |

### Admin

| Attribute | Type | Required | Default | Business Purpose |
|-----------|------|----------|---------|------------------|
| Full Name | String | Yes | — | Admin's display name |
| Email | String | Yes | — | Login identifier |
| Status | Status | Yes | Active | Active or Deactivated |
| Created At | Timestamp | Yes | Current | When the admin account was created |

### WorkspaceSession

| Attribute | Type | Required | Default | Business Purpose |
|-----------|------|----------|---------|------------------|
| Student | Reference | Yes | — | The student who attended |
| Entry Time | Timestamp | Yes | Current | When entry was recorded |
| Exit Time | Timestamp | No | — | When exit was recorded |
| Entry Recorder | Reference | Yes | — | Faculty who recorded entry |
| Exit Recorder | Reference | No | — | Faculty who recorded exit |
| Category | Reference | No | — | Work category selected by student |
| Status | Status | Yes | Created | Created, Active, Awaiting Summary, Completed, Archived |
| Completion Reason | Enum | No | — | NORMAL, AUTO_COMPLETED, MANUAL_EXIT, ADMIN_OVERRIDE |
| Summary | Text | No | — | Work description submitted by student |
| Is Manual Exit | Boolean | Yes | False | Whether exit was performed manually |
| Manual Exit Reason | Text | No | — | Business reason for manual exit |
| Override Reason | Text | No | — | Business reason for admin override |
| Created At | Timestamp | Yes | Current | When the session was created |

### Category

| Attribute | Type | Required | Default | Business Purpose |
|-----------|------|----------|---------|------------------|
| Name | String | Yes | — | Display name of the category |
| Description | Text | No | — | Optional description |
| Status | Status | Yes | Active | Active or Archived |
| Created At | Timestamp | Yes | Current | When the category was created |

### Notification

| Attribute | Type | Required | Default | Business Purpose |
|-----------|------|----------|---------|------------------|
| Student | Reference | Yes | — | Recipient student |
| Session | Reference | No | — | Related session (if applicable) |
| Type | Enum | Yes | — | Entry, Exit, Reminder |
| Message | Text | Yes | — | Notification content |
| Is Read | Boolean | Yes | False | Whether the student has read it |
| Created At | Timestamp | Yes | Current | When the notification was created |

### ActivityLog

| Attribute | Type | Required | Default | Business Purpose |
|-----------|------|----------|---------|------------------|
| Actor Type | Enum | Yes | — | Student, Faculty, Admin, System |
| Actor Identifier | String | Yes | — | Identifier of the actor |
| Action | String | Yes | — | Description of the action performed |
| Entity Type | String | Yes | — | Type of entity affected |
| Entity Identifier | String | Yes | — | Identifier of the affected entity |
| Details | JSON | No | — | Structured details of the change |
| IP Address | String | No | — | Source IP (if applicable) |
| Created At | Timestamp | Yes | Current | When the action occurred |

---

## Enumerations

### Student Status
`ENROLLED`, `SUSPENDED`, `DEPARTED`

### Faculty Status
`ACTIVE`, `SUSPENDED`, `DEACTIVATED`

### Admin Status
`ACTIVE`, `DEACTIVATED`

### Session Status
`CREATED`, `ACTIVE`, `AWAITING_SUMMARY`, `COMPLETED`, `ARCHIVED`

### Completion Reason
`NORMAL`, `AUTO_COMPLETED`, `MANUAL_EXIT`, `ADMIN_OVERRIDE`

### Notification Type
`ENTRY`, `EXIT`, `REMINDER`

### Actor Type
`STUDENT`, `FACULTY`, `ADMIN`, `SYSTEM`

---

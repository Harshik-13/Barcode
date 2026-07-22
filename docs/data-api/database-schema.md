# Database Schema

## Tables

### roles

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INTEGER | PK, AUTOINCREMENT | Unique identifier |
| name | TEXT | NOT NULL, UNIQUE | Role name: student, faculty, admin |
| created_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### students

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INTEGER | PK, AUTOINCREMENT | Unique identifier |
| roll | TEXT | NOT NULL, UNIQUE | Student identifier for scanning |
| name | TEXT | NOT NULL | Display name |
| email | TEXT | UNIQUE | Contact email |
| status | TEXT | NOT NULL, DEFAULT 'ENROLLED', CHECK(status IN ('ENROLLED','SUSPENDED','DEPARTED')) | Account status |
| created_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Enrollment timestamp |

### faculty

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INTEGER | PK, AUTOINCREMENT | Unique identifier |
| name | TEXT | NOT NULL | Display name |
| email | TEXT | NOT NULL, UNIQUE | Login identifier |
| status | TEXT | NOT NULL, DEFAULT 'ACTIVE', CHECK(status IN ('ACTIVE','SUSPENDED','DEACTIVATED')) | Account status |
| created_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### admins

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INTEGER | PK, AUTOINCREMENT | Unique identifier |
| name | TEXT | NOT NULL | Display name |
| email | TEXT | NOT NULL, UNIQUE | Login identifier |
| status | TEXT | NOT NULL, DEFAULT 'ACTIVE', CHECK(status IN ('ACTIVE','DEACTIVATED')) | Account status |
| created_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### categories

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INTEGER | PK, AUTOINCREMENT | Unique identifier |
| name | TEXT | NOT NULL | Display name |
| description | TEXT | — | Optional description |
| status | TEXT | NOT NULL, DEFAULT 'ACTIVE', CHECK(status IN ('ACTIVE','ARCHIVED')) | Availability status |
| created_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### workspace_sessions

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INTEGER | PK, AUTOINCREMENT | Unique identifier |
| student_id | INTEGER | NOT NULL, FK → students(id) | Attending student |
| entry_time | TEXT | NOT NULL | Entry recording timestamp |
| exit_time | TEXT | — | Exit recording timestamp |
| entry_recorder_id | INTEGER | NOT NULL, FK → faculty(id) | Faculty who recorded entry |
| exit_recorder_id | INTEGER | FK → faculty(id) | Faculty who recorded exit |
| category_id | INTEGER | FK → categories(id) | Selected work category |
| status | TEXT | NOT NULL, DEFAULT 'CREATED', CHECK(status IN ('CREATED','ACTIVE','AWAITING_SUMMARY','COMPLETED','ARCHIVED')) | Current lifecycle status |
| completion_reason | TEXT | CHECK(completion_reason IN ('NORMAL','AUTO_COMPLETED','MANUAL_EXIT','ADMIN_OVERRIDE')) | How session reached completion |
| summary | TEXT | — | Work description submitted by student |
| is_manual_exit | INTEGER | NOT NULL, DEFAULT 0 | Whether exit was manual (boolean: 0 or 1) |
| manual_exit_reason | TEXT | — | Business reason for manual exit |
| override_reason | TEXT | — | Business reason for admin override |
| created_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Session creation timestamp |

### notifications

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INTEGER | PK, AUTOINCREMENT | Unique identifier |
| student_id | INTEGER | NOT NULL, FK → students(id) | Recipient student |
| session_id | INTEGER | FK → workspace_sessions(id) | Related session |
| type | TEXT | NOT NULL, CHECK(type IN ('ENTRY','EXIT','REMINDER')) | Notification type |
| message | TEXT | NOT NULL | Notification content |
| is_read | INTEGER | NOT NULL, DEFAULT 0 | Read status (boolean: 0 or 1) |
| created_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### activity_logs

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INTEGER | PK, AUTOINCREMENT | Unique identifier |
| actor_type | TEXT | NOT NULL, CHECK(actor_type IN ('STUDENT','FACULTY','ADMIN','SYSTEM')) | Type of actor who performed the action |
| actor_id | INTEGER | — | Identifier of the actor (nullable for SYSTEM) |
| action | TEXT | NOT NULL | Description of the action performed |
| entity_type | TEXT | NOT NULL | Type of entity affected |
| entity_id | INTEGER | — | Identifier of the affected entity |
| details | TEXT | — | JSON string with structured change details |
| ip_address | TEXT | — | Source IP address |
| created_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of the action |

### user_roles

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INTEGER | PK, AUTOINCREMENT | Unique identifier |
| user_type | TEXT | NOT NULL, CHECK(user_type IN ('FACULTY','ADMIN')) | Which user table to reference |
| user_id | INTEGER | NOT NULL | ID in the referenced user table |
| role_id | INTEGER | NOT NULL, FK → roles(id) | Assigned role |
| UNIQUE(user_type, user_id, role_id) | | | Prevent duplicate role assignments |

---

## Unique Constraints Summary

| Table | Constraint | Purpose |
|-------|-----------|---------|
| students | UNIQUE(roll) | Each student has a unique identifier |
| students | UNIQUE(email) | Each student has a unique email |
| faculty | UNIQUE(email) | Each faculty has a unique email |
| admins | UNIQUE(email) | Each admin has a unique email |
| categories | UNIQUE(name) WHERE status='ACTIVE' | Active categories must have unique names |
| user_roles | UNIQUE(user_type, user_id, role_id) | No duplicate role assignments |

---

## Check Constraints Summary

| Table | Constraint | Purpose |
|-------|-----------|---------|
| students | status IN ('ENROLLED','SUSPENDED','DEPARTED') | Valid student lifecycle states |
| faculty | status IN ('ACTIVE','SUSPENDED','DEACTIVATED') | Valid faculty lifecycle states |
| admins | status IN ('ACTIVE','DEACTIVATED') | Valid admin lifecycle states |
| categories | status IN ('ACTIVE','ARCHIVED') | Valid category lifecycle states |
| workspace_sessions | status IN ('CREATED','ACTIVE','AWAITING_SUMMARY','COMPLETED','ARCHIVED') | Valid session lifecycle states |
| workspace_sessions | completion_reason IN ('NORMAL','AUTO_COMPLETED','MANUAL_EXIT','ADMIN_OVERRIDE') | Valid completion reasons |
| workspace_sessions | is_manual_exit IN (0, 1) | Boolean constraint |
| notifications | type IN ('ENTRY','EXIT','REMINDER') | Valid notification types |
| notifications | is_read IN (0, 1) | Boolean constraint |
| activity_logs | actor_type IN ('STUDENT','FACULTY','ADMIN','SYSTEM') | Valid actor types |

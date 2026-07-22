# Index Strategy

## Index Justification Principles

1. Every index serves a specific query pattern derived from a Phase 3 workflow.
2. No index is created "just in case." Each index has a documented purpose.
3. Composite indexes are ordered by selectivity (most selective column first).
4. Indexes on foreign keys are included by default (referential integrity lookups).

---

## students

| Index | Columns | Type | Purpose | Workflow |
|-------|---------|------|---------|----------|
| PK | id | PRIMARY | Row lookup | All |
| UQ1 | roll | UNIQUE | Student lookup by scanned identifier | Entry Scan, Exit Scan, Manual Exit |
| UQ2 | email | UNIQUE | Login lookup | Authentication |
| IX1 | status | INDEX | Filter active/suspended/departed | Administration |

---

## faculty

| Index | Columns | Type | Purpose | Workflow |
|-------|---------|------|---------|----------|
| PK | id | PRIMARY | Row lookup | All |
| UQ1 | email | UNIQUE | Login lookup | Authentication |
| IX1 | status | INDEX | Filter active/suspended | Administration |

---

## admins

| Index | Columns | Type | Purpose | Workflow |
|-------|---------|------|---------|----------|
| PK | id | PRIMARY | Row lookup | All |
| UQ1 | email | UNIQUE | Login lookup | Authentication |

---

## categories

| Index | Columns | Type | Purpose | Workflow |
|-------|---------|------|---------|----------|
| PK | id | PRIMARY | Row lookup | All |
| UQ1 | name | UNIQUE | Unique name enforcement | Category Management |
| IX1 | status | INDEX | Filter active/archived | Category Selection |

---

## workspace_sessions

| Index | Columns | Type | Purpose | Workflow |
|-------|---------|------|---------|----------|
| PK | id | PRIMARY | Row lookup | All |
| IX1 | student_id | INDEX | Find sessions by student | Entry/Exit Scan, Session History |
| IX2 | status | INDEX | Filter by lifecycle status | Occupancy Check, Reports |
| IX3 | entry_time | INDEX | Date-range queries | Reporting, Analytics |
| IX4 | entry_recorder_id | INDEX | Faculty lookup of recorded entries | Reports, Audit |
| IX5 | student_id, status | COMPOSITE | Find incomplete session for student | Entry Scan (precondition check) |
| IX6 | status, entry_time | COMPOSITE | Active/incomplete sessions ordered by time | Occupancy Dashboard |
| IX7 | category_id | INDEX | Category usage analytics | Reporting |
| IX8 | completion_reason | INDEX | Filter by completion type | Reporting |

### Composite Index Justification

**IX5 (student_id, status):** The most frequent query in the system — "does this student have an active session?" Used for every entry and exit scan. The composite index covers this query without reading the table.

**IX6 (status, entry_time):** The occupancy dashboard needs "all ACTIVE sessions sorted by entry time." The composite index covers both the filter and the sort order.

---

## notifications

| Index | Columns | Type | Purpose | Workflow |
|-------|---------|------|---------|----------|
| PK | id | PRIMARY | Row lookup | All |
| IX1 | student_id | INDEX | Find notifications for student | Notification Viewing |
| IX2 | session_id | INDEX | Find notifications for a session | Notification Flow |
| IX3 | student_id, is_read | COMPOSITE | Unread notifications count | Notification Badge |
| IX4 | created_at | INDEX | Chronological ordering | Notification List |

### Composite Index Justification

**IX3 (student_id, is_read):** Used for the "unread notification count" query that runs frequently. Without this composite index, the database would scan all notifications for the student to count unread ones.

---

## activity_logs

| Index | Columns | Type | Purpose | Workflow |
|-------|---------|------|---------|----------|
| PK | id | PRIMARY | Row lookup | All |
| IX1 | actor_type, actor_id | COMPOSITE | Find actions by a specific actor | Audit Investigation |
| IX2 | entity_type, entity_id | COMPOSITE | Find actions on a specific entity | Audit Investigation |
| IX3 | created_at | INDEX | Chronological ordering | Audit View |
| IX4 | action | INDEX | Filter by action type | Audit Investigation |

---

## user_roles

| Index | Columns | Type | Purpose | Workflow |
|-------|---------|------|---------|----------|
| PK | id | PRIMARY | Row lookup | All |
| UQ1 | user_type, user_id, role_id | UNIQUE | Prevent duplicate assignments | Administration |
| IX1 | user_type, user_id | COMPOSITE | Find role for a user | Authentication |

---

## Index Rules

1. **No full table scans on hot paths.** The entry and exit scan flows must use indexed lookups.
2. **Covering indexes for critical queries.** The "find incomplete session for student" query (IX5) covers the WHERE clause entirely.
3. **Write performance consideration.** workspace_sessions has the most indexes (8). This is acceptable because session writes are relatively infrequent compared to reads, and the indexes support critical read paths.
4. **No over-indexing.** The 8 indexes on workspace_sessions are all justified by specific workflows. No index is speculative.

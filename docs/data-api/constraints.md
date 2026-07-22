# Data Constraints

## Business Constraints (Enforced at Database Level)

### C1: One Incomplete Session Per Student
**Constraint:** UNIQUE(student_id, status) WHERE status IN ('CREATED', 'ACTIVE', 'AWAITING_SUMMARY')
**Purpose:** Prevents a student from having multiple simultaneous incomplete sessions.
**Note:** SQLite does not support partial unique indexes natively. This is enforced via application logic with a precondition check before session creation.

### C2: Session Status Progression
**Constraint:** CHECK(status transitions follow lifecycle rules)
**Purpose:** Ensures sessions only move forward through the lifecycle.
**Enforcement:** Application logic. The database stores the current status; transitions are validated before update.

### C3: Category Required Before Completion
**Constraint:** CHECK(status = 'COMPLETED' → category_id IS NOT NULL)
**Purpose:** Every completed session must have a category.
**Enforcement:** Application logic verifies category_id is set before transitioning to COMPLETED.

### C4: Summary Only After Exit
**Constraint:** summary IS NOT NULL → exit_time IS NOT NULL
**Purpose:** A summary cannot be submitted before exit is recorded.
**Enforcement:** Application logic checks session status is AWAITING_SUMMARY before accepting summary.

### C5: Exit Time After Entry Time
**Constraint:** CHECK(exit_time IS NULL OR exit_time > entry_time)
**Purpose:** Prevents negative or zero-duration sessions.

### C6: Manual Exit Requires Reason
**Constraint:** CHECK(is_manual_exit = 1 → manual_exit_reason IS NOT NULL)
**Purpose:** Every manual exit must have a documented business reason.

### C7: Admin Override Requires Reason
**Constraint:** override_reason IS NOT NULL when completion_reason = 'ADMIN_OVERRIDE'
**Purpose:** Every admin override must have a documented reason.

### C8: Completion Reason Only When Completed
**Constraint:** CHECK(status = 'COMPLETED' → completion_reason IS NOT NULL)
**Constraint:** CHECK(status != 'COMPLETED' → completion_reason IS NULL)
**Purpose:** Completion reason is meaningful only for completed sessions.

---

## Referential Integrity

| Foreign Key | Source | Target | Rule |
|-------------|--------|--------|------|
| student_id | workspace_sessions | students(id) | ON DELETE RESTRICT |
| entry_recorder_id | workspace_sessions | faculty(id) | ON DELETE RESTRICT |
| exit_recorder_id | workspace_sessions | faculty(id) | ON DELETE RESTRICT |
| category_id | workspace_sessions | categories(id) | ON DELETE RESTRICT |
| student_id | notifications | students(id) | ON DELETE CASCADE |
| session_id | notifications | workspace_sessions(id) | ON DELETE SET NULL |
| role_id | user_roles | roles(id) | ON DELETE RESTRICT |

---

## Immutable Records

| Table | Immutable After | Rationale |
|-------|----------------|-----------|
| activity_logs | Creation | Audit trail must be append-only |
| workspace_sessions | COMPLETED status | Historical record of attendance |
| notifications | Creation (except is_read) | Notification content is fixed |

**Immutable columns on workspace_sessions once COMPLETED:**
- entry_time
- exit_time
- entry_recorder_id
- exit_recorder_id
- category_id
- completion_reason
- summary
- is_manual_exit
- manual_exit_reason
- override_reason

**Mutable columns on workspace_sessions (before COMPLETED):**
- status (forward-only transitions)
- category_id (null → assigned, during CREATED)
- summary (null → assigned, during AWAITING_SUMMARY)
- exit_time (null → assigned, during CREATED or ACTIVE)
- exit_recorder_id (null → assigned, during CREATED or ACTIVE)

---

## Soft Delete / Archive Rules

| Entity | Mechanism | Reversible? | Effect |
|--------|-----------|-------------|--------|
| Student | status = 'DEPARTED' | No | Cannot start new sessions |
| Student | status = 'SUSPENDED' | Yes (→ENROLLED) | Cannot start new sessions |
| Faculty | status = 'DEACTIVATED' | No | Cannot scan |
| Faculty | status = 'SUSPENDED' | Yes (→ACTIVE) | Cannot scan |
| Admin | status = 'DEACTIVATED' | No | Cannot administer |
| Category | status = 'ARCHIVED' | No | Cannot be selected for new sessions |
| Session | status = 'ARCHIVED' | No | Removed from active views |

**No entity is ever physically deleted.** All lifecycles terminate in terminal states (DEPARTED, DEACTIVATED, ARCHIVED) or are soft-suspended.

---

## Data Integrity Rules

1. **No orphaned sessions.** Every session must reference a valid student and entry recorder.
2. **No dangling categories on completed sessions.** A completed session's category must reference a category (the category might be archived, but the reference is preserved).
3. **No backward status transitions.** Session status can only move forward.
4. **Exit recorder only set when exit is recorded.** Can only be set in conjunction with exit_time.
5. **Activity log is append-only.** No UPDATE or DELETE on activity_logs.

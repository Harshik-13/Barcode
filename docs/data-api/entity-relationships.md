# Entity Relationships

## Entity Relationship Diagram

```
  ┌───────────┐        ┌──────────────────┐        ┌───────────┐
  │  students │1──N──N│ workspace_       │N──0..1│ categories │
  │           │  owns  │ sessions         │  has   │           │
  └───────────┘        └──┬───────────────┘        └───────────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           │ N..1         │ N..1         │ N..1
           ▼              ▼              ▼
     ┌──────────┐   ┌──────────┐   ┌──────────┐
     │ faculty  │   │ faculty  │   │  admins  │
     │ (entry)  │   │ (exit)   │   │(override)│
     └──────────┘   └──────────┘   └──────────┘
           │
           │ 1..N
           ▼
     ┌──────────┐        ┌──────────────────┐
     │ activity_│        │   workspace_     │
     │  logs    │◄───────│   sessions       │
     └──────────┘   logs  └──────────────────┘

  ┌───────────┐        ┌──────────────────┐
  │ students  │1──N──N│  notifications    │
  │           │  owns  │                  │
  └───────────┘        └────────┬─────────┘
                                │
                           N..1 │ (optional)
                                ▼
                        ┌──────────────────┐
                        │  workspace_      │
                        │  sessions        │
                        └──────────────────┘

  ┌───────────┐        ┌───────────┐
  │   roles   │1──N──N│ user_roles│
  └───────────┘  has   └───────────┘
```

---

## Relationship Definitions

### students → workspace_sessions
- **Cardinality:** 1:N
- **Type:** Ownership
- **Description:** A student owns many workspace sessions. A session belongs to exactly one student.
- **Cascade:** RESTRICT (a student with sessions cannot be deleted)

### faculty → workspace_sessions (entry recorder)
- **Cardinality:** 1:N
- **Type:** Recording
- **Description:** A faculty member records entry for many sessions. Each session has exactly one entry recorder.
- **Cascade:** RESTRICT (cannot deactivate faculty with recorded entries without review)

### faculty → workspace_sessions (exit recorder)
- **Cardinality:** 1:N
- **Type:** Recording
- **Description:** A faculty member may record exit for many sessions. A session may have an exit recorder.
- **Cascade:** RESTRICT

### workspace_sessions → categories
- **Cardinality:** N:0..1
- **Type:** Assignment
- **Description:** A session may have one category assigned. A category may be used in many sessions.
- **Cascade:** RESTRICT (categories are not deleted, only archived)

### students → notifications
- **Cardinality:** 1:N
- **Type:** Ownership
- **Description:** A student receives many notifications. A notification belongs to exactly one student.
- **Cascade:** CASCADE (if a student record is cleaned up, notifications go with it)

### workspace_sessions → notifications
- **Cardinality:** 1:N
- **Type:** Reference
- **Description:** A session may generate multiple notifications. A notification may reference a session.
- **Cascade:** SET NULL (if session reference is removed, notification remains)

### activity_logs → (all entities)
- **Cardinality:** N:1
- **Type:** Audit
- **Description:** Every state-changing operation produces an activity log entry. The log references other entities by type and ID but has no foreign keys (to remain append-only without cascade implications).

### roles → user_roles
- **Cardinality:** 1:N
- **Type:** Assignment
- **Description:** A role can be assigned to multiple faculty/admins. A user can have one role.

---

## Cascade Rules Summary

| Parent | Child | On Delete | On Update |
|--------|-------|-----------|-----------|
| students | workspace_sessions | RESTRICT | CASCADE |
| students | notifications | CASCADE | CASCADE |
| faculty (entry) | workspace_sessions | RESTRICT | CASCADE |
| faculty (exit) | workspace_sessions | RESTRICT | CASCADE |
| categories | workspace_sessions | RESTRICT | CASCADE |
| workspace_sessions | notifications | SET NULL | CASCADE |
| roles | user_roles | RESTRICT | CASCADE |

---

## Relationship Business Rules

1. A student can have at most one session in CREATED, ACTIVE, or AWAITING_SUMMARY status at any time.
2. A session's category is optional during CREATED status but required before COMPLETED status.
3. A faculty member can be both the entry recorder and exit recorder for the same session.
4. An admin who performs an override is recorded in the activity log but not directly in the session table (override_reason is set, and the activity log links the admin to the session).
5. A notification's session reference may be null for system-wide notifications (future use).

# Module Interactions

## Interaction Rules

| Rule | Description |
|------|-------------|
| I1 | Modules communicate via business events. No module calls another module's internal logic directly. |
| I2 | Session Management is the central module. Most interactions flow through it. |
| I3 | No circular dependencies are allowed. If A depends on B, B must not depend on A. |
| I4 | Activity Logging is a sink — modules write to it but never read from it for operational decisions. |
| I5 | Reporting is read-only. It never produces business events. |
| I6 | Authentication is a prerequisite. All module interactions assume an authenticated actor. |

---

## Allowed Interactions

### Session Management → Activity Logging
- **Direction:** One-way
- **What:** Session Management requests log entries for every state change (session created, category selected, exit recorded, session completed, manual exit, override, archival)
- **Why:** Audit trail must be complete and immutable

### Session Management → Notification Engine
- **Direction:** One-way
- **What:** Session Management requests notification generation when sessions are created (entry), exit is recorded, or reminders need to be sent
- **Why:** Notifications are a side effect of session state changes, not part of session validation

### Session Management → Category Management
- **Direction:** Query only
- **What:** Session Management queries Category Management to verify a category exists and is active before allowing a session to transition to Active
- **Why:** Category validation must be centralized to prevent selection of archived or non-existent categories

### Administration → Session Management
- **Direction:** One-way (requests)
- **What:** Administration requests session overrides and archival on behalf of Admin actors
- **Why:** Admin delegates session operations to Session Management rather than performing them directly

### Administration → Category Management
- **Direction:** One-way (requests)
- **What:** Administration requests category creation, renaming, and archival on behalf of Admin actors
- **Why:** Category management is an administrative function

### Administration → Activity Logging
- **Direction:** One-way
- **What:** Administration requests log entries for user management actions (account created, suspended, etc.)
- **Why:** User management actions must be audited

### Notification Engine → Activity Logging
- **Direction:** One-way
- **What:** Notification Engine logs notification creation and read status changes
- **Why:** Notification lifecycle should be auditable

### Reporting → Session Management
- **Direction:** Query only
- **What:** Reporting queries session data for aggregation and analysis
- **Why:** Reporting is read-only and must not produce side effects

### Reporting → Category Management
- **Direction:** Query only
- **What:** Reporting queries category names for report categorization
- **Why:** Category names are needed for human-readable reports

---

## Forbidden Interactions

| Interaction | Reason |
|-------------|--------|
| Session Management → Reporting | Reporting should not receive events from Session Management. Reporting pulls data when requested. |
| Activity Logging → Session Management | The log must not influence operational decisions. Logging is a record, not a control. |
| Category Management → Session Management | Categories do not control sessions. Sessions use categories, not vice versa. |
| Notification Engine → Session Management | Notifications must not trigger session state changes. Session state is driven by actors. |
| Authentication → Business Logic | Authentication provides identity but must not make business decisions. Role enforcement is a separate concern. |
| Reporting → Administration | Reports should not trigger administrative actions automatically. All administration requires an Admin actor. |

---

## Interaction Diagram

```
                ┌──────────────────┐
                │  Authentication  │
                │  (prerequisite)  │
                └────────┬─────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │                      │
   ┌──────────┤   Administration    ├──────────┐
   │          │                      │          │
   │          └──────────┬───────────┘          │
   │                     │                      │
   │                     ▼                      │
   │          ┌──────────────────────┐          │
   │          │                      │          │
   ├─────────►│  Session Management  │◄─────────┤
   │          │                      │          │
   │          └──┬───────┬───────┬───┘          │
   │             │       │       │              │
   │             ▼       ▼       ▼              │
   │    ┌──────────┐ ┌──────┐ ┌──────────┐     │
   │    │Category  │ │Notif│ │Activity  │     │
   │    │Management│ │Engine│ │Logging   │     │
   │    └──────────┘ └──────┘ └────┬─────┘     │
   │                                │           │
   │                                │           │
   │                     ┌──────────┘           │
   │                     ▼                      │
   │            ┌───────────────┐               │
   │            │Notification   │               │
   │            │Delivery (ext) │               │
   │            └───────────────┘               │
   │                                            │
   │          ┌─────────────┐                    │
   └─────────►│  Reporting  │◄───────────────────┘
              │ (read-only) │
              └─────────────┘
```

Key:
- Solid lines: event/request flow
- Dotted lines: query-only

---

## Event Propagation Patterns

### Pattern 1: Actor Action → State Change → Side Effects

```
Actor action
  → Session Management validates and changes state
  → Session Management requests log entry (Activity Logging)
  → Session Management requests notification (Notification Engine)
  → Notification Engine creates notification
  → Notification Engine requests log entry (Activity Logging)
  → Notification Engine hands to delivery service
```

### Pattern 2: Admin Action → Delegated Operation

```
Admin action
  → Administration validates authorization
  → Administration delegates to Session Management (override/archive)
  → Session Management performs operation
  → Session Management requests log entry (Activity Logging)
```

### Pattern 3: Read-Only Query

```
Actor requests report
  → Reporting validates authorization
  → Reporting queries Session Management (session data)
  → Reporting queries Category Management (category names)
  → Reporting aggregates and presents data
  → No side effects
```

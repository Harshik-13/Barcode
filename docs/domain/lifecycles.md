# Lifecycles

## WorkspaceSession Lifecycle

### Official States

```
Created → Active → Awaiting Summary → Completed → Archived
```

### State Descriptions

| State | Meaning |
|-------|---------|
| **Created** | Entry has been recorded by Faculty. The session exists but the Student has not yet selected a Category. |
| **Active** | Student has selected a Category and is currently inside the workspace. The session is in progress. |
| **Awaiting Summary** | Exit has been recorded. Attendance is complete. A work summary is expected but not yet submitted. |
| **Completed** | Summary has been submitted OR the grace period has expired. The session record is finalized with a Completion Reason. |
| **Archived** | Historical record removed from active views. Immutable. |

### Completion Reasons

Every Completed session carries exactly one Completion Reason that explains how it reached completion:

| Reason | Meaning |
|--------|---------|
| NORMAL | Student exited normally and submitted a work summary |
| AUTO_COMPLETED | Grace period expired before a summary was submitted |
| MANUAL_EXIT | Faculty performed a manual exit due to an exceptional situation |
| ADMIN_OVERRIDE | Administrator explicitly completed or corrected the session |

### Valid Transitions

| From | To | Trigger | Actor | Conditions |
|------|----|---------|-------|-----------|
| (none) | Created | Entry scan | Faculty | No existing Created or Active or Awaiting Summary session for this Student |
| Created | Active | Category selected | Student | Category must exist and be active |
| Created | Awaiting Summary | Exit scan | Faculty | — |
| Created | Completed | Manual exit | Faculty | Faculty must provide a business reason |
| Active | Awaiting Summary | Exit scan | Faculty | — |
| Active | Completed | Manual exit | Faculty | Faculty must provide a business reason |
| Awaiting Summary | Completed | Summary submitted | Student | Summary must not be empty |
| Awaiting Summary | Completed | Grace period expired | System | No summary was submitted within the grace period |
| Any | Completed | Admin override | Admin | Admin explicitly completes or corrects the session |
| Completed | Archived | Archive action | Admin | — |

### Invalid Transitions

| Transition | Reason |
|------------|--------|
| Created → (none) → Archived | Session must pass through all required states |
| Active → Created | Cannot revert to pre-category state |
| Awaiting Summary → Active | Cannot re-enter after exit |
| Awaiting Summary → Created | Cannot revert to pre-category state after exit |
| Completed → any other state | Completed sessions are finalized (may be Archived) |
| Archived → any other state | Archived sessions are immutable |

### Transition Diagram (Normal Flow)

```
Faculty scans entry
  (no active session)
        │
        ▼
   ┌─────────┐
   │ CREATED │
   └────┬────┘
        │
  Student selects
  work category
        │
        ▼
   ┌─────────┐
   │  ACTIVE │
   └────┬────┘
        │
  Faculty scans exit
        │
        ▼
   ┌─────────────────┐
   │ AWAITING SUMMARY│
   └────┬────────┬────┘
        │        │
        │        └── Grace period expires
        │                    │
        ▼                    ▼
   ┌───────────┐   ┌──────────────┐
   │ COMPLETED │   │  COMPLETED   │
   │ (NORMAL)  │   │(AUTO_COMPLT) │
   └─────┬─────┘   └──────┬───────┘
        │                 │
        └────┬────────────┘
             ▼
       ┌──────────┐
       │ ARCHIVED │
       └──────────┘
```

### Transition Diagram (Exceptional Flows)

```
  ┌─────────┐
  │ CREATED │──┬── Manual exit by Faculty ──→ COMPLETED (MANUAL_EXIT)
  └────┬────┘  │
       │       └── Admin override ──→ COMPLETED (ADMIN_OVERRIDE)
       │
       ▼
  ┌─────────┐
  │  ACTIVE │──┬── Manual exit by Faculty ──→ COMPLETED (MANUAL_EXIT)
  └────┬────┘  │
       │       └── Admin override ──→ COMPLETED (ADMIN_OVERRIDE)
       │
       ▼
  ┌─────────────────┐
  │ AWAITING SUMMARY│──┬── Admin override ──→ COMPLETED (ADMIN_OVERRIDE)
  └─────────────────┘  │
                       └── Grace expires ──→ COMPLETED (AUTO_COMPLETED)
```

---

## Student Lifecycle

### States

```
Enrolled → Active → Suspended → Active → Departed
```

| State | Meaning |
|-------|---------|
| **Enrolled** | The Student has been registered in the system and can attend the workspace. |
| **Suspended** | The Student cannot start new sessions temporarily. Existing sessions are unaffected. |
| **Departed** | The Student is permanently removed from the workspace. No new sessions. |

### Valid Transitions

| From | To | Trigger |
|------|----|---------|
| Enrolled | Suspended | Admin action |
| Suspended | Enrolled | Admin action (reinstatement) |
| Enrolled | Departed | Admin action |
| Suspended | Departed | Admin action |

### Invalid Transitions

| Transition | Reason |
|------------|--------|
| Departed → Enrolled | Departed is a terminal state |
| Departed → Suspended | Cannot suspend a departed student |

---

## Faculty Lifecycle

### States

```
Active → Suspended → Active → Deactivated
```

| State | Meaning |
|-------|---------|
| **Active** | Faculty member can scan and record sessions. |
| **Suspended** | Faculty member temporarily cannot scan. |
| **Deactivated** | Faculty member permanently removed. |

### Valid Transitions

| From | To | Trigger |
|------|----|---------|
| Active | Suspended | Admin action |
| Suspended | Active | Admin action (reinstatement) |
| Active | Deactivated | Admin action |
| Suspended | Deactivated | Admin action |

### Invalid Transitions

| Transition | Reason |
|------------|--------|
| Deactivated → Active | Deactivated is a terminal state |

---

## Category Lifecycle

### States

```
Active → Archived
```

| State | Meaning |
|-------|---------|
| **Active** | Category is available for selection. |
| **Archived** | Category is retired. Existing sessions retain it but new sessions cannot select it. |

### Valid Transitions

| From | To | Trigger |
|------|----|---------|
| Active | Archived | Admin action |

### Invalid Transitions

| Transition | Reason |
|------------|--------|
| Archived → Active | Archiving is irreversible |
| (none) → Archived | A category must be created as Active |

---

## Notification Lifecycle

### States

```
Created → Read
```

| State | Meaning |
|-------|---------|
| **Created** | Notification exists but has not been seen by the Student. |
| **Read** | Student has acknowledged receipt. |

### Valid Transitions

| From | To | Trigger |
|------|----|---------|
| Created | Read | Student marks as read |

### Invalid Transitions

| Transition | Reason |
|------------|--------|
| Read → Created | Read status cannot be reverted |

---

## ActivityLog Lifecycle

### State

```
Created (immutable)
```

The ActivityLog has exactly one state. Once created, an ActivityLog entry is never modified or deleted.

# Notification Flow

## Notification Types

| Type | Purpose | Trigger | Recipient |
|------|---------|---------|-----------|
| Entry | Inform student that their session has been created | StudentEntered event | Student |
| Exit | Inform student that their session has been closed | StudentExited event | Student |
| Category Reminder | Remind student to select a work category | Session remains in Created status beyond threshold | Student |
| Summary Reminder | Remind student to submit a work summary | Session remains in Awaiting Summary status beyond threshold | Student |
| Auto-Completion Notice | Inform student that their session was auto-completed | SessionAutoCompleted event | Student |

---

## Entry Notification

**Trigger:** `StudentEntered` business event (immediately after session creation).

**Recipient:** The Student who entered.

**Message content:** Confirmation that entry was recorded, including entry time. Encouragement to select a work category.

**Delivery timing:** As soon as possible after the event. No delay.

**Business outcome:** Student is aware that their session is active and needs a category selected.

**Retry expectations:** If delivery fails, retry according to delivery service policy. The notification remains available for the student to view.

---

## Exit Notification

**Trigger:** `StudentExited` business event (immediately after exit recording).

**Recipient:** The Student who exited.

**Message content:** Confirmation that exit was recorded, including exit time. Reminder to submit a work summary.

**Delivery timing:** As soon as possible after the event. No delay.

**Business outcome:** Student is aware that attendance is recorded and can submit their summary.

**Retry expectations:** If delivery fails, retry. The notification remains available.

---

## Category Reminder

**Trigger:** Session remains in Created status for a configurable threshold period (e.g., 15 minutes after entry).

**Recipient:** The Student who has not selected a category.

**Message content:** Friendly reminder that a work category has not yet been selected. Note that the session cannot be completed without a category.

**Delivery timing:** After the threshold period elapses. May be sent once or periodically (e.g., every 30 minutes while session is in Created status).

**Business outcome:** Student selects a category, progressing the session to Active.

**Retry expectations:** Delivery is re-triggered on each reminder cycle. If the student never selects a category, reminders continue at the configured interval.

---

## Summary Reminder

**Trigger:** Session remains in Awaiting Summary status for a configurable threshold period (e.g., 30 minutes after exit).

**Recipient:** The Student who has not submitted a summary.

**Message content:** Friendly reminder that a work summary has not yet been submitted. Note that the session will auto-complete after the grace period.

**Delivery timing:** After the threshold period elapses. May be sent once or periodically (e.g., every hour while session is in Awaiting Summary).

**Business outcome:** Student submits a summary before the grace period expires. If they do not, the session auto-completes.

**Retry expectations:** Delivery is re-triggered on each reminder cycle.

---

## Auto-Completion Notice

**Trigger:** `SessionAutoCompleted` business event (when grace period expires).

**Recipient:** The Student whose session was auto-completed.

**Message content:** Notification that the session has been completed because the summary grace period expired. Attendance is recorded. No further action is needed.

**Delivery timing:** Immediately after auto-completion.

**Business outcome:** Student is informed that their session is complete. No further action required.

**Retry expectations:** If delivery fails, retry. The notification remains available.

---

## Notification Lifecycle

```
Business Event
    │
    ▼
Notification Created
    │
    ├──► Handed to Delivery Service
    │       │
    │       ├──► Delivered Successfully → Recipient can read
    │       │
    │       └──► Delivery Failed → Retry (delivery service responsibility)
    │
    ▼
Notification Read (by recipient)
    │
    ▼
Notification Lifecycle Complete
```

---

## Timing Summary

| Notification | First Trigger | Repeat Interval | Expiry |
|-------------|---------------|-----------------|--------|
| Entry | Immediate | None | — |
| Exit | Immediate | None | — |
| Category Reminder | 15 min after entry (configurable) | Every 30 min | Session becomes Active or Completed |
| Summary Reminder | 30 min after exit (configurable) | Every 60 min | Session becomes Completed |
| Auto-Completion Notice | Immediate on auto-completion | None | — |

---

## Business Rules for Notifications

1. A notification is always created even if delivery is expected to fail. The notification record exists regardless of delivery success.
2. Notifications are not deleted. They remain as historical records.
3. A student can view all their past notifications.
4. Notifications are read-only after creation. Only the read status can change.
5. Reminders stop once the triggering condition is resolved (category selected, summary submitted).
6. No notification is sent for auto-completion if the session was completed normally before the grace period expired.

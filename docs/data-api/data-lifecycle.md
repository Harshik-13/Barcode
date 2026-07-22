# Data Lifecycle

## Student Lifecycle

```
┌──────────┐     ┌───────────┐     ┌───────────┐
│ ENROLLED │────▶│ SUSPENDED  │────▶│ DEPARTED   │
│           │     │ (reversible)│     │ (terminal) │
└──────────┘     └───────────┘     └───────────┘
      │                                   │
      └───────────────────────────────────┘
               (direct departure)
```

1. **Creation:** Student record created with ENROLLED status during bulk import or admin panel.
2. **Modification:** Name, email updated via admin panel.
3. **Suspension:** Status changed to SUSPENDED. Reversible to ENROLLED. Prevents new session starts.
4. **Departure:** Status changed to DEPARTED. Terminal state. All existing sessions remain readable.

---

## Faculty Lifecycle

```
┌──────────┐     ┌───────────┐     ┌─────────────┐
│  ACTIVE  │────▶│ SUSPENDED  │────▶│ DEACTIVATED │
│          │     │(reversible) │     │ (terminal)  │
└──────────┘     └───────────┘     └─────────────┘
      │                                       │
      └───────────────────────────────────────┘
               (direct deactivation)
```

1. **Creation:** Faculty account created with ACTIVE status via admin panel.
2. **Modification:** Name, email updated via admin panel.
3. **Suspension:** Status changed to SUSPENDED. Reversible to ACTIVE. Prevents scanning.
4. **Deactivation:** Status changed to DEACTIVATED. Terminal state.

---

## Admin Lifecycle

```
┌──────────┐     ┌─────────────┐
│  ACTIVE  │────▶│ DEACTIVATED │
│          │     │ (terminal)  │
└──────────┘     └─────────────┘
```

1. **Creation:** Admin account created with ACTIVE status during system initialization.
2. **Modification:** Name, email updated via admin panel.
3. **Deactivation:** Status changed to DEACTIVATED. Terminal state.

---

## Session Lifecycle

```
┌──────────┐    ┌──────────┐    ┌──────────────────┐
│          │    │          │    │                  │
│ CREATED  │───▶│  ACTIVE  │───▶│ AWAITING_SUMMARY │
│ (entry)  │    │          │    │                  │
└──────────┘    └──────────┘    └────────┬─────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │              │
                                  │  COMPLETED   │───▶ ARCHIVED (auto)
                                  │              │
                                  └──────────────┘
```

**Transitions:**
1. **CREATED → ACTIVE:** Entry scanned. Session becomes active.
2. **ACTIVE → AWAITING_SUMMARY:** Exit scanned. Student must submit a summary.
3. **AWAITING_SUMMARY → COMPLETED:** Summary submitted by student.
4. **COMPLETED → ARCHIVED:** Archival policy triggers after retention period.

**Alternative transitions:**
- **CREATED → COMPLETED:** Immediate admin override (rare, error correction).
- **ACTIVE → COMPLETED:** Manual exit or auto-completion (timeout). Skips AWAITING_SUMMARY.
- **AWAITING_SUMMARY → COMPLETED:** Admin can force-complete if student fails to submit.

**Data retention:**
- Sessions remain visible in UI for 90 days after COMPLETED timestamp.
- Sessions transition to ARCHIVED after 90 days (configurable).
- Archived sessions remain in database for audit purposes (never physically deleted).

---

## Notification Lifecycle

1. **Creation:** Generated automatically by entry scanning, exit scanning, or reminder cron.
2. **Modification:** Only is_read can be updated (mark as read).
3. **Deletion:** Notifications are not deleted. They age with the student record.

---

## Activity Log Lifecycle

1. **Creation:** Generated automatically for every state-changing operation.
2. **Modification:** Never modified. Append-only.
3. **Deletion:** Never deleted except by data retention policy (e.g., GDPR right to erasure — extremely rare, requires admin approval).

---

## Archival Policy

| Entity | Trigger | Action | Retention |
|--------|---------|--------|-----------|
| Sessions | 90 days after COMPLETED | status → 'ARCHIVED' | Indefinite for audit |
| Notifications | Student DEPARTED + 30 days | Automatically archived | 1 year |
| Activity Logs | — | Never archived | Indefinite |

---

## Data Recovery

**Recovery scenarios:**
1. **Accidental session status change:** Admin can correct status within 24 hours. Logged in activity log.
2. **Wrong category selection:** Category cannot be changed after session reaches COMPLETED. The original assignment is preserved; a correction creates a note in the activity log.
3. **Deleted student unintentionally:** Students cannot be deleted. Recover from DEPARTED by re-enrolling (requires admin approval).

---

## Cleanup Jobs

A scheduled job runs daily:
1. **Auto-completion:** Finds sessions in ACTIVE status with entry_time older than 12 hours → transitions to COMPLETED with reason AUTO_COMPLETED.
2. **Archival:** Finds sessions in COMPLETED status with completed_at older than 90 days → transitions to ARCHIVED.
3. **Reminder:** Finds sessions in AWAITING_SUMMARY status older than 30 minutes → sends REMINDER notification.

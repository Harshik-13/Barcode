# Offline & Synchronization Strategy

## Design Principles

1. **Business rules are never violated, even offline.** Offline behavior must produce the same outcome as online behavior once synchronized.
2. **Scanning must feel responsive.** Faculty should receive immediate feedback even without connectivity.
3. **No data loss.** All business events recorded offline must be preserved and synchronized.
4. **Idempotency.** Synchronizing the same event twice must not produce duplicate business state.
5. **Event ordering.** The order of business events must be preserved during synchronization.

---

## Faculty Offline Scenarios

### Scenario: Faculty Loses Internet During Scanning

**Behavior:**
- Faculty can still scan student identification.
- Local verification confirms the student is known and eligible (based on cached student roster).
- A pending session record is created locally with status "pending sync."
- Faculty receives the same confirmation as online.
- When connectivity is restored, local records are synchronized.

**Synchronization:**
- Each pending record includes: action type (entry/exit), student identifier, timestamp, Faculty identifier.
- On sync, each record is processed in order of capture.
- If a record conflicts with current server state (e.g., student already has an active session), the sync rejects it and Faculty is notified on next connectivity.
- Conflicts are flagged for review rather than silently overwritten.

**Conflict Example:**
1. Faculty A (offline) scans Student X entry at 09:00.
2. Faculty B (online) scans Student X entry at 09:05 (creates session).
3. Faculty A's sync attempts to create entry for Student X at 09:00.
4. Server rejects because Student X already has an active session.
5. Faculty A is notified of the conflict on next online check.

---

### Scenario: Faculty Device Loses All Cached Data

**Behavior:**
- Faculty must re-authenticate.
- Student roster and relevant session data are re-fetched from server.
- Any locally cached but unsynchronized records are lost.
- Faculty must manually reconcile any sessions that were not synced.

**Mitigation:**
- The Faculty device should persist pending records in durable local storage.
- Upon reconnection, sync should occur before accepting new scans.

---

## Student Offline Scenarios

### Scenario: Student Is Offline and Needs to Select Category or Submit Summary

**Behavior:**
- The student interface should still display relevant information (active session status).
- Category selection and summary submission require server confirmation to enforce business rules.
- If offline, the student can compose but not submit.
- On reconnection, pending actions are submitted in order.
- If the action is no longer valid (e.g., session was auto-completed), the student is informed.

---

### Scenario: Student Offline During Notification Delivery

**Behavior:**
- Notifications are created server-side regardless of student connectivity.
- The Notification Delivery service holds undelivered notifications.
- On reconnection, pending notifications are delivered.
- Student sees all notifications, including those from the offline period.

---

## Network Interruption Handling

### Partial Connectivity (Intermittent)

| Situation | Behavior |
|-----------|----------|
| Faculty scans — request sent but response not received | Scanning device should idempotently retry. The server must handle duplicates gracefully. |
| Faculty scans — request not sent (no connectivity) | Scan is cached locally and synced when connectivity returns. |
| Sync in progress — connection lost mid-sync | Already-processed records are marked synced. Remaining records are retried on next connection. |
| Sync succeeds — acknowledgment lost | The server has processed the event. The client retries but server detects duplicate and confirms success without re-processing. |

### Extended Outage

| Duration | Behavior |
|----------|----------|
| Minutes | Normal offline operation. Scans cached and synced on return. |
| Hours | Local cache may grow. Faculty can continue scanning as long as local storage permits. |
| Multiple days | Faculty should check storage capacity. If storage is full, oldest unsynced records may need to be discarded (with warning) or scanning must stop. |

---

## Conflict Resolution

### Conflict Types

| Conflict | Resolution |
|----------|-----------|
| Entry scan for student who already has an incomplete session | Offline entry is rejected. Online entry was processed first. Faculty notified. |
| Exit scan for student with no active session | Offline exit is rejected. Session may have been completed online. Faculty notified. |
| Duplicate entry from two offline Faculty members | First to sync wins. Second is rejected. Both Faculty notified. |
| Category selected while offline, then online session state changed | Student's pending category selection is validated on sync. If session state changed (e.g., auto-completed), the selection is rejected and student is informed. |
| Summary submitted offline, but session already auto-completed | Summary is stored but session remains AUTO_COMPLETED. The summary may be attached to the session for reference. |

### Conflict Notification

When a conflict is detected during synchronization:
1. The conflicting record is marked as "failed sync" with a reason code.
2. The actor who created the record is notified on their next interaction.
3. The conflict is recorded in the Activity Log for audit purposes.
4. Manual resolution may be required by Admin.

---

## Duplicate Synchronization

### Prevention

- Each offline record carries a unique client-generated identifier.
- On sync, the server checks if this identifier has already been processed.
- If the identifier exists, the sync is acknowledged as successful without re-processing.

### Recovery

- If a client resends the same record (e.g., after connection loss during acknowledgment), the server detects the duplicate via the identifier.
- The server responds with success confirmation.
- No duplicate business event is produced.

---

## Event Ordering

- Records from a single Faculty device are synchronized in the order they were captured.
- Records from different devices are ordered by their capture timestamps.
- If two records have the same timestamp, ordering is undefined. The business rules (e.g., one active session per student) prevent conflicts in most cases.
- Automatic reconciliation: when ordering ambiguity is detected, the system defers to the server-side state. Offline records that cannot be reconciled are flagged for manual review.

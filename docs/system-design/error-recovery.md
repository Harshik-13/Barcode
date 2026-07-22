# Error & Recovery Flows

## ER1: Duplicate Scan (Entry)

**Detection:** Faculty scans a student who already has an incomplete session.

**Expected behavior:** System rejects the scan. No duplicate session created. Faculty is informed that the student already has an incomplete session.

**Recovery:** No recovery needed — no incorrect state was created.

**User communication:** "This student already has an active session. They cannot enter again until it is completed."

**Escalation:** If the error persists (same student scanned repeatedly), Faculty may flag the student for Admin investigation.

---

## ER2: Student Already Inside Workspace

**Detection:** Faculty scans a student for entry, but the student is already recorded as inside (has Active or Created session).

**Expected behavior:** Entry is rejected. Faculty is informed.

**Recovery:** Verify the student's identity. If the student was supposed to have exited already, Faculty may perform a Manual Exit for the old session, then create a new entry.

**User communication:** "This student appears to already be inside. Please verify."

**Escalation:** If the student's session status is incorrect, Admin may override the session.

---

## ER3: Exit Without Entry

**Detection:** Faculty scans a student for exit, but no Created or Active session exists.

**Expected behavior:** Exit is rejected. Faculty is informed that the student has no active session.

**Recovery:** Determine how the student entered. If they entered without being scanned, Faculty may perform a Manual Exit to document the departure retroactively.

**User communication:** "No active session found for this student. Use manual exit if needed."

**Escalation:** If patterns of unscanned entries emerge, Admin may review procedures.

---

## ER4: Invalid Barcode

**Detection:** Scanned identification does not match any enrolled student.

**Expected behavior:** Scan is rejected. Faculty is informed.

**Recovery:** Faculty visually verifies the student's identity. If the student is valid but the barcode is damaged, Faculty may use an alternative verification method.

**User communication:** "Student not found. Please verify the identification."

**Escalation:** Admin may need to update or reissue the student's identification.

---

## ER5: Notification Delivery Failure

**Detection:** Notification Engine creates notification but delivery service reports failure.

**Expected behavior:** The notification record exists regardless of delivery success. The delivery service retries according to its own policy.

**Recovery:** Student can view pending notifications when they come online. The notification remains in "Created" status (not "Read").

**User communication:** No user-facing message for delivery failure. Notifications appear when the student connects.

**Escalation:** Persistent delivery failure for a specific student may indicate an incorrect contact method. Admin should verify the student's contact information.

---

## ER6: Manual Correction by Faculty

**Detection:** Faculty identifies an incorrect session state (e.g., missing exit, wrong student).

**Expected behavior:** Faculty initiates Manual Exit with a documented reason.

**Recovery:** Manual Exit completes the session. The Activity Log records the correction with Faculty identity and reason.

**User communication:** "Manual exit recorded for [student] at [time]. Reason: [reason]."

**Escalation:** Frequent manual corrections may indicate a process issue requiring Admin attention.

---

## ER7: Category Never Selected

**Detection:** Session remains in Created status for an extended period.

**Expected behavior:** System sends category reminder notifications at configured intervals. Session cannot become Active or complete without a category.

**Recovery:**
- Student selects a category (normal path).
- Faculty performs Manual Exit with category assignment.
- Admin overrides the session with ADMIN_OVERRIDE.

**User communication (student):** "Please select a work category for your session."
**User communication (faculty):** "This session has no category. You may assign one during manual exit."

**Escalation:** If the student never selects a category and Faculty is unavailable, Admin override is required.

---

## ER8: Summary Never Submitted

**Detection:** Session remains in Awaiting Summary status.

**Expected behavior:** System sends summary reminder notifications. Grace period timer is running.

**Recovery:**
- Student submits summary before grace period expires (normal path).
- Grace period expires and session auto-completes (AUTO_COMPLETED).

**User communication (student):** "Please submit your work summary. Your session will auto-complete in [time remaining]."

**Escalation:** No escalation needed. Auto-completion handles this case.

---

## ER9: Unexpected Interruption During Scanning

**Detection:** Faculty initiates a scan but the process is interrupted (power loss, device crash, network failure).

**Expected behavior:** The system must handle this at two levels:
1. If the scan was processed before interruption: the session state is correct. Faculty can verify on reconnection.
2. If the scan was not processed: no state change occurred. Faculty can re-scan.

**Recovery:** Faculty reconnects and checks the student's session status. If the session exists, no action needed. If not, Faculty re-scans.

**User communication:** "Connection interrupted. Please verify the session status before re-scanning."

**Escalation:** If sessions are lost due to interruption, Admin may need to reconstruct them using manual procedures.

---

## ER10: Concurrent Session Creation Race Condition

**Detection:** Two Faculty members scan the same student for entry simultaneously.

**Expected behavior:** Exactly one session is created. The second attempt fails.

**Recovery:** The Faculty whose scan was rejected can verify the student's active session. No further action needed.

**User communication (winner):** "Entry recorded."
**User communication (loser):** "This student already has an active session."

**Escalation:** Not needed. The system correctly handles the race condition.

---

## ER11: Admin Override

**Detection:** Admin identifies a session that requires correction (wrong time, missing category, stuck in incomplete state).

**Expected behavior:** Admin performs override with documented reason. Session moves to Completed with ADMIN_OVERRIDE reason.

**Recovery:** The session is corrected. The Activity Log records the override.

**User communication:** "Session overridden. Previous state: [state]. New state: Completed. Reason: [reason]."

**Escalation:** Overrides should be reviewed periodically to identify patterns indicating systemic issues.

---

## ER12: Device Clock Drift

**Detection:** Exit time is recorded before entry time, or session duration is unrealistically long/short.

**Expected behavior:** Faculty is warned about potential clock discrepancy at the time of scanning. Session is flagged for review.

**Recovery:** Faculty may correct the time during Manual Exit. Admin may override to correct timestamps.

**User communication:** "Warning: Device time appears inaccurate. The recorded time may need correction."

**Escalation:** Device clock drift should be reported to Admin for device maintenance.

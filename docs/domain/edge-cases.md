# Edge Cases

This document defines expected business behavior for abnormal, unusual, or error situations.

---

## E1: Faculty Scans the Same Student Twice for Entry

**Situation:** A Faculty member scans a Student who already has a session in Created, Active, or Awaiting Summary status.

**Expected Business Behavior:** The system rejects the second entry. The Faculty is informed that the Student already has an incomplete session. No duplicate session is created.

---

## E2: Faculty Scans a Student for Exit Who Has No Active Session

**Situation:** A Faculty member attempts to record exit for a Student who has no session in Created or Active status (already in Awaiting Summary, Completed, or never entered).

**Expected Business Behavior:** The system rejects the exit recording. The Faculty is informed that the Student has no active session to exit from.

---

## E3: Faculty Accidentally Scans the Same Student Twice in Rapid Succession (Double-Tap)

**Situation:** The same student barcode is scanned twice within seconds.

**Expected Business Behavior:** The system detects the duplicate scan and processes only the first one. The second scan is silently ignored — not logged as an error.

---

## E4: Student Never Selects a Category After Entry

**Situation:** A session is Created (entry recorded) but the Student never selects a Category. The session remains in Created status.

**Expected Business Behavior:** The system generates a reminder Notification after a reasonable period. If the Student exits without selecting a Category, Faculty records exit and the session moves to Awaiting Summary. The session cannot reach Completed without a Category. Faculty may perform a Manual Exit (with a business reason) to complete the session with Completion Reason MANUAL_EXIT, or Admin may use ADMIN_OVERRIDE to assign a Category and complete the session.

**Business rule:** Every completed session must have a Category.

---

## E5: Student Never Submits a Summary After Exit

**Situation:** Exit is recorded and the session is in Awaiting Summary, but the Student never submits a work summary.

**Expected Business Behavior:** The system generates a reminder Notification after a reasonable period. When the grace period expires, the session is automatically Completed with Completion Reason AUTO_COMPLETED. Attendance remains valid. The absence of a summary does not prevent session completion.

**Business rule:** Attendance and work documentation are separate concerns. Attendance is valid regardless of summary submission.

---

## E6: Faculty Scans an Invalid or Unknown Barcode

**Situation:** A barcode is scanned that does not correspond to any enrolled Student.

**Expected Business Behavior:** The system informs the Faculty that the Student was not found. No session is created or modified.

---

## E7: Student Identifier Is Scanned for a Suspended Student

**Situation:** A Faculty member scans the barcode of a suspended Student.

**Expected Business Behavior:** The system informs the Faculty that the Student is suspended and cannot start a session. No session is created.

---

## E8: Faculty with Suspended Account Attempts to Scan

**Situation:** A suspended Faculty member attempts to record entry or exit.

**Expected Business Behavior:** The system rejects the operation. The Faculty is informed that their account is not active.

---

## E9: Network Interruption During Scanning

**Situation:** A Faculty member scans a barcode but the network connection is lost before the system can process the request.

**Expected Business Behavior:** The Faculty app should detect the failure and allow retry when connectivity is restored. If the scan was processed but the response was not received, the system must ensure idempotency — the retry should not create a duplicate session.

---

## E10: Student Attends Without Being Scanned In

**Situation:** A Student enters the workspace without being scanned.

**Expected Business Behavior:** No session exists. If they later attempt to exit, scanning for exit will fail because no active session exists. Faculty may perform a Manual Exit as an exceptional action to resolve the situation, recording the entry time approximately and documenting the reason.

---

## E11: Student Exits Without Being Scanned Out

**Situation:** A Student leaves the workspace without being scanned out.

**Expected Business Behavior:** The session remains Active or Awaiting Summary (depending on whether category was selected). The system may generate a reminder after a prolonged period. Faculty may perform a Manual Exit as an exceptional action, recording the approximate exit time and documenting the reason. Reports distinguish between Normal Exit and Manual Exit.

---

## E12: System Generates Duplicate Notification

**Situation:** Two identical Notifications are generated for the same event.

**Expected Business Behavior:** The system should prevent this at the event generation level by ensuring events are idempotent. If duplicates occur, they are treated as independent notifications.

---

## E13: Faculty Scans Student Barcode Instead of Faculty Credentials for Login

**Situation:** A Faculty member scans a student barcode thinking it will log them into the system.

**Expected Business Behavior:** Scanning is for recording attendance, not for authentication. These are separate concerns.

---

## E14: Concurrent Scan Attempts for the Same Student

**Situation:** Two Faculty members simultaneously scan the same Student's barcode for entry.

**Expected Business Behavior:** Only one session is created. The second attempt is rejected. The first request to be processed succeeds; the second fails.

---

## E15: Student Account Is Departed but Has Active Sessions

**Situation:** An Admin marks a Student as Departed, but the Student has an open session.

**Expected Business Behavior:** The Admin is warned that the Student has an incomplete session. The departure should not affect the existing session — it can still be completed normally. No new sessions can be started after departure.

---

## E16: Category Is Archived While Students Have It Selected in Active Sessions

**Situation:** An Admin archives a Category that is currently selected in one or more Active sessions.

**Expected Business Behavior:** The archiving succeeds. Existing sessions retain the Category. The Category is no longer available for new sessions.

---

## E17: System Clock Drift Causes Invalid Session Duration

**Situation:** The system clock drifts, causing inaccurate entry/exit times.

**Expected Business Behavior:** Exit time is validated against entry time. If duration is negative or exceeds a reasonable threshold, the session is flagged for review. Clock discrepancies should be warned about at the time of recording.

---

## E18: An Admin Tries to Record Attendance

**Situation:** An Admin attempts to scan a student barcode to record entry or exit.

**Expected Business Behavior:** The system rejects the operation. Admin accounts do not have the capability to record attendance. Admin may use ADMIN_OVERRIDE for exceptional session corrections but cannot perform normal scanning.

---

## E19: Student Selects Category, Then Changes Mind Before Exiting

**Situation:** A Student selects a Category, moving the session to Active, then wants to change it.

**Expected Business Behavior:** Category cannot be changed while the session is Active. If a different Category is more appropriate, the session must be completed normally and a new session started, or Admin may use ADMIN_OVERRIDE to correct the session.

---

## E20: Grace Period Expires but Session Cannot Be Auto-Completed (Missing Category)

**Situation:** A session in Awaiting Summary has no Category assigned and the grace period expires.

**Expected Business Behavior:** The session cannot be Completed because Category is mandatory. The system flags the session for Admin attention. Admin must either assign a Category and complete it (ADMIN_OVERRIDE) or Faculty must perform Manual Exit with Category assignment.

---

## E21: Scanner Device Failure During Exit

**Situation:** The scanning device fails at the moment of exit recording.

**Expected Business Behavior:** Faculty may perform a Manual Exit as an exceptional action, recording the exit manually and documenting the reason (device failure).

---

## E22: Student Has a Session in Awaiting Summary and Attempts to Enter Again

**Situation:** A Student whose session is in Awaiting Summary (exit recorded, no summary yet) is scanned for entry.

**Expected Business Behavior:** The system rejects the entry. The Student already has an incomplete session. The existing session must be Completed (or auto-completed via grace period) before a new session can be Created.

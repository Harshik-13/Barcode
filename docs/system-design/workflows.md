# Business Workflows

## W1: Authentication

**Trigger:** Actor attempts to access the system.

**Participants:** Actor (Student, Faculty, or Admin), Identity Provider, System.

**Steps:**
1. Actor provides identity credentials.
2. System forwards credentials to Identity Provider.
3. Identity Provider confirms identity and returns verified identity data.
4. System determines the actor's role (Student, Faculty, or Admin).
5. System establishes an authenticated session for the actor.
6. Actor is granted access appropriate to their role.

**Business events produced:** None (authentication is a prerequisite to business events).

**Failure handling:**
- Identity verification fails: Actor is informed. Access is denied.
- Unknown identity: Actor is informed. New accounts may be provisioned by Admin.
- Domain not allowed: Actor is informed that their email domain is not permitted.

---

## W2: Entry Scan

**Trigger:** Faculty scans a student's identification at workspace entrance.

**Participants:** Faculty, Student, System.

**Preconditions:**
- Faculty is authenticated and active.
- Student is enrolled and not suspended.
- Student has no existing incomplete session (Created, Active, or Awaiting Summary).

**Steps:**
1. Faculty scans student identification.
2. System verifies the student's identity.
3. System checks student eligibility (enrolled, not suspended).
4. System checks for existing incomplete session.
5. System creates a new WorkspaceSession in Created status.
6. System records entry time.
7. System records Faculty member as entry recorder.
8. System requests Notification Engine to generate an entry notification.
9. System signals success to Faculty.

**Business events produced:** `StudentEntered`

**Failure handling:**
- Invalid identification: Faculty informed. No session created.
- Student suspended: Faculty informed. No session created.
- Student already inside: Faculty informed that student has an incomplete session. No duplicate created.
- Faculty suspended: Operation rejected. Faculty informed.

---

## W3: Category Selection

**Trigger:** Student selects a work category for their session.

**Participants:** Student, System.

**Preconditions:**
- Student is authenticated.
- Student has a session in Created status.
- Category exists and is active.

**Steps:**
1. Student views available categories.
2. Student selects a category.
3. System verifies the session is in Created status.
4. System verifies the category is active.
5. System assigns the category to the session.
6. System transitions session status from Created to Active.
7. System signals success to Student.

**Business events produced:** `CategorySelected`

**Failure handling:**
- Session not in Created status: Student informed. Category cannot be selected after exit.
- Category archived: Student informed. Archived categories cannot be selected.
- No active session: Student informed. Category selection requires an active session.

---

## W4: Exit Scan

**Trigger:** Faculty scans a student's identification at workspace exit.

**Participants:** Faculty, Student, System.

**Preconditions:**
- Faculty is authenticated and active.
- Student has a session in Created or Active status.

**Steps:**
1. Faculty scans student identification.
2. System verifies the student's identity.
3. System finds the student's incomplete session (Created or Active).
4. System records exit time.
5. System records Faculty member as exit recorder.
6. System transitions session status to Awaiting Summary.
7. System requests Notification Engine to generate an exit notification.
8. System signals success to Faculty.

**Business events produced:** `StudentExited`

**Failure handling:**
- No incomplete session: Faculty informed. Student has no active session to exit from.
- Session already in Awaiting Summary: Faculty informed. Exit already recorded.
- Faculty suspended: Operation rejected.

---

## W5: Manual Exit

**Trigger:** Faculty performs a manual exit when normal scanning is not possible.

**Participants:** Faculty, Student, System.

**Preconditions:**
- Faculty is authenticated and active.
- Student has a session in Created or Active status.
- A business reason for manual exit is provided.

**Steps:**
1. Faculty identifies the student (may use alternative verification).
2. Faculty initiates manual exit workflow.
3. Faculty provides business reason (e.g., "student left without scan," "device failure").
4. System verifies the student has an incomplete session.
5. System records exit time (current time or approximate time as provided).
6. System records Faculty member as exit recorder.
7. System assigns Completion Reason MANUAL_EXIT.
8. System ensures a category is assigned (if missing, Faculty may provide one).
9. System transitions session to Completed status.
10. System records the manual exit in the Activity Log with Faculty identity and reason.
11. System may request Notification Engine to generate an exit notification.
12. System signals success to Faculty.

**Business events produced:** `ManualExitRecorded`

**Failure handling:**
- No incomplete session: Faculty informed. Cannot perform manual exit without an active session.
- No reason provided: Faculty prompted to provide a reason.
- Faculty suspended: Operation rejected.

---

## W6: Summary Submission

**Trigger:** Student submits a work summary.

**Participants:** Student, System.

**Preconditions:**
- Student is authenticated.
- Student has a session in Awaiting Summary status.

**Steps:**
1. Student writes work summary.
2. Student submits summary.
3. System verifies the session is in Awaiting Summary status.
4. System validates summary content (not empty, within length limit).
5. System assigns summary to the session.
6. System transitions session to Completed status.
7. System assigns Completion Reason NORMAL.
8. System signals success to Student.

**Business events produced:** `SummarySubmitted` (which results in `SessionCompleted`)

**Failure handling:**
- Session not in Awaiting Summary: Student informed. Summary can only be submitted after exit.
- Summary empty: Student informed. Summary must have content.
- Summary too long: Student informed. Summary exceeds maximum length.
- Grace period expired: Student informed. Session was already auto-completed.

---

## W7: Auto-Completion

**Trigger:** Summary grace period expires without submission.

**Participants:** System.

**Preconditions:**
- Session is in Awaiting Summary status.
- Grace period has elapsed since exit time.

**Steps:**
1. System detects grace period expiry.
2. System verifies session is still in Awaiting Summary.
3. System verifies a category is assigned.
4. System transitions session to Completed status.
5. System assigns Completion Reason AUTO_COMPLETED.
6. System records the auto-completion in the Activity Log.
7. System signals completion (available for reporting).

**Business events produced:** `SessionAutoCompleted`

**Failure handling:**
- Category missing: If session has no category, auto-completion is blocked. Session flagged for Admin attention.
- Session already completed: No action taken. Grace period is irrelevant for completed sessions.

---

## W8: Notification Delivery

**Trigger:** A business event occurs that requires student notification.

**Participants:** System, Notification Engine, Notification Delivery service, Student.

**Steps:**
1. A business event is produced (StudentEntered, StudentExited, ReminderTriggered).
2. Notification Engine receives the event.
3. Notification Engine creates a Notification object with type, message, and recipient.
4. Notification Engine hands the notification to the Notification Delivery service.
5. Notification Delivery service delivers to the Student.
6. Student receives and reads the notification.
7. Student may mark the notification as read.

**Business events produced:** `NotificationSent`, `NotificationRead`

**Failure handling:**
- Delivery failure: Notification Engine still creates the notification record. Delivery is retried according to delivery service policy.
- Student unreachable: Notification remains in "Created" status. Available for the student to view when they come online.

---

## W9: Session Override

**Trigger:** Admin needs to correct or complete a session.

**Participants:** Admin, System.

**Preconditions:**
- Admin is authenticated.
- Session exists in any state.

**Steps:**
1. Admin reviews the session requiring attention.
2. Admin determines the correct state and attributes.
3. Admin initiates override with a documented reason.
4. System verifies Admin authorization.
5. System applies the override (completes the session, assigns category, corrects attributes).
6. System sets Completion Reason to ADMIN_OVERRIDE.
7. System records the override in the Activity Log with Admin identity and reason.
8. System signals success to Admin.

**Business events produced:** `SessionOverridden`

**Failure handling:**
- Session already completed: Admin warned. Override can modify completed sessions but should be rare.
- Missing required data: Admin prompted to provide all necessary information.

---

## W10: Session Archival

**Trigger:** Admin archives completed sessions.

**Participants:** Admin, System.

**Preconditions:**
- Admin is authenticated.
- Sessions are in Completed status.

**Steps:**
1. Admin selects completed sessions for archival.
2. Admin initiates archival.
3. System verifies sessions are in Completed status.
4. System transitions sessions to Archived status.
5. System signals success to Admin.

**Business events produced:** `SessionArchived`

**Failure handling:**
- Session not completed: Admin informed. Only completed sessions can be archived.
- Session already archived: No action taken.

---

## W11: Reporting

**Trigger:** Faculty or Admin requests attendance data.

**Participants:** Faculty, Admin, System.

**Preconditions:**
- Actor is authenticated.
- Actor has reporting permission.

**Steps:**
1. Actor specifies report parameters (date range, student, category, session status).
2. System gathers matching session data.
3. System computes derived metrics (total attendance, category breakdown, average duration).
4. System distinguishes completion reasons (NORMAL, AUTO_COMPLETED, MANUAL_EXIT, ADMIN_OVERRIDE).
5. System presents report to actor.

**Business events produced:** None (read-only operation).

**Failure handling:**
- No data: Empty report presented.
- Invalid parameters: Actor prompted to correct filters.

---

## W12: Administration

**Trigger:** Admin manages users, categories, or settings.

**Participants:** Admin, System.

**Steps:**
1. Admin selects management function (users, categories, settings).
2. Admin performs action (create, suspend, rename, archive, configure).
3. System validates the action.
4. System applies the change.
5. System records the action in the Activity Log.

**Business events produced:** As appropriate (StudentSuspended, CategoryArchived, etc.)

**Failure handling:**
- Invalid operation: Admin informed (e.g., cannot delete a category, only archive).
- Duplicate: Admin informed of existing entry.
- Active sessions warning: Admin warned if action affects active sessions.

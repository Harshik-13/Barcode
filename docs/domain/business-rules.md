# Business Rules

## Session Lifecycle Rules

### Rule 1: One Active Session Per Student
A Student may have at most one WorkspaceSession in Created, Active, or Awaiting Summary status at any time. Attempting to create a new session while an existing incomplete session exists is not allowed.

### Rule 2: Entry Requires No Incomplete Session
A session can only be created (entry recorded) when the Student has no existing session in Created, Active, or Awaiting Summary status.

### Rule 3: Exit Requires an Existing Session
A session can only be closed (exit recorded) when a session exists for that Student in Created or Active status.

### Rule 4: Category Selection After Entry, Required Before Active
A Student selects a work Category only after entry has been recorded. A session transitions from Created to Active only after a Category has been selected. A session cannot be Active without a Category.

### Rule 5: Category Is Required for Completion
Every WorkspaceSession must have exactly one Category assigned before reaching the Completed state. "Uncategorized" is not a valid business concept. A session with a missing category cannot be Completed.

### Rule 6: Summary After Exit
A Student submits a work summary only after exit has been recorded (session is in Awaiting Summary status). A summary cannot be submitted while the session is still Active.

### Rule 7: Attendance Is Valid Without Summary
Attendance (entry and exit) is recorded and valid regardless of whether a work summary is submitted. A session is Completed even without a summary, but the Completion Reason reflects how it reached completion.

### Rule 8: Grace Period for Summary Submission
After exit is recorded, a grace period exists for the Student to submit a work summary. If the grace period expires without a summary, the session is automatically Completed with Completion Reason AUTO_COMPLETED.

### Rule 9: Entry Time Precedes Exit Time
The exit time of a session must always be after its entry time. A session cannot have zero or negative duration.

---

## Category Rules

### Rule 10: Category Defined by Admin
Only an Admin can create, rename, or archive Categories.

### Rule 11: Active Categories Available for Selection
Only Active (non-archived) Categories can be selected for new sessions.

### Rule 12: Archived Categories Retained on Historical Sessions
Archiving a Category does not remove it from existing sessions. Historical data is preserved.

### Rule 13: Categories Are Never Deleted
Categories are archived (soft removed) but never physically deleted.

---

## Manual Exit Rules

### Rule 14: Manual Exit Is an Exception
Manual exit is an exceptional action performed by Faculty when normal exit scanning is not possible. It is not the normal workflow.

### Rule 15: Manual Exit Requires a Business Reason
Every manual exit must include a business reason documenting why the normal exit process could not be followed.

### Rule 16: Manual Exit Produces MANUAL_EXIT Completion Reason
A session completed via manual exit carries Completion Reason MANUAL_EXIT.

### Rule 17: Manual Exit Is Logged
Every manual exit must be recorded in the Activity Log with the Faculty member's identity and the stated business reason.

---

## Admin Override Rules

### Rule 18: Admin Override Completes or Corrects Sessions
An Admin may explicitly complete or correct a session in any state. The session is Completed with Completion Reason ADMIN_OVERRIDE.

### Rule 19: Admin Override Is Logged
Every Admin override must be recorded in the Activity Log with the Admin's identity and the reason for the override.

---

## Completion Reason Rules

### Rule 20: Every Completed Session Has a Completion Reason
All sessions that reach the Completed state must have exactly one Completion Reason.

### Rule 21: Completion Reason Is Set at Completion Time
The Completion Reason is determined when the session enters the Completed state and is immutable thereafter.

### Rule 22: NORMAL Requires Both Exit and Summary
A session receives NORMAL Completion Reason only when exit was recorded normally AND a summary was submitted within the grace period.

### Rule 23: AUTO_COMPLETED Requires Grace Period Expiry
A session receives AUTO_COMPLETED Completion Reason only when the grace period expired without a summary being submitted.

### Rule 24: MANUAL_EXIT Requires Faculty Action
A session receives MANUAL_EXIT Completion Reason only when a Faculty member performed a manual exit.

### Rule 25: ADMIN_OVERRIDE Requires Admin Action
A session receives ADMIN_OVERRIDE Completion Reason only when an Admin explicitly completed or corrected the session.

---

## Archival Rules

### Rule 26: Completed Sessions May Be Archived
An Admin may archive a Completed session. Archiving removes it from active views.

### Rule 27: Archived Sessions Are Immutable
Once a session is Archived, its data cannot be modified under any circumstances.

### Rule 28: Archive Does Not Delete
Archiving preserves the complete session record. It is not deletion.

---

## Notification Rules

### Rule 29: Entry Notification
When a session is Created (entry recorded), a Notification of type "entry" is generated for the Student.

### Rule 30: Exit Notification
When a session has exit recorded, a Notification of type "exit" is generated for the Student.

### Rule 31: Category Reminder Notification
If a session remains in Created status (Category not selected) for a significant period after entry, a reminder Notification may be generated.

### Rule 32: Summary Reminder Notification
If a session remains in Awaiting Summary status for a significant period after exit, a reminder Notification may be generated.

### Rule 33: Notifications Are Immutable
Once created, the content and type of a Notification cannot be changed.

---

## Session Integrity Rules

### Rule 34: Completed Sessions Are Immutable
Once a session is Completed, its attributes (entry time, exit time, category, summary, completion reason) cannot be changed.

### Rule 35: Active Sessions Have Immutable Entry Time
Once a session is Active, the entry time cannot be changed.

### Rule 36: Session Status Progression Is Forward-Only
Session status moves only forward: Created → Active → Awaiting Summary → Completed → Archived. No backward transitions are allowed.

---

## Activity Log Rules

### Rule 37: Every State Change Is Logged
Every creation, status transition, and manual override of a WorkspaceSession is recorded in the ActivityLog.

### Rule 38: Manual Exit and Admin Override Are Always Logged
Manual exit and admin override actions always produce an ActivityLog entry with the actor's identity and the stated reason.

### Rule 39: ActivityLog Is Append-Only
Once an entry is written to the ActivityLog, it cannot be modified or deleted.

---

## Actor Rules

### Rule 40: Faculty Scans, Students Do Not
Only Faculty may scan identification to record entry or exit. Students never perform scanning.

### Rule 41: Faculty Verifies Before Recording
Before creating or closing a session, the Faculty actor must verify that the scanned identity corresponds to an enrolled Student.

### Rule 42: Admin Does Not Record Attendance Directly
An Admin actor does not record entry or exit. Admin may override or correct sessions but does not perform normal scanning.

### Rule 43: Student Selects Own Category
No actor other than the Student may select a Category for a session under normal circumstances.

### Rule 44: Student Writes Own Summary
No actor other than the Student may submit a work summary.

---

## Workspace Rules

### Rule 45: Session Duration Expectation
A session is expected to represent a reasonable work period. Unusually short or unusually long sessions may trigger alerts or require justification.

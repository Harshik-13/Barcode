# User Journeys

## Student Journey

### Goal
Attend the workspace, perform work under a chosen category, and document work done.

### Starting Condition
Student is enrolled and not currently in an active session.

### Journey Steps

1. **Arrive at workspace.**
   - Student presents identification to Faculty at entrance.
   - Faculty scans identification.

2. **Entry notification received.**
   - System sends entry notification.
   - Student is notified that their session has been created.

3. **Select work category.**
   - Student reviews available work categories.
   - Student selects the category that matches their planned work.
   - Session becomes Active.

4. **Perform work.**
   - Student works in the workspace.
   - Session remains Active.

5. **Prepare to leave.**
   - Student presents identification to Faculty at exit.
   - Faculty scans identification.
   - Session moves to Awaiting Summary status.
   - System sends exit notification.

6. **Submit work summary.**
   - Student writes a brief summary of work performed.
   - Student submits summary.
   - Session becomes Completed with Completion Reason NORMAL.

### Alternative Paths

**Path A: Student exits without selecting category.**
- Faculty scans exit while session is in Created status.
- Session moves to Awaiting Summary.
- Student must still select a category before session can be Completed.
- Faculty may perform Manual Exit (with reason) if category cannot be selected.

**Path B: Student never submits summary.**
- Session remains Awaiting Summary.
- System sends reminder notification(s).
- Grace period expires.
- Session auto-completes with Completion Reason AUTO_COMPLETED.

**Path C: Student forgets to get scanned on exit.**
- Session remains Active.
- Faculty notices discrepancy during occupancy check.
- Faculty performs Manual Exit with documented reason.

### Failure Paths

- **Already inside:** Student attempts entry but already has an incomplete session. Rejected.
- **Suspended:** Student attempts entry but account is suspended. Rejected.
- **No session:** Student attempts to submit summary without having an active session. Rejected.

### Completion Condition
Session reaches Completed status (any Completion Reason).

---

## Faculty Journey

### Goal
Record student attendance accurately and efficiently.

### Starting Condition
Faculty is authenticated and active.

### Journey Steps

1. **Prepare for scanning.**
   - Faculty verifies scanning device is operational.
   - Faculty positions at workspace entrance/exit.

2. **Record entry.**
   - Student presents identification.
   - Faculty scans identification.
   - System confirms entry recorded.
   - Faculty sees confirmation.

3. **Monitor occupancy.**
   - Faculty periodically checks live occupancy.
   - Faculty can see who is currently inside.

4. **Record exit.**
   - Student presents identification at exit.
   - Faculty scans identification.
   - System confirms exit recorded.
   - Faculty sees confirmation.

5. **Perform manual exit (exceptional).**
   - Student left without being scanned.
   - Faculty initiates manual exit.
   - Faculty provides business reason.
   - System records manual exit with reason.
   - Session is completed.

6. **Check reports.**
   - Faculty views attendance reports.
   - Faculty reviews analytics.
   - Faculty searches for specific students.

### Alternative Paths

**Path A: Scanner malfunction.**
- Faculty switches to manual exit procedure.
- Records reason as "scanner device failure."
- Completes session manually.

**Path B: Shift handover.**
- First Faculty records entry at beginning of day.
- Different Faculty records exit later.
- System records both Faculty identities independently.

### Failure Paths

- **Invalid barcode:** Scanned identification does not match any student. Rejected with message.
- **Suspended student:** Scanned student is suspended. Entry rejected.
- **No active session:** Scanned for exit but no active session exists. Rejected.
- **Account suspended:** Faculty account suspended. All scanning rejected.

### Completion Condition
Faculty finishes their shift. All students they supervised have recorded entry and exit.

---

## Admin Journey

### Goal
Manage the system, its users, and ensure data integrity.

### Starting Condition
Admin is authenticated.

### Journey Steps

1. **Manage users.**
   - View list of students and faculty.
   - Create new student or faculty accounts.
   - Suspend, reinstate, or depart/deactivate accounts.
   - Search for specific users.

2. **Manage categories.**
   - View list of active categories.
   - Create new category.
   - Rename existing category.
   - Archive category (no longer available for selection).

3. **Override a session.**
   - Student has an incomplete session requiring correction.
   - Admin reviews the session details.
   - Admin performs override with documented reason.
   - Session moves to Completed with Completion Reason ADMIN_OVERRIDE.

4. **Archive completed sessions.**
   - Admin reviews completed sessions.
   - Admin archives selected sessions.
   - Sessions move to Archived status.

5. **Configure workspace.**
   - Update workspace settings (name, hours, grace period duration).
   - Changes take effect for future sessions.

6. **Review analytics.**
   - View global usage statistics.
   - View attendance trends.
   - View activity log for audit.

### Alternative Paths

**Path A: Batch operations.**
- Admin may create multiple student accounts at once.
- Admin may archive multiple sessions at once.

### Failure Paths

- **Cannot delete:** No operation in the system allows permanent deletion of business data.
- **Active sessions:** Admin cannot depart a student who has an incomplete session without being warned.

### Completion Condition
Admin completes their management tasks. System state is correct.

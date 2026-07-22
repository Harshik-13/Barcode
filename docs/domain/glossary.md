# Domain Glossary

## Terms

### Active Session
A WorkspaceSession that has had a Category selected (status: Active). The Student is currently present in the workspace.

### Activity Log
An immutable chronological record of significant business events. Used for audit and investigation.

### Admin
A person responsible for managing the system — users, categories, and workspace configuration. Can perform administrative overrides on sessions. Cannot record attendance.

### Admin Override
An action by an Admin to explicitly complete or correct a session. Produces Completion Reason ADMIN_OVERRIDE.

### Archived Session
A WorkspaceSession that has been moved to Archived status. Removed from active views but preserved as an immutable historical record.

### Attendance
The act of being present in the workspace during a recorded session. Attendance is valid regardless of whether a work summary is submitted.

### Auto-Completed Session
A session that reached Completed status because the summary grace period expired. Produces Completion Reason AUTO_COMPLETED.

### Awaiting Summary
The status of a WorkspaceSession after exit has been recorded but before a work summary is submitted (or the grace period expires).

### Category
A type of work that a Student may select for a session. Examples: Coding, Design, Research. Created and managed by Admin.

### Completed Session
A WorkspaceSession that has reached its final active state. Has a Completion Reason. May be Archived later.

### Completion Reason
An attribute of a Completed session explaining how it reached completion. Allowed values: NORMAL, AUTO_COMPLETED, MANUAL_EXIT, ADMIN_OVERRIDE.

### Created Session
A WorkspaceSession that has had entry recorded but no Category selected yet (status: Created).

### Departed Student
A Student who has permanently left the workspace program. Cannot start new sessions.

### Entry
The act of recording a Student's arrival at the workspace. Performed by Faculty via scanning. Creates a WorkspaceSession in Created status.

### Exit
The act of recording a Student's departure from the workspace. Performed by Faculty via scanning. Moves the session to Awaiting Summary.

### Faculty
A person authorized to record Student entry and exit by scanning identification. May perform manual exit as an exceptional action. Cannot manage system configuration.

### Grace Period
A configurable period after exit during which the Student may submit a work summary. After expiry, the session is auto-completed.

### Identifier
A unique code assigned to each Student, used for identification during scanning.

### Manual Exit
An exceptional action by Faculty to record exit when normal scanning is not possible. Requires a documented business reason. Produces Completion Reason MANUAL_EXIT.

### Normal Session
A session that followed the standard workflow: entry → category → exit → summary submitted. Produces Completion Reason NORMAL.

### Notification
A message sent to a Student about a session event. Types: entry, exit, reminder.

### Session (see WorkspaceSession)

### Student
A person enrolled in the workspace program who attends the workspace and performs work. Cannot record attendance.

### Suspended Student
A Student who is temporarily unable to start new sessions. Existing incomplete sessions are unaffected.

### Summary (see Work Summary)

### Work Summary
A brief text description of work performed during a session, submitted by the Student after exit. Optional — attendance is valid without it.

### Workspace
The physical location where students attend to perform work. Managed and configured by Admin.

### WorkspaceSession
The primary business entity. Represents a single period of attendance from entry onward. Tracks timing, category, work summary, and completion reason. Status flow: Created → Active → Awaiting Summary → Completed → Archived.

---

## Term Usage Rules

1. **Always use "WorkspaceSession" or "Session"** — never "attendance record", "shift", "visit", or "check-in".
2. **Always use "Faculty"** — never "warden", "guard", "security", or "staff" in domain documentation.
3. **Always use "Student"** — never "user", "member", or "participant".
4. **Always use "Category"** — never "work type", "task type", "activity", or "project type".
5. **Always use "Entry" and "Exit"** — never "check-in/check-out", "arrival/departure", or "sign-in/sign-out".
6. **Always use "Work Summary"** — never "report", "log", "notes", or "description".
7. **Always use "Notification"** — never "alert", "message", or "announcement".
8. **Always use the official state names:** Created, Active, Awaiting Summary, Completed, Archived.
9. **Always use the official Completion Reason values:** NORMAL, AUTO_COMPLETED, MANUAL_EXIT, ADMIN_OVERRIDE.

---

## Abbreviations and Aliases

| Abbreviation | Full Term | Usage |
|-------------|-----------|-------|
| Session | WorkspaceSession | Acceptable in internal documentation |
| Summary | Work Summary | Acceptable in internal documentation |

---

## Terms from Other Domains (Not Used)

| Term | Domain | Why Not Used Here |
|------|--------|-------------------|
| Meal | Food service | Not applicable |
| Hostel | Residential | Not applicable |
| Warden | Residential security | Replaced by Faculty |
| Check-in/Check-out | Hospitality | Replaced by Entry/Exit |
| Shift | Labor scheduling | Sessions are not shifts |
| Timesheet | Payroll | Not a payroll system |
| Course | Education | Not an academic system |
| Class | Education | Not an academic system |

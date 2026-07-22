# Domain Definition

## Purpose

The 8Hour Workspace Attendance System records when students enter and exit a startup workspace, tracks what work category they engage in during each session, and collects a brief summary of work done upon exit.

The system enables faculty to verify attendance, administrators to monitor workspace usage, and students to maintain a personal record of their work activity.

---

## Scope — What Is Included

### Attendance Recording
- Faculty can record when a student enters the workspace (normal entry)
- Faculty can record when a student leaves the workspace (normal exit)
- Faculty may perform manual exit as an exceptional action when normal scanning is not possible
- Each entry-exit pair forms a single workspace session

### Work Tracking
- Students select a work category for each session after entry — category is mandatory for completion
- Students submit a brief work summary after exit (optional — attendance is valid without it)
- Sessions are auto-completed after a grace period if no summary is submitted
- Categories represent types of work (e.g., coding, design, research)

### Notifications
- Students receive notification on entry
- Students receive notification on exit
- Students may receive reminders about category selection and summary submission

### Reporting
- Faculty can view attendance data and analytics
- Administrators can view global usage statistics
- Students can view their own attendance history
- Reports distinguish between normal exit, manual exit, auto-completed, and admin override

### Session Lifecycle Management
- Sessions follow a formal lifecycle: Created → Active → Awaiting Summary → Completed → Archived
- Every completed session carries a Completion Reason (NORMAL, AUTO_COMPLETED, MANUAL_EXIT, ADMIN_OVERRIDE)
- Admin may override or correct sessions
- Admin may archive completed sessions

### Role Management
- Three distinct roles: Student, Faculty, Admin
- Each role has different responsibilities and capabilities

---

## Scope — What Is Intentionally Excluded

- **Billing or payments.** No financial transactions occur in this system.
- **Scheduling or reservations.** Students do not book time slots in advance.
- **Real-time location tracking.** The system does not track student location beyond workspace entry and exit.
- **Performance evaluation.** The system records work summaries but does not evaluate or score them.
- **Communication platform.** Notifications are one-way (system to student). There is no messaging between users.
- **External identity provider management.** Authentication is handled by an external system (Google OAuth), but identity management is outside the domain.
- **File storage or attachments.** Work summaries are text-only. No file uploads.
- **Course or curriculum management.** The system is independent of academic programs.

---

## Primary Business Object

WorkspaceSession — a single period of attendance, recording entry time, exit time, work category, work summary, and completion reason.

Every business workflow centers around the creation, activation, and completion of workspace sessions. Sessions follow a formal lifecycle: Created → Active → Awaiting Summary → Completed → Archived.

---

## Supporting Business Objects

- Student — the person attending the workspace
- Faculty — the person recording attendance
- Admin — the person managing the system
- Category — the type of work a student chooses for a session
- Notification — a message sent to a student about a session event
- ActivityLog — a record of significant business events for audit purposes

---

## External Systems

| System | Relationship | Data Shared |
|--------|-------------|-------------|
| Google OAuth | Verifies identity, provides email | Email address, display name |
| Notification Service | Delivers notifications to students | Notification text, student contact |

The identity provider is outside the domain. The system receives verified identity data (email, name) but does not manage authentication itself.

The notification delivery mechanism is outside the domain. The system creates notifications as business objects; delivery is an external concern.

---

## Domain Boundaries Summary

```
Inside the domain:
  Student, Faculty, Admin as actors
  WorkspaceSession as the primary entity
  Category for work classification (mandatory for completion)
  Notification for student communication
  ActivityLog for audit trail
  Completion Reason (NORMAL, AUTO_COMPLETED, MANUAL_EXIT, ADMIN_OVERRIDE)
  Session lifecycle: Created → Active → Awaiting Summary → Completed → Archived
  Manual exit as exceptional Faculty action
  Session override as Admin action
  Auto-completion via summary grace period

Outside the domain:
  Identity and authentication
  Notification delivery (SMTP, push, SMS)
  User interface
  Data persistence
  Payment or billing
  Scheduling or reservations
  Academic course management
```

# Screen Inventory

Total screens: **28**

---

## Application Type

This application is a **Progressive Web App (PWA).** All screens are part of a single React-based PWA accessible by all roles. Role-based routing determines which screens are available per user.

---

## Authentication (2 screens)

### S1: Login
- **Purpose:** Authenticate users and route them to their role-specific portal
- **Primary actions:** Enter email, enter password, submit login
- **Displayed information:** Application name, role hint (student/faculty/admin)
- **Navigation:** → Student Dashboard / Faculty Dashboard / Admin Dashboard
- **Phase 3 workflow:** W1: Authentication
- **Phase 4 endpoint:** POST /auth/login

### S2: Session Expired
- **Purpose:** Notify user their session has expired and prompt re-login
- **Primary actions:** Re-login
- **Displayed information:** Session expired message
- **Navigation:** → Login

---

## Student (7 screens)

### S3: Student Dashboard
- **Purpose:** Primary landing screen showing session status, notifications, and quick actions
- **Primary actions:** View active session, select category, submit summary, view notifications
- **Displayed information:** Active session card (if any), unread notifications, recent sessions summary, profile link
- **Navigation:** → Session History, Notification Detail, Profile, Category Selection, Summary Submission
- **Phase 3 workflows:** W2, W3, W4, W6
- **Phase 4 endpoints:** GET /sessions/student/:studentId/active, GET /notifications, GET /notifications/unread-count, GET /sessions

### S4: Category Selection
- **Purpose:** Select a work category for an active session
- **Primary actions:** Browse categories, select a category, confirm selection
- **Displayed information:** List of active categories with names and descriptions
- **Navigation:** → Student Dashboard (with updated session status)
- **Phase 3 workflow:** W3: Category Selection
- **Phase 4 endpoint:** GET /categories, POST /sessions/entry → PATCH /sessions (via category assignment)

### S5: Summary Submission
- **Purpose:** Submit a work summary after session exit
- **Primary actions:** Write summary text, submit, skip (triggers auto-complete)
- **Displayed information:** Exit time, session duration so far, category name, text area for summary
- **Navigation:** → Student Dashboard (with completed status)
- **Phase 3 workflow:** W6: Summary Submission
- **Phase 4 endpoint:** POST /sessions/:id/summary

### S6: Session History
- **Purpose:** View past sessions with filtering
- **Primary actions:** Filter by date range, status, category; tap session to see details
- **Displayed information:** List of sessions with date, entry/exit times, category, status, duration
- **Navigation:** → Session Detail
- **Phase 3 workflow:** W11: Reporting (student self-reporting)
- **Phase 4 endpoint:** GET /sessions (scoped to student)

### S7: Session Detail
- **Purpose:** View full details of a single session
- **Primary actions:** View summary, view timeline
- **Displayed information:** Entry/exit times, recorder names, category, status, completion reason, summary text, duration
- **Navigation:** → Session History
- **Phase 3 workflows:** All
- **Phase 4 endpoint:** GET /sessions/:id

### S8: Notification List
- **Purpose:** View all notifications
- **Primary actions:** Read notification, mark as read, mark all as read
- **Displayed information:** List of notifications with type icon, message, timestamp, read status
- **Navigation:** → Session Detail (via notification link)
- **Phase 3 workflow:** W8: Notification Delivery
- **Phase 4 endpoints:** GET /notifications, PATCH /notifications/:id/read, POST /notifications/read-all

### S9: Profile
- **Purpose:** View and edit personal details
- **Primary actions:** Update name, update email
- **Displayed information:** Name, email, roll number (read-only), enrollment date, total sessions count
- **Navigation:** → Student Dashboard
- **Phase 3 workflow:** W12: Administration (self-service)
- **Phase 4 endpoint:** GET /students/:id, PATCH /students/:id

---

## Faculty (5 screens)

### S10: Faculty Dashboard
- **Purpose:** Primary landing screen showing workspace status and quick actions
- **Primary actions:** View occupancy, access scanner, view recent scans
- **Displayed information:** Occupancy count, occupancy by category, recent scans list, quick action buttons
- **Navigation:** → Scanner, Student Search, Reports
- **Phase 3 workflows:** W2, W4, W5, W11
- **Phase 4 endpoint:** GET /sessions/occupancy, GET /sessions

### S11: Scanner
- **Purpose:** Scan student identification for entry and exit
- **Primary actions:** Toggle entry/exit mode, toggle scan format (QR Code / 1D Barcode), scan identification, view scan result, initiate manual exit
- **Displayed information:** Camera viewfinder, entry/exit mode indicator, scan format indicator (QR/Barcode), last scan result, student info on successful scan
- **Navigation:** → Faculty Dashboard, Scan Result, Manual Exit
- **Phase 3 workflows:** W2: Entry Scan, W4: Exit Scan
- **Phase 4 endpoints:** POST /sessions/entry, POST /sessions/exit
- **Scan formats:** QR Code and 1D Barcode. Format is user-selectable via toggle. Format selection is independent of the entry/exit mode. The decoded value is treated identically regardless of scan format. Extensible for future formats (Data Matrix, PDF417, Aztec) without business logic changes.

### S12: Scan Result
- **Purpose:** Show result of a scan attempt
- **Primary actions:** Dismiss, perform next scan
- **Displayed information:** Student name, roll number, action (entry/exit), timestamp, success/error status, error reason if failed
- **Navigation:** → Scanner (continue scanning), Faculty Dashboard
- **Phase 3 workflows:** W2, W4
- **Phase 4 endpoints:** Response from POST /sessions/entry or POST /sessions/exit

### S13: Manual Exit
- **Purpose:** Manually exit a student when normal scanning is not possible
- **Primary actions:** Search student, provide reason, confirm manual exit
- **Displayed information:** Student search field, student info, reason input, category selection
- **Navigation:** → Scanner, Faculty Dashboard
- **Phase 3 workflow:** W5: Manual Exit
- **Phase 4 endpoint:** POST /sessions/:id/manual-exit

### S14: Student Search & Detail
- **Purpose:** Find and view student details
- **Primary actions:** Search by name or roll, view student info, view session history
- **Displayed information:** Search results, student details (name, roll, status), recent sessions
- **Navigation:** → Faculty Dashboard, Session List
- **Phase 3 workflows:** W2, W4, W11
- **Phase 4 endpoints:** GET /students, GET /students/:id, GET /sessions?studentId=X

### S15: Reports (Faculty)
- **Purpose:** View attendance reports and analytics
- **Primary actions:** Select report type (daily, student, category), set date range, view results
- **Displayed information:** Daily summary with totals and category breakdown, student report, category report
- **Navigation:** → Faculty Dashboard
- **Phase 3 workflow:** W11: Reporting
- **Phase 4 endpoints:** GET /reports/daily-summary, GET /reports/student/:studentId, GET /reports/category/:categoryId

---

## Admin (9 screens)

### S16: Admin Dashboard
- **Purpose:** Primary landing screen with global metrics and quick links
- **Primary actions:** View metrics, access management sections, view flagged sessions
- **Displayed information:** Total students/faculty, today's attendance, occupancy, flagged sessions (incomplete, no category), recent activity log
- **Navigation:** → All management sections
- **Phase 3 workflows:** W9, W10, W11, W12
- **Phase 4 endpoints:** GET /sessions/occupancy, GET /sessions (filtered), GET /activity-logs

### S17: Student Management
- **Purpose:** Full CRUD for student accounts
- **Primary actions:** Create student, search/filter list, view details, edit, suspend, depart
- **Displayed information:** Paginated student list with name, roll, email, status, created date; search and filter controls
- **Navigation:** → Student Detail, Admin Dashboard
- **Phase 3 workflow:** W12: Administration
- **Phase 4 endpoints:** GET /students, POST /students, PATCH /students/:id, PATCH /students/:id/status

### S18: Faculty Management
- **Purpose:** Full CRUD for faculty accounts
- **Primary actions:** Create faculty, search/filter list, view details, edit, suspend, deactivate
- **Displayed information:** Paginated faculty list with name, email, status, created date
- **Navigation:** → Faculty Detail, Admin Dashboard
- **Phase 3 workflow:** W12: Administration
- **Phase 4 endpoints:** GET /faculty, POST /faculty, PATCH /faculty/:id, PATCH /faculty/:id/status

### S19: Admin Management
- **Purpose:** Full CRUD for admin accounts
- **Primary actions:** Create admin, view list, edit, deactivate
- **Displayed information:** Paginated admin list with name, email, status, created date
- **Navigation:** → Admin Detail, Admin Dashboard
- **Phase 3 workflow:** W12: Administration
- **Phase 4 endpoints:** GET /admins, POST /admins, PATCH /admins/:id, PATCH /admins/:id/status

### S20: Category Management
- **Purpose:** Manage work categories
- **Primary actions:** Create category, edit, archive, view usage stats
- **Displayed information:** Category list with name, description, status, session count
- **Navigation:** → Admin Dashboard
- **Phase 3 workflow:** W12: Administration
- **Phase 4 endpoints:** GET /categories, POST /categories, PATCH /categories/:id, PATCH /categories/:id/archive

### S21: Session Management
- **Purpose:** View and manage all sessions
- **Primary actions:** Search/filter sessions, view details, override session
- **Displayed information:** Paginated session list with student info, times, status, category
- **Navigation:** → Session Detail (with override), Admin Dashboard
- **Phase 3 workflows:** W9: Session Override, W10: Session Archival
- **Phase 4 endpoints:** GET /sessions, POST /sessions/:id/override

### S22: Session Detail (Admin)
- **Purpose:** View full session details with admin actions
- **Primary actions:** View session info, override session, view audit trail
- **Displayed information:** Student info, entry/exit times, recorders, category, status, summary, completion reason, override button, activity log entries
- **Navigation:** → Session Management, Admin Dashboard
- **Phase 3 workflow:** W9: Session Override
- **Phase 4 endpoints:** GET /sessions/:id, POST /sessions/:id/override

### S23: Activity Log
- **Purpose:** View audit trail of all system actions
- **Primary actions:** Filter by actor type, action, entity, date range
- **Displayed information:** Paginated log entries with timestamp, actor, action, entity, details
- **Navigation:** → Related entity detail (via links)
- **Phase 3 workflow:** W12: Administration (audit)
- **Phase 4 endpoint:** GET /activity-logs

### S24: Reports (Admin)
- **Purpose:** View comprehensive reports
- **Primary actions:** Select report type, set date range, view results, export (future)
- **Displayed information:** Daily summary, student report, category report with metrics and breakdowns
- **Navigation:** → Admin Dashboard
- **Phase 3 workflow:** W11: Reporting
- **Phase 4 endpoints:** GET /reports/daily-summary, GET /reports/student/:studentId, GET /reports/category/:categoryId

---

## System / Shared (4 screens)

### S25: Loading
- **Purpose:** Display while content is being fetched
- **Primary actions:** None (automatic)
- **Displayed information:** Loading spinner or skeleton
- **Navigation:** → Target screen (after load)

### S26: Offline
- **Purpose:** Notify user of network connectivity loss
- **Primary actions:** Retry connection
- **Displayed information:** Offline message, retry button
- **Navigation:** → Previous screen (if cached content available)

### S27: Install App
- **Purpose:** Prompt users to install the PWA on their device
- **Primary actions:** Install, dismiss, remind later
- **Displayed information:** Install banner with app name and icon; full-screen install prompt on first visit
- **Navigation:** → Current screen (dismiss), system install dialog (install)
- **Trigger:** Fires when the browser supports the PWA `beforeinstallprompt` event. Shown once per session. Also accessible via "Install App" in navigation menu.
- **Platforms:** Supported on Chrome (desktop and Android), Edge, Samsung Internet

### S28: Page Not Found (404)
- **Purpose:** Handle invalid routes
- **Primary actions:** Navigate to Dashboard
- **Displayed information:** 404 message, link to Dashboard
- **Navigation:** → Role-appropriate Dashboard

---

## Screen Count by Role

| Role | Screens |
|------|---------|
| Authentication | 2 |
| Student | 7 |
| Faculty | 6 |
| Admin | 9 |
| System / Shared | 4 |
| **Total** | **28** |

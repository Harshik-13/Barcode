# Actors

## 1. Student

### Purpose
Attend the workspace, perform work, and maintain a personal record of attendance and work activity.

### Responsibilities
- Be present in the workspace during a session
- Select a work category for each session after entry
- Submit a work summary after exit
- View personal attendance history and statistics
- Receive and read notifications

### Capabilities
- Choose a work category from the available list
- Write and submit a work summary
- View own session history
- View own streaks and statistics
- View own notifications

### Restrictions
- Cannot record entry or exit (including own)
- Cannot access other students' data
- Cannot view reports or analytics beyond personal data
- Cannot modify or delete completed sessions
- Cannot submit a summary without exit recorded
- Cannot select a category without a session in Created status

### Relationships
- Has many WorkspaceSessions
- Receives many Notifications
- Selects one Category per session

---

## 2. Faculty

### Purpose
Record student attendance by scanning identification, verify student presence, and monitor workspace activity.

### Responsibilities
- Scan student identification to record entry
- Scan student identification to record exit
- Perform manual exit as an exceptional action when normal scanning is not possible
- Verify that the scanned identity matches an enrolled student
- View live occupancy of the workspace
- Search for students
- View attendance reports and analytics

### Capabilities
- Initiate a WorkspaceSession (entry)
- Record normal exit
- Perform manual exit (with a documented business reason)
- View all incomplete sessions
- Search any student by identifier
- View reports and analytics
- View student session history

### Restrictions
- Cannot modify sessions after they are completed
- Cannot delete session records
- Cannot submit work summaries on behalf of students
- Cannot select work categories on behalf of students
- Cannot access system administration
- Cannot modify own faculty profile beyond basic information

### Relationships
- Records many WorkspaceSessions (entry, normal exit, manual exit)
- Interacts with Students through scanning

---

## 3. Admin

### Purpose
Manage the system, its users, and its configuration.

### Responsibilities
- Manage user accounts (create, suspend, remove)
- Manage faculty accounts
- Manage work categories (create, rename, archive)
- Override or correct sessions as needed
- Archive completed sessions
- Configure workspace settings (name, hours, rules)
- View global analytics and usage statistics
- Oversee system operations

### Capabilities
- Create, suspend, and remove Student accounts
- Create, suspend, and remove Faculty accounts
- Create, rename, and archive Categories
- Override sessions (complete or correct any session)
- Archive completed sessions
- Change workspace configuration
- View all data across the system
- View activity log
- Export reports

### Restrictions
- Cannot record normal attendance (entry/exit)
- Cannot submit work summaries
- Cannot select work categories on behalf of others

### Relationships
- Manages Students
- Manages Faculty
- Manages Categories
- Overrides sessions
- Archives sessions
- Manages workspace configuration
- Views system-wide data

---

## 4. System

### Purpose
Enforce business rules, generate notifications, and maintain audit records.

### Responsibilities
- Enforce that a student has only one incomplete session at a time
- Auto-complete sessions after the summary grace period expires
- Generate notifications on entry, exit, and reminders
- Record all state-changing events in the activity log
- Validate that business rules are followed before allowing state changes
- Prevent invalid lifecycle transitions

### Capabilities
- Create Notification objects
- Create ActivityLog entries
- Auto-complete sessions (AUTO_COMPLETED)
- Reject invalid lifecycle transitions
- Enforce business constraints

### Restrictions
- Cannot initiate a WorkspaceSession (that requires a Faculty actor)
- Cannot select categories or submit summaries
- Cannot modify user data

### Relationships
- Generates Notifications for Students
- Records ActivityLog entries for all actions
- Enforces rules on WorkspaceSessions

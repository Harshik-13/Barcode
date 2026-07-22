# Business Entities

## 1. Student

### Purpose
Represents a person enrolled in the workspace program who attends the workspace and performs work.

### Business Attributes
- Identifier (a unique code assigned by the institution)
- Full name
- Contact email

### Responsibilities
- Own workspace sessions
- Select work categories
- Submit work summaries
- Receive notifications

### Lifecycle
```
Enrolled → Active → Suspended → (return to Active) → Graduated/Departed
```

A Student exists from the moment they are enrolled in the workspace program. They may become suspended (temporarily unable to start sessions) and reinstated.

---

## 2. Faculty

### Purpose
Represents a staff member authorized to record student attendance at the workspace.

### Business Attributes
- Full name
- Contact email

### Responsibilities
- Record student entry
- Record student exit
- Perform manual exit as an exceptional action
- Verify student identity

### Lifecycle
```
Active → Suspended → (return to Active) → Deactivated
```

---

## 3. Admin

### Purpose
Represents a system administrator responsible for managing users, categories, and workspace configuration, and for performing administrative overrides on sessions.

### Business Attributes
- Full name
- Contact email

### Responsibilities
- Manage student and faculty accounts
- Manage work categories
- Manage workspace settings
- View system-wide data
- Override or correct sessions as needed

### Lifecycle
```
Active → Deactivated
```

---

## 4. WorkspaceSession

### Purpose
The primary business entity. Represents a single period of attendance from the moment a student enters the workspace until they exit. Includes work category, work summary, and completion reason.

### Business Attributes
- Entry time (when the student entered)
- Exit time (when the student left, may be absent until session completes)
- Work category (the type of work, selected after entry, mandatory before completion)
- Work summary (a brief description of work done, submitted after exit, optional)
- Completion reason (how the session reached completion: NORMAL, AUTO_COMPLETED, MANUAL_EXIT, ADMIN_OVERRIDE)
- Status (Created, Active, Awaiting Summary, Completed, Archived)

### Responsibilities
- Record when a student attended
- Link a student to the work they performed
- Track the duration of attendance
- Hold the work summary
- Record how the session reached completion

### Lifecycle
```
Created → Active → Awaiting Summary → Completed → Archived
```

See `lifecycles.md` for details.

---

## 5. Category

### Purpose
Represents a type of work that a student can select for a session.

### Examples
- Coding
- Design
- Research
- Writing
- Planning
- Review

### Business Attributes
- Name
- Description (optional)

### Responsibilities
- Classify the type of work in a session
- Enable reporting and analytics by work type

### Lifecycle
```
Active → Archived
```

Categories are created by an Admin and can be archived (no longer available for selection) but never deleted.

---

## 6. Notification

### Purpose
Represents a message sent to a student about a workspace session event.

### Business Attributes
- Type (entry, exit, reminder)
- Message text
- Whether it has been read

### Responsibilities
- Inform students about session events
- Remind students about pending actions

### Lifecycle
```
Created → Read
```

---

## 7. ActivityLog

### Purpose
Represents an auditable record of a significant business event.

### Business Attributes
- Action performed
- Who performed it
- When it happened
- What entity was affected
- Details of what changed

### Responsibilities
- Provide an immutable audit trail
- Enable investigation of past events

### Lifecycle
```
Created (immutable, never modified)
```

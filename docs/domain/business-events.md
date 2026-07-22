# Business Events

## Event Definitions

Every major business action produces an event. Events are named using past-tense verbs.

---

### 1. StudentEntered

**Description:** A Faculty member recorded entry for a Student, creating a new Created WorkspaceSession.

**Trigger:** Successful entry scan by Faculty.

**Produces:**
- Notification: "entry" type created for the Student

---

### 2. CategorySelected

**Description:** A Student selected a work Category for their session.

**Trigger:** Student chooses a Category while session is in Created status.

**Effect:** Session transitions from Created to Active.

---

### 3. StudentExited

**Description:** A Faculty member recorded exit for a Student, moving the session to Awaiting Summary.

**Trigger:** Successful exit scan by Faculty.

**Produces:**
- Notification: "exit" type created for the Student

---

### 4. ManualExitRecorded

**Description:** A Faculty member performed a manual exit due to an exceptional situation.

**Trigger:** Faculty performs manual exit with a business reason.

**Effect:** Session transitions to Completed with Completion Reason MANUAL_EXIT.

**Produces:**
- ActivityLog entry recording the manual exit with Faculty identity and reason

---

### 5. SummarySubmitted

**Description:** A Student submitted a work summary for their session.

**Trigger:** Student writes and submits a summary while session is in Awaiting Summary status.

**Effect:** Session transitions to Completed with Completion Reason NORMAL.

---

### 6. SessionAutoCompleted

**Description:** A session was automatically Completed because the summary grace period expired.

**Trigger:** System timer detects grace period expiry without summary submission.

**Effect:** Session transitions to Completed with Completion Reason AUTO_COMPLETED.

---

### 7. SessionOverridden

**Description:** An Admin explicitly completed or corrected a session.

**Trigger:** Admin performs an override action.

**Effect:** Session transitions to Completed with Completion Reason ADMIN_OVERRIDE.

**Produces:**
- ActivityLog entry recording the override with Admin identity and reason

---

### 8. SessionArchived

**Description:** A Completed session was archived by an Admin.

**Trigger:** Admin archives a session.

**Effect:** Session transitions to Archived status.

---

### 9. NotificationSent

**Description:** A Notification was created.

**Trigger:** Session entry, exit, or reminder condition.

---

### 10. NotificationRead

**Description:** A Student marked a Notification as read.

**Trigger:** Student acknowledges the notification.

---

### 11. ReminderTriggered

**Description:** A session has been in Created or Awaiting Summary status too long, triggering a reminder.

**Trigger:** System timer or threshold check.

**Produces:**
- Notification: "reminder" type created for the Student

---

### 12. StudentSuspended / StudentReinstated / StudentDeparted

**Description:** Admin actions that change Student lifecycle state.

---

### 13. FacultySuspended / FacultyDeactivated

**Description:** Admin actions that change Faculty lifecycle state.

---

### 14. CategoryCreated / CategoryArchived / CategoryRenamed

**Description:** Admin actions that manage Categories.

---

## Event Summary Table

| Event | Producer | Consumer | Creates Notification |
|-------|----------|----------|---------------------|
| StudentEntered | Faculty | System, Student | ✅ Entry |
| CategorySelected | Student | System | ❌ |
| StudentExited | Faculty | System, Student | ✅ Exit |
| ManualExitRecorded | Faculty | System, ActivityLog | Optional |
| SummarySubmitted | Student | System | ❌ |
| SessionAutoCompleted | System | — | ❌ |
| SessionOverridden | Admin | System, ActivityLog | ❌ |
| SessionArchived | Admin | — | ❌ |
| NotificationSent | System | Notification delivery | ❌ |
| NotificationRead | Student | System | ❌ |
| ReminderTriggered | System | Student | ✅ Reminder |
| StudentSuspended | Admin | Student | ❌ |
| StudentReinstated | Admin | Student | ❌ |
| StudentDeparted | Admin | — | ❌ |
| FacultySuspended | Admin | Faculty | ❌ |
| FacultyDeactivated | Admin | — | ❌ |
| CategoryCreated | Admin | — | ❌ |
| CategoryArchived | Admin | — | ❌ |
| CategoryRenamed | Admin | — | ❌ |

---

## Event-Notification Mapping

| Business Event | Notification Type | Recipient |
|----------------|-------------------|-----------|
| StudentEntered | entry | Student |
| StudentExited | exit | Student |
| ReminderTriggered | reminder | Student |

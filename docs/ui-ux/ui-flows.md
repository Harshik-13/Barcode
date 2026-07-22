# User Flows

---

## F1: Login Flow

```
Start: Login Screen (S1)
  │
  ├─ [user enters email + password]
  │   │
  │   ├─ [valid credentials]
  │   │   └─ [determine role]
  │   │       ├─ Student → Student Dashboard (S3)
  │   │       ├─ Faculty → Faculty Dashboard (S10)
  │   │       └─ Admin   → Admin Dashboard (S16)
  │   │
  │   └─ [invalid credentials]
  │       └─ Show error: "Invalid email or password"
  │          └─ [user corrects] → retry
  │
  ├─ [session expired]
  │   └─ Show Session Expired (S2) → Login Screen
  │
  └─ [network error]
      └─ Show Offline (S26) → [retry] → Login Screen
```

**Failure paths:**
- Invalid credentials → inline error on form, fields preserved
- Network failure → offline screen with retry
- Account deactivated → "Your account is not active" error

---

## F2: Entry Scan Flow

```
Start: Faculty Dashboard (S10)
  │
  ├─ [tap "Scan Entry"]
  │   └─ → Scanner (S11) in Entry mode
  │       │
  │       ├─ [select scan format] — QR Code or Barcode
  │       │   └─ Toggle persists for subsequent scans
  │       │
  │       ├─ [scan student ID]
  │       │   │
  │       │   ├─ [success]
  │       │   │   └─ → Scan Result (S12) - green: "Entry recorded"
  │       │   │       └─ [dismiss] → Scanner (ready for next scan)
  │       │   │
  │       │   └─ [failure]
  │       │       └─ → Scan Result (S12) - red with reason:
  │       │           ├─ "Student already has active session"
  │       │           ├─ "Student is suspended"
  │       │           ├─ "Student departed"
  │       │           └─ "Invalid ID"
  │       │               └─ [dismiss] → Scanner
  │       │
  │       └─ [manual entry fallback]
  │           └─ → Student Search & Detail (S14)
  │               └─ [select student] → confirms entry → Scan Result
  │
  └─ [back] → Faculty Dashboard
```

**Decision points:**
- If student has active session → reject with "already inside"
- If student is suspended/departed → reject with appropriate message
- If camera is unavailable → offer manual student search
- Scan format (QR/Barcode) is independent of scan mode (entry/exit) — changing one does not affect the other

---

## F3: Category Selection Flow

```
Start: Student Dashboard (S3)
  │
  ├─ [session in CREATED status]
  │   │
  │   ├─ [tap "Select Category"]
  │   │   └─ → Category Selection (S4)
  │   │       │
  │   │       ├─ [browse categories]
  │   │       │   └─ [select category]
  │   │       │       └─ Confirmation dialog:
  │   │       │           ├─ [confirm] → session becomes ACTIVE
  │   │       │           │              → Student Dashboard (updated)
  │   │       │           └─ [cancel]   → Category Selection
  │   │       │
  │   │       └─ [no categories available]
  │   │           └─ Show Empty State (E1) → [back] → Dashboard
  │   │
  │   └─ [session already has category / ACTIVE]
  │       └─ Show active session info on Dashboard
  │
  └─ [session not in CREATED]
      └─ Category Selection not accessible
```

**Failure paths:**
- Category list fails to load → loading error state → retry
- Category was archived between load and selection → error → refresh list
- Session status changed (e.g., exit occurred) → error → refresh dashboard

---

## F4: Exit Scan Flow

```
Start: Faculty Dashboard (S10)
  │
  ├─ [tap "Scan Exit"]
  │   └─ → Scanner (S11) in Exit mode
  │       │
  │       ├─ [select scan format] — QR Code or Barcode
  │       │   └─ Toggle persists for subsequent scans
  │       │
  │       ├─ [scan student ID]
  │       │   │
  │       │   ├─ [success]
  │       │   │   └─ → Scan Result (S12) - green: "Exit recorded"
  │       │   │       └─ [dismiss] → Scanner (ready for next scan)
  │       │   │
  │       │   └─ [failure]
  │       │       └─ → Scan Result (S12) - red with reason:
  │       │           ├─ "No active session for this student"
  │       │           └─ "Exit already recorded"
  │       │               └─ [dismiss] → Scanner
  │       │
  │       └─ [manual exit fallback]
  │           └─ → Manual Exit (S13)
  │               ├─ [search student] → [select]
  │               ├─ [enter reason]
  │               └─ [confirm] → Manual Exit → Session Completed
  │                             → Faculty Dashboard
  │
  └─ [back] → Faculty Dashboard
```

**Decision points:**
- If student has no incomplete session → reject with "no active session"
- If exit already recorded → reject with "exit already recorded"
- If camera is unavailable → offer manual exit flow
- Scan format (QR/Barcode) is independent of scan mode (entry/exit) — changing one does not affect the other

---

## F5: Summary Submission Flow

```
Start: Student Dashboard (S3)
  │
  ├─ [session in AWAITING_SUMMARY status]
  │   │
  │   ├─ [tap "Submit Summary"]
  │   │   └─ → Summary Submission (S5)
  │   │       │
  │   │       ├─ [write summary]
  │   │       │   └─ [submit]
  │   │       │       ├─ [valid] → Session Completed
  │   │       │       │           → Student Dashboard (updated)
  │   │       │       └─ [invalid]
  │   │       │           └─ Inline error: "Summary must be 10-2000 characters"
  │   │       │               └─ [edit & resubmit]
  │   │       │
  │   │       ├─ [skip / abandon]
  │   │       │   └─ Reminder: "Summary not submitted. Session will auto-complete in X mins"
  │   │       │       ├─ [go back to write] → Summary Submission
  │   │       │       └─ [dismiss] → Student Dashboard (session remains AWAITING_SUMMARY)
  │   │       │
  │   │       └─ [auto-complete triggered]
  │   │           └─ Student Dashboard shows: "Session auto-completed"
  │   │
  │   └─ [session already COMPLETED]
  │       └─ Summary Submission not accessible
  │
  └─ [no AWAITING_SUMMARY session]
      └─ Summary Submission not accessible
```

**Failure paths:**
- Summary too short → inline character count + min-length error
- Summary too long → inline character count + max-length error
- Network failure on submit → retry dialog, draft preserved
- Session auto-completed during writing → notification → dashboard

---

## F6: Manual Exit Flow

```
Start: Faculty Dashboard (S10) → Scanner (S11)
  │
  └─ [tap "Manual Exit"]
      └─ → Manual Exit (S13)
          │
          ├─ [search student]
          │   ├─ [found]
          │   │   └─ [select] → student info displayed
          │   └─ [not found]
          │       └─ "No student found" → [try again]
          │
          ├─ [verify session]
          │   ├─ [active session exists]
          │   │   └─ Show session info: entry time, duration
          │   └─ [no active session]
          │       └─ Error: "Student has no active session" → [back]
          │
          ├─ [enter reason]
          │   └─ Required field, min 10 chars
          │
          ├─ [select category (if missing)]
          │   └─ Category dropdown (required if session has no category)
          │
          └─ [confirm manual exit]
              ├─ → Success: "Session completed (manual exit)"
              │   → Faculty Dashboard
              └─ → Failure: Error message → [retry]
```

**Failure paths:**
- Student not found → "No student found" message
- No active session → error with suggestion to check student status
- Reason too short → inline validation
- Network failure → retry dialog

---

## F7: Admin Override Flow

```
Start: Admin Dashboard (S16) → Session Management (S21)
  │
  ├─ [search/filter sessions]
  │   └─ [select session]
  │       └─ → Session Detail (S22)
  │           │
  │           ├─ [review session info]
  │           │   └─ [tap "Override Session"]
  │           │       │
  │           │       ├─ → Confirmation dialog:
  │           │       │   - Current session status displayed
  │           │       │   - Target status: COMPLETED
  │           │       │   - Category override (optional)
  │           │       │   - Reason (required, min 10 chars)
  │           │       │   └─ [confirm] → POST /sessions/:id/override
  │           │       │       ├─ [success]
  │           │       │       │   └─ → Session Detail (updated, completion_reason=ADMIN_OVERRIDE)
  │           │       │       └─ [failure]
  │           │       │           └─ Error: "Cannot override a session in {status} status"
  │           │       │               └─ [dismiss] → Session Detail
  │           │       │
  │           │       └─ [cancel] → Session Detail
  │           │
  │           └─ [back] → Session Management
  │
  └─ [back] → Admin Dashboard
```

**Failure paths:**
- Session already completed/archived → cannot override
- Empty/invalid reason → inline validation
- Network failure → retry dialog

---

## F8: Notification Interaction Flow

```
Start: Student Dashboard (S3)
  │
  ├─ [tap notification bell/badge]
  │   └─ → Notification List (S8)
  │       │
  │       ├─ [tap single notification]
  │       │   ├─ → PATCH /notifications/:id/read
  │       │   └─ → If linked to session: Session Detail (S7)
  │       │     └─ If not linked: Notification List (mark as read)
  │       │
  │       ├─ [tap "Mark All Read"]
  │       │   └─ → POST /notifications/read-all
  │       │       └─ → Notification List (all marked read, badge cleared)
  │       │
  │       └─ [back] → Student Dashboard
  │
  ├─ [notification count badge]
  │   └─ Shows unread count on bell icon (updates via GET /notifications/unread-count)
  │
  └─ [no notifications]
      └─ Show Empty State (E2)
```

**Failure paths:**
- Mark read fails → optimistic update, revert on error
- Network failure → stale data shown, refresh on reconnect

---

## F9: Report Viewing Flow

```
Start: Faculty Dashboard (S10) or Admin Dashboard (S16)
  │
  └─ [tap "Reports"]
      └─ → Reports screen (S15 / S24)
          │
          ├─ [select report type]
          │   ├─ Daily Summary
          │   │   └─ [select date] (default: today)
          │   │       └─ → Daily report with totals, category breakdown, average duration
          │   │
          │   ├─ Student Report
          │   │   └─ [search/select student]
          │   │       └─ [select date range]
          │   │           └─ → Student report with total sessions, hours, category breakdown
          │   │
          │   └─ Category Report
          │       └─ [select category]
          │           └─ [select date range]
          │               └─ → Category report with total sessions, hours, unique students
          │
          └─ [back] → Dashboard
```

**Failure paths:**
- No data for selected parameters → empty state with explanation
- Invalid date range → inline validation
- Network failure → error state with retry

---

## F10: Administration Flow

```
Start: Admin Dashboard (S16)
  │
  ├─ [tap "Students"] → Student Management (S17)
  │   └─ [CRUD operations]
  │
  ├─ [tap "Faculty"] → Faculty Management (S18)
  │   └─ [CRUD operations]
  │
  ├─ [tap "Admins"] → Admin Management (S19)
  │   └─ [CRUD operations]
  │
  ├─ [tap "Categories"] → Category Management (S20)
  │   └─ [CRUD operations]
  │
  └─ [tap "Activity Log"] → Activity Log (S23)
      └─ [view / filter audit entries]
```

**Common CRUD pattern:**
```
List → [tap "+"] → Create Form → [submit] → List (new item visible)
List → [tap item] → Detail View → [edit] → Edit Form → [save] → Detail (updated)
List → [tap item] → Detail View → [status action] → Confirmation → List (updated)
List → [tap item] → Detail View → [delete equivalent (archive/suspend/deactivate)] → Confirmation → List (updated)
```

**Failure paths:**
- Duplicate entry (roll/email) → inline error on create form
- Invalid data → field-level validation errors
- Cannot modify because entity is in terminal state → notification

---

## Flow Summary

| Flow | Actor | Starting Screen | Ending Screen | Sessions Created/Modified |
|------|-------|----------------|---------------|--------------------------|
| F1: Login | All | Login (S1) | Dashboard (S3/S10/S16) | None |
| F2: Entry Scan | Faculty | Dashboard (S10) | Scanner (S11) | WorkspaceSession created |
| F3: Category Selection | Student | Dashboard (S3) | Dashboard (S3) | Session status→ACTIVE |
| F4: Exit Scan | Faculty | Dashboard (S10) | Scanner (S11) | Session exit recorded |
| F5: Summary Submission | Student | Dashboard (S3) | Dashboard (S3) | Session status→COMPLETED |
| F6: Manual Exit | Faculty | Dashboard (S10) | Dashboard (S10) | Session status→COMPLETED |
| F7: Admin Override | Admin | Dashboard (S16) | Session Detail (S22) | Session status modified |
| F8: Notification | Student | Dashboard (S3) | Notification List (S8) | Notification is_read updated |
| F9: Reporting | Faculty/Admin | Dashboard (S10/S16) | Reports (S15/S24) | None (read-only) |
| F10: Administration | Admin | Dashboard (S16) | Various | Users/categories modified |

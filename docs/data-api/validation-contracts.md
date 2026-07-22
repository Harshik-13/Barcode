# Validation Contracts

## Field Validation

### Student

| Field | Rules | Error Code |
|-------|-------|-----------|
| roll | Required, 2-50 chars, alphanumeric | INVALID_ROLL |
| name | Required, 2-100 chars | INVALID_NAME |
| email | Optional, valid email format if provided | INVALID_EMAIL |
| status | Must be valid StudentStatus enum value | INVALID_STATUS |

### Faculty

| Field | Rules | Error Code |
|-------|-------|-----------|
| name | Required, 2-100 chars | INVALID_NAME |
| email | Required, valid email format | INVALID_EMAIL |
| password | Required on create, 8-128 chars | INVALID_PASSWORD |
| status | Must be valid FacultyStatus enum value | INVALID_STATUS |

### Admin

| Field | Rules | Error Code |
|-------|-------|-----------|
| name | Required, 2-100 chars | INVALID_NAME |
| email | Required, valid email format | INVALID_EMAIL |
| password | Required on create, 8-128 chars | INVALID_PASSWORD |
| status | Must be valid AdminStatus enum value | INVALID_STATUS |

### WorkspaceSession

| Field | Rules | Error Code |
|-------|-------|-----------|
| studentRoll | Required, must reference existing ENROLLED student | INVALID_STUDENT |
| recorderFacultyId | Required, must reference existing ACTIVE faculty | INVALID_FACULTY |
| categoryId | Must reference existing ACTIVE category when assigned | INVALID_CATEGORY |
| summary | 10-2000 chars when provided | INVALID_SUMMARY |
| manualExitReason | Required if isManualExit=true, 10-500 chars | INVALID_REASON |
| overrideReason | Required for admin overrides, 10-500 chars | INVALID_REASON |

### Category

| Field | Rules | Error Code |
|-------|-------|-----------|
| name | Required, 2-50 chars, unique among active categories | INVALID_NAME |
| description | Optional, max 500 chars | INVALID_DESCRIPTION |

### Notification

| Field | Rules | Error Code |
|-------|-------|-----------|
| type | Must be valid NotificationType enum | INVALID_TYPE |
| message | Required, 1-500 chars | INVALID_MESSAGE |

---

## Business Validation

### BV1: Duplicate Entry Prevention
**Rule:** A student cannot have more than one session in CREATED, ACTIVE, or AWAITING_SUMMARY status at any time.
**Endpoint:** POST /sessions/entry
**Error Code:** STUDENT_ALREADY_IN_SESSION
**Error Message:** "Student already has an active session"

### BV2: Suspended Student Restriction
**Rule:** A student with status SUSPENDED or DEPARTED cannot start a new session.
**Endpoint:** POST /sessions/entry
**Error Code:** STUDENT_SUSPENDED or STUDENT_DEPARTED
**Error Message:** "Suspended/Departed students cannot start sessions"

### BV3: Faculty Active Restriction
**Rule:** Only ACTIVE faculty can record entry or exit.
**Endpoint:** POST /sessions/entry, POST /sessions/exit
**Error Code:** FACULTY_NOT_ACTIVE
**Error Message:** "Only active faculty can record sessions"

### BV4: Session Status Transition
**Rule:** Session status can only move forward: CREATED → ACTIVE → AWAITING_SUMMARY → COMPLETED. No backward transitions.
**Error Code:** INVALID_STATUS_TRANSITION
**Error Message:** "Cannot transition from {currentStatus} to {requestedStatus}"

### BV5: Summary Requires Exit
**Rule:** Summary can only be submitted when session status is AWAITING_SUMMARY.
**Endpoint:** POST /sessions/:id/summary
**Error Code:** INVALID_SESSION_STATUS
**Error Message:** "Summary can only be submitted when session status is AWAITING_SUMMARY"

### BV6: Manual Exit Requires Active Session
**Rule:** A session must be in ACTIVE status for manual exit to succeed.
**Endpoint:** POST /sessions/:id/manual-exit
**Error Code:** SESSION_NOT_ACTIVE
**Error Message:** "Manual exit can only be performed on active sessions"

### BV7: Admin Override Validity
**Rule:** Admin can only override sessions in CREATED, ACTIVE, or AWAITING_SUMMARY status (not already COMPLETED or ARCHIVED).
**Endpoint:** POST /sessions/:id/override
**Error Code:** INVALID_OVERRIDE_TARGET
**Error Message:** "Cannot override a session in {status} status"

### BV8: Category Selection Timing
**Rule:** Category can only be assigned during CREATED or ACTIVE status. Not after exit.
**Error Code:** CATEGORY_ASSIGNMENT_TIMEOUT
**Error Message:** "Category can only be assigned before session exit"

### BV9: Archived Category Restriction
**Rule:** Archived categories cannot be assigned to new sessions.
**Error Code:** CATEGORY_ARCHIVED
**Error Message:** "Archived categories cannot be assigned to sessions"

---

## Cross-Field Validation

| Endpoint | Validation | Error Code |
|----------|-----------|------------|
| POST /sessions/entry | studentRoll + recorderFacultyId must reference valid entities | INVALID_STUDENT / INVALID_FACULTY |
| POST /sessions/exit | studentRoll must have an active session matching | NO_ACTIVE_SESSION |
| POST /sessions/:id/manual-exit | Session must belong to the student referred to in context | SESSION_STUDENT_MISMATCH |
| PATCH /students/:id/status | Status transition must be valid | INVALID_STATUS_TRANSITION |

---

## Ownership Validation

| Endpoint | Rule | Error Code |
|----------|------|------------|
| PATCH /notifications/:id/read | Notification must belong to the authenticated student | NOTIFICATION_NOT_OWNED |
| POST /sessions/:id/summary | Session must belong to the authenticated student | SESSION_NOT_OWNED |
| GET /notifications | Only returns notifications for authenticated student | — (implicit filter) |

---

## Duplicate Prevention

| Scenario | Detection Window | Error Code |
|----------|-----------------|------------|
| Duplicate student roll | Before insert | DUPLICATE_ROLL |
| Duplicate email (student) | Before insert | DUPLICATE_EMAIL |
| Duplicate email (faculty) | Before insert | DUPLICATE_EMAIL |
| Duplicate email (admin) | Before insert | DUPLICATE_EMAIL |
| Duplicate category name (active) | Before insert/update | DUPLICATE_CATEGORY |
| Double entry scan | Before insert | STUDENT_ALREADY_IN_SESSION |
| Double exit scan | Before update | NO_ACTIVE_SESSION |

---

## Server-Side Validation Rules

1. **All validation is performed server-side.** Client-side validation is for UX only.
2. **Validation order:** Field validation → Entity existence → Business rules → Authorization → State transition validation.
3. **First error wins.** Validation halts on the first failure and returns immediately.
4. **Validation is not bypassable.** Every API endpoint validates its input, even if the client is trusted.

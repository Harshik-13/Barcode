# API Contracts

**Base URL:** `/api/v1`
**Content-Type:** `application/json`
**Authentication:** `Authorization: Bearer <token>` (required except auth endpoints)

---

## Authentication

### POST /auth/login
Authenticate a user with email and password.

**Request:**
```json
{
  "email": "faculty@example.com",
  "password": "securepassword"
}
```

**Response 200:**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": 1,
    "name": "John Doe",
    "type": "faculty",
    "email": "faculty@example.com"
  }
}
```

**Response 401:**
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}
```

### POST /auth/logout
Invalidate the current session.

**Headers:** Authorization required

**Response 200:**
```json
{
  "message": "Logged out successfully"
}
```

### GET /auth/me
Get current authenticated user.

**Headers:** Authorization required

**Response 200:**
```json
{
  "id": 1,
  "name": "John Doe",
  "type": "faculty",
  "email": "faculty@example.com",
  "status": "ACTIVE",
  "createdAt": "2026-01-15T10:00:00Z"
}
```

---

## Students

### GET /students
List students with pagination and filtering.

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `status` (string — ENROLLED, SUSPENDED, DEPARTED)
- `search` (string — search by name or roll)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "roll": "STU001",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "status": "ENROLLED",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### GET /students/:id
Get a single student by ID.

**Response 200:**
```json
{
  "id": 1,
  "roll": "STU001",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "status": "ENROLLED",
  "createdAt": "2026-01-15T10:00:00Z",
  "sessionCount": 45,
  "activeSession": null
}
```

**Response 404:**
```json
{
  "error": "NOT_FOUND",
  "message": "Student not found"
}
```

### POST /students
Create a new student.

**Request:**
```json
{
  "roll": "STU001",
  "name": "Alice Smith",
  "email": "alice@example.com"
}
```

**Response 201:**
```json
{
  "id": 1,
  "roll": "STU001",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "status": "ENROLLED",
  "createdAt": "2026-07-22T10:00:00Z"
}
```

**Response 409:**
```json
{
  "error": "DUPLICATE_ROLL",
  "message": "A student with roll 'STU001' already exists"
}
```

### PATCH /students/:id
Update student details.

**Request:**
```json
{
  "name": "Alice Johnson",
  "email": "alice.johnson@example.com"
}
```

**Response 200:**
```json
{
  "id": 1,
  "roll": "STU001",
  "name": "Alice Johnson",
  "email": "alice.johnson@example.com",
  "status": "ENROLLED",
  "createdAt": "2026-01-15T10:00:00Z"
}
```

### PATCH /students/:id/status
Update student status.

**Request:**
```json
{
  "status": "SUSPENDED",
  "reason": "Violation of workspace policies"
}
```

**Response 200:**
```json
{
  "id": 1,
  "roll": "STU001",
  "name": "Alice Smith",
  "status": "SUSPENDED"
}
```

---

## Faculty
(Pattern matches Student module — omitted for brevity, same structure)

### GET /faculty
### GET /faculty/:id
### POST /faculty
### PATCH /faculty/:id
### PATCH /faculty/:id/status

---

## Admin
(Pattern matches Student module — omitted for brevity)

### GET /admins
### GET /admins/:id
### POST /admins
### PATCH /admins/:id
### PATCH /admins/:id/status

---

## Sessions

### POST /sessions/entry
Record an entry scan for a student.

**Request:**
```json
{
  "studentRoll": "STU001",
  "recorderFacultyId": 1
}
```

**Response 201:**
```json
{
  "id": 42,
  "student": {
    "id": 1,
    "roll": "STU001",
    "name": "Alice Smith"
  },
  "entryTime": "2026-07-22T09:00:00Z",
  "entryRecorder": {
    "id": 1,
    "name": "Dr. John"
  },
  "status": "ACTIVE"
}
```

**Response 409 (duplicate entry):**
```json
{
  "error": "STUDENT_ALREADY_IN_SESSION",
  "message": "Student already has an active session"
}
```

**Response 403 (suspended student):**
```json
{
  "error": "STUDENT_SUSPENDED",
  "message": "Suspended students cannot start sessions"
}
```

### POST /sessions/exit
Record an exit scan for a student.

**Request:**
```json
{
  "studentRoll": "STU001",
  "recorderFacultyId": 1
}
```

**Response 200:**
```json
{
  "id": 42,
  "student": {
    "id": 1,
    "roll": "STU001",
    "name": "Alice Smith"
  },
  "entryTime": "2026-07-22T09:00:00Z",
  "exitTime": "2026-07-22T12:00:00Z",
  "status": "AWAITING_SUMMARY"
}
```

**Response 404:**
```json
{
  "error": "NO_ACTIVE_SESSION",
  "message": "No active session found for this student"
}
```

### POST /sessions/:id/manual-exit
Manually exit a session (used when student forgets to scan exit).

**Request:**
```json
{
  "recorderFacultyId": 1,
  "reason": "Student forgot to scan exit"
}
```

**Response 200:**
```json
{
  "id": 42,
  "status": "COMPLETED",
  "exitTime": "2026-07-22T12:30:00Z",
  "isManualExit": true,
  "manualExitReason": "Student forgot to scan exit",
  "completionReason": "MANUAL_EXIT"
}
```

### POST /sessions/:id/summary
Submit work summary for a session.

**Request:**
```json
{
  "summary": "Worked on UI design for the dashboard module"
}
```

**Response 200:**
```json
{
  "id": 42,
  "status": "COMPLETED",
  "summary": "Worked on UI design for the dashboard module",
  "completionReason": "NORMAL"
}
```

**Response 400 (wrong status):**
```json
{
  "error": "INVALID_SESSION_STATUS",
  "message": "Summary can only be submitted when session status is AWAITING_SUMMARY"
}
```

### POST /sessions/:id/override
Admin override of a session.

**Request:**
```json
{
  "adminId": 1,
  "newStatus": "COMPLETED",
  "reason": "Student was unable to submit summary due to system issue"
}
```

**Response 200:**
```json
{
  "id": 42,
  "status": "COMPLETED",
  "completionReason": "ADMIN_OVERRIDE",
  "overrideReason": "Student was unable to submit summary due to system issue"
}
```

### GET /sessions
List sessions with pagination and filtering.

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `status` (string — filter by session status)
- `studentId` (int — filter by student)
- `facultyId` (int — filter by recorder)
- `categoryId` (int — filter by category)
- `dateFrom` (string — ISO date, filter entry_time >=)
- `dateTo` (string — ISO date, filter entry_time <=)

**Response 200:**
```json
{
  "data": [
    {
      "id": 42,
      "student": { "id": 1, "roll": "STU001", "name": "Alice Smith" },
      "entryTime": "2026-07-22T09:00:00Z",
      "exitTime": "2026-07-22T12:00:00Z",
      "category": { "id": 1, "name": "Coding" },
      "status": "COMPLETED",
      "completionReason": "NORMAL",
      "summary": "Worked on UI design"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### GET /sessions/:id
Get a single session by ID.

**Response 200:** (same shape as a single item in the list above, with additional fields)
```json
{
  "id": 42,
  "student": { "id": 1, "roll": "STU001", "name": "Alice Smith" },
  "entryTime": "2026-07-22T09:00:00Z",
  "exitTime": "2026-07-22T12:00:00Z",
  "entryRecorder": { "id": 1, "name": "Dr. John" },
  "exitRecorder": { "id": 2, "name": "Dr. Jane" },
  "category": { "id": 1, "name": "Coding" },
  "status": "COMPLETED",
  "completionReason": "NORMAL",
  "summary": "Worked on UI design",
  "isManualExit": false,
  "manualExitReason": null,
  "overrideReason": null,
  "createdAt": "2026-07-22T09:00:00Z"
}
```

### GET /sessions/occupancy
Get current workspace occupancy.

**Response 200:**
```json
{
  "total": 15,
  "sessions": [
    {
      "id": 42,
      "student": { "id": 1, "roll": "STU001", "name": "Alice Smith" },
      "entryTime": "2026-07-22T09:00:00Z",
      "category": { "id": 1, "name": "Coding" }
    }
  ],
  "byCategory": {
    "Coding": 8,
    "Design": 4,
    "Research": 3
  }
}
```

### GET /sessions/student/:studentId/active
Get active session for a specific student.

**Response 200:**
```json
{
  "id": 42,
  "status": "ACTIVE",
  "entryTime": "2026-07-22T09:00:00Z",
  "category": null
}
```

**Response 404:**
```json
{
  "error": "NO_ACTIVE_SESSION",
  "message": "No active session found for this student"
}
```

---

## Categories

### GET /categories
List categories.

**Query Parameters:**
- `status` (string — ACTIVE, ARCHIVED; defaults to ACTIVE)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Coding",
      "description": "Software development work",
      "status": "ACTIVE",
      "sessionCount": 120,
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

### GET /categories/:id
Get category details.

**Response 200:** (single category object matching above)

### POST /categories
Create a new category.

**Request:**
```json
{
  "name": "DevOps",
  "description": "Infrastructure and deployment work"
}
```

**Response 201:** (category object with id and timestamps)

### PATCH /categories/:id
Update category details.

**Request:**
```json
{
  "name": "DevOps & Cloud",
  "description": "Cloud infrastructure work"
}
```

**Response 200:** (updated category object)

### PATCH /categories/:id/archive
Archive a category.

**Response 200:**
```json
{
  "id": 1,
  "name": "Coding",
  "status": "ARCHIVED"
}
```

---

## Notifications

### GET /notifications
List notifications for the authenticated student.

**Headers:** Authorization required (student)

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20)
- `isRead` (boolean — filter by read status)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "type": "ENTRY",
      "message": "Entry recorded at 09:00 AM",
      "sessionId": 42,
      "isRead": false,
      "createdAt": "2026-07-22T09:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### GET /notifications/unread-count
Get unread notification count.

**Response 200:**
```json
{
  "unreadCount": 5
}
```

### PATCH /notifications/:id/read
Mark a single notification as read.

**Response 200:**
```json
{
  "id": 1,
  "isRead": true
}
```

### POST /notifications/read-all
Mark all notifications as read.

**Response 200:**
```json
{
  "updatedCount": 5,
  "message": "All notifications marked as read"
}
```

---

## Activity Logs

### GET /activity-logs
List activity logs.

**Headers:** Authorization required (admin)

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `actorType` (string — STUDENT, FACULTY, ADMIN, SYSTEM)
- `actorId` (int)
- `entityType` (string)
- `entityId` (int)
- `action` (string)
- `dateFrom` (string — ISO date)
- `dateTo` (string — ISO date)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "actorType": "FACULTY",
      "actorId": 1,
      "action": "SESSION_ENTRY",
      "entityType": "WORKSPACE_SESSION",
      "entityId": 42,
      "details": {
        "studentRoll": "STU001",
        "entryTime": "2026-07-22T09:00:00Z"
      },
      "ipAddress": "192.168.1.100",
      "createdAt": "2026-07-22T09:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

## Reports

### GET /reports/daily-summary
Get daily attendance summary.

**Query Parameters:**
- `date` (string — ISO date, defaults to today)

**Response 200:**
```json
{
  "date": "2026-07-22",
  "totalStudents": 150,
  "presentToday": 45,
  "avgDurationMinutes": 180,
  "byCategory": {
    "Coding": { "count": 20, "avgMinutes": 200 },
    "Design": { "count": 15, "avgMinutes": 160 },
    "Research": { "count": 10, "avgMinutes": 180 }
  }
}
```

### GET /reports/student/:studentId
Get report for a specific student.

**Query Parameters:**
- `dateFrom` (string — ISO date)
- `dateTo` (string — ISO date)

**Response 200:**
```json
{
  "student": { "id": 1, "roll": "STU001", "name": "Alice Smith" },
  "period": { "from": "2026-07-01", "to": "2026-07-22" },
  "totalSessions": 18,
  "totalHours": 36.5,
  "byCategory": {
    "Coding": { "sessions": 10, "hours": 22.0 },
    "Design": { "sessions": 8, "hours": 14.5 }
  }
}
```

### GET /reports/category/:categoryId
Get report for a specific category.

**Query Parameters:**
- `dateFrom` (string — ISO date)
- `dateTo` (string — ISO date)

**Response 200:**
```json
{
  "category": { "id": 1, "name": "Coding" },
  "period": { "from": "2026-07-01", "to": "2026-07-22" },
  "totalSessions": 120,
  "totalHours": 240.0,
  "avgDurationMinutes": 120,
  "uniqueStudents": 45
}
```

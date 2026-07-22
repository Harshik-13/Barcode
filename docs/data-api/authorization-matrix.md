# Authorization Matrix

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Allowed (self only) |
| ✅* | Allowed with restrictions |
| ❌ | Denied |

---

## Authentication

| Endpoint | Student | Faculty | Admin | Notes |
|----------|---------|---------|-------|-------|
| POST /auth/login | ✅ | ✅ | ✅ | Public endpoint |
| POST /auth/logout | ✅ | ✅ | ✅ | Any authenticated user |
| GET /auth/me | ✅ | ✅ | ✅ | Any authenticated user |

---

## Student Management

| Endpoint | Student | Faculty | Admin | Notes |
|----------|---------|---------|-------|-------|
| GET /students | ❌ | ✅ | ✅ | Faculty sees all students |
| GET /students/:id | ✅* | ✅ | ✅ | Student sees own only |
| POST /students | ❌ | ❌ | ✅ | Admin only |
| PATCH /students/:id | ✅* | ❌ | ✅ | Student can update own email only |
| PATCH /students/:id/status | ❌ | ❌ | ✅ | Admin only |

---

## Faculty Management

| Endpoint | Student | Faculty | Admin | Notes |
|----------|---------|---------|-------|-------|
| GET /faculty | ✅* | ✅ | ✅ | Student sees only IDs and names |
| GET /faculty/:id | ✅* | ✅ | ✅ | Students see limited fields |
| POST /faculty | ❌ | ❌ | ✅ | Admin only |
| PATCH /faculty/:id | ❌ | ✅* | ✅ | Faculty can update own limited fields |
| PATCH /faculty/:id/status | ❌ | ❌ | ✅ | Admin only |

---

## Admin Management

| Endpoint | Student | Faculty | Admin | Notes |
|----------|---------|---------|-------|-------|
| GET /admins | ❌ | ❌ | ✅ | Admin only |
| GET /admins/:id | ❌ | ❌ | ✅ | Admin only |
| POST /admins | ❌ | ❌ | ✅ | Admin only |
| PATCH /admins/:id | ❌ | ❌ | ✅ | Admin only |
| PATCH /admins/:id/status | ❌ | ❌ | ✅ | Admin only |

---

## Session Management

| Endpoint | Student | Faculty | Admin | Notes |
|----------|---------|---------|-------|-------|
| POST /sessions/entry | ❌ | ✅ | ✅ | Faculty/Admin scan entry |
| POST /sessions/exit | ❌ | ✅ | ✅ | Faculty/Admin scan exit |
| POST /sessions/:id/manual-exit | ❌ | ✅ | ✅ | Faculty/Admin |
| POST /sessions/:id/summary | ✅ | ❌ | ✅ | Student submits own summary |
| POST /sessions/:id/override | ❌ | ❌ | ✅ | Admin only |
| GET /sessions | ✅* | ✅ | ✅ | Student sees own only |
| GET /sessions/:id | ✅* | ✅ | ✅ | Student sees own only |
| GET /sessions/occupancy | ✅ | ✅ | ✅ | All can see current occupancy |
| GET /sessions/student/:studentId/active | ✅* | ✅ | ✅ | Student checks own only |

---

## Category Management

| Endpoint | Student | Faculty | Admin | Notes |
|----------|---------|---------|-------|-------|
| GET /categories | ✅ | ✅ | ✅ | All can see active categories |
| GET /categories/:id | ✅ | ✅ | ✅ | All can see |
| POST /categories | ❌ | ❌ | ✅ | Admin only |
| PATCH /categories/:id | ❌ | ❌ | ✅ | Admin only |
| PATCH /categories/:id/archive | ❌ | ❌ | ✅ | Admin only |

---

## Notification Management

| Endpoint | Student | Faculty | Admin | Notes |
|----------|---------|---------|-------|-------|
| GET /notifications | ✅ | ❌ | ❌ | Student sees own only |
| GET /notifications/unread-count | ✅ | ❌ | ❌ | Student sees own count |
| PATCH /notifications/:id/read | ✅ | ❌ | ❌ | Student marks own read |
| POST /notifications/read-all | ✅ | ❌ | ❌ | Student marks all own read |

---

## Activity Logs

| Endpoint | Student | Faculty | Admin | Notes |
|----------|---------|---------|-------|-------|
| GET /activity-logs | ❌ | ❌ | ✅ | Admin only |

---

## Reports

| Endpoint | Student | Faculty | Admin | Notes |
|----------|---------|---------|-------|-------|
| GET /reports/daily-summary | ❌ | ✅ | ✅ | Faculty/Admin |
| GET /reports/student/:studentId | ✅* | ✅ | ✅ | Student sees own only |
| GET /reports/category/:categoryId | ❌ | ✅ | ✅ | Faculty/Admin |

---

## Authorization Enforcement Rules

### A1: Token Required
Every endpoint except POST /auth/login requires a valid Bearer token. Requests without a token receive 401.

### A2: Role Enforcement
The token's embedded role (student, faculty, admin) determines access per the matrix above. Requests with insufficient permissions receive 403.

### A3: Ownership Enforcement
When a student accesses their own data, the token's user ID must match the resource's owner ID. Mismatch returns 403, not 404 (to avoid information leakage).

### A4: Scoping
List endpoints automatically scope results based on role:
- A student calling GET /sessions sees only their own sessions.
- A faculty member calling GET /students sees all students.
- An admin calling GET /sessions sees all sessions.

### A5: Field-Level Access
Certain endpoints return different fields based on role:
- GET /faculty returns limited fields (name, id) to students and full details to faculty/admins.
- GET /students/:id shows limited analytics to students vs. full data to faculty/admins.

### A6: Action-Level Authorization
Permissions are checked per action, not per endpoint. For example:
- POST /sessions/entry is allowed for both Faculty and Admin.
- POST /sessions/:id/override is allowed for Admin only.

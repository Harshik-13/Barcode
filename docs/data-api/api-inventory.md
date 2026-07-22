# API Inventory

All endpoints are prefixed with `/api/v1`.

---

## Authentication Module
| # | Method | Path | Description | Phase 3 Workflow |
|---|--------|------|-------------|------------------|
| 1 | POST | /auth/login | Authenticate user and issue session token | Authentication |
| 2 | POST | /auth/logout | Invalidate current session token | Authentication |
| 3 | GET | /auth/me | Get current authenticated user profile | Authentication |

---

## Student Module
| # | Method | Path | Description | Phase 3 Workflow |
|---|--------|------|-------------|------------------|
| 4 | GET | /students | List students (paginated, filterable) | Administration |
| 5 | GET | /students/:id | Get student details | Administration |
| 6 | POST | /students | Create new student | Administration |
| 7 | PATCH | /students/:id | Update student details | Administration |
| 8 | PATCH | /students/:id/status | Update student status (suspend/depart) | Administration |

---

## Faculty Module
| # | Method | Path | Description | Phase 3 Workflow |
|---|--------|------|-------------|------------------|
| 9 | GET | /faculty | List faculty (paginated, filterable) | Administration |
| 10 | GET | /faculty/:id | Get faculty details | Administration |
| 11 | POST | /faculty | Create new faculty | Administration |
| 12 | PATCH | /faculty/:id | Update faculty details | Administration |
| 13 | PATCH | /faculty/:id/status | Update faculty status | Administration |

---

## Admin Module
| # | Method | Path | Description | Phase 3 Workflow |
|---|--------|------|-------------|------------------|
| 14 | GET | /admins | List admins | Administration |
| 15 | GET | /admins/:id | Get admin details | Administration |
| 16 | POST | /admins | Create new admin | Administration |
| 17 | PATCH | /admins/:id | Update admin details | Administration |
| 18 | PATCH | /admins/:id/status | Update admin status | Administration |

---

## Session Module
| # | Method | Path | Description | Phase 3 Workflow |
|---|--------|------|-------------|------------------|
| 19 | POST | /sessions/entry | Record entry scan for a student | Entry Scan |
| 20 | POST | /sessions/exit | Record exit scan for a student | Exit Scan |
| 21 | POST | /sessions/:id/manual-exit | Manually exit a session | Manual Exit |
| 22 | POST | /sessions/:id/summary | Submit work summary for a session | Summary Submission |
| 23 | POST | /sessions/:id/override | Admin override of a session | Session Override |
| 24 | GET | /sessions | List sessions (paginated, filterable) | Reporting, Administration |
| 25 | GET | /sessions/:id | Get session details | All workflows |
| 26 | GET | /sessions/occupancy | Get current workspace occupancy | Occupancy Dashboard |
| 27 | GET | /sessions/student/:studentId/active | Get active session for a student | Entry/Exit precheck |

---

## Category Module
| # | Method | Path | Description | Phase 3 Workflow |
|---|--------|------|-------------|------------------|
| 28 | GET | /categories | List categories (active only by default) | Category Selection |
| 29 | GET | /categories/:id | Get category details | Administration |
| 30 | POST | /categories | Create new category | Administration |
| 31 | PATCH | /categories/:id | Update category details | Administration |
| 32 | PATCH | /categories/:id/archive | Archive a category | Administration |

---

## Notification Module
| # | Method | Path | Description | Phase 3 Workflow |
|---|--------|------|-------------|------------------|
| 33 | GET | /notifications | List notifications for current student | Notification Viewing |
| 34 | GET | /notifications/unread-count | Get unread notification count | Notification Badge |
| 35 | PATCH | /notifications/:id/read | Mark notification as read | Notification Viewing |
| 36 | POST | /notifications/read-all | Mark all notifications as read | Notification Viewing |

---

## Activity Log Module
| # | Method | Path | Description | Phase 3 Workflow |
|---|--------|------|-------------|------------------|
| 37 | GET | /activity-logs | List activity logs (paginated, filterable) | Audit |

---

## Reporting Module
| # | Method | Path | Description | Phase 3 Workflow |
|---|--------|------|-------------|------------------|
| 38 | GET | /reports/daily-summary | Get daily attendance summary | Reporting |
| 39 | GET | /reports/student/:studentId | Get report for a specific student | Reporting |
| 40 | GET | /reports/category/:categoryId | Get report for a specific category | Reporting |

---

## Totals

| Module | Count |
|--------|-------|
| Authentication | 3 |
| Student | 5 |
| Faculty | 5 |
| Admin | 5 |
| Session | 9 |
| Category | 5 |
| Notification | 4 |
| Activity Log | 1 |
| Reporting | 3 |
| **Total** | **40** |

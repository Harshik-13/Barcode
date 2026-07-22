# Permissions

## Notation

| Symbol | Meaning |
|--------|---------|
| ✅ | Allowed |
| ❌ | Not allowed |
| — | Not applicable (entity/action does not involve this actor) |

---

## WorkspaceSession

| Capability | Student | Faculty | Admin | System |
|------------|---------|---------|-------|--------|
| Create (record entry) | ❌ | ✅ | ❌ | ❌ |
| Select category | ✅ | ❌ | ❌ | ❌ |
| Change category (while Created) | ✅ | ❌ | ❌ | ❌ |
| Record normal exit | ❌ | ✅ | ❌ | ❌ |
| Perform manual exit | ❌ | ✅ | ❌ | ❌ |
| Override session (admin) | ❌ | ❌ | ✅ | ❌ |
| Archive session | ❌ | ❌ | ✅ | ❌ |
| Submit summary | ✅ | ❌ | ❌ | ❌ |
| View own sessions | ✅ | ❌ | ❌ | ❌ |
| View any session | ❌ | ✅ | ✅ | ❌ |
| View all incomplete sessions | ❌ | ✅ | ✅ | ❌ |
| Modify entry/exit time | ❌ | ❌ | ❌ | ❌ |
| Modify completed session | ❌ | ❌ | ❌ | ❌ |
| Delete session | ❌ | ❌ | ❌ | ❌ |

---

## Category

| Capability | Student | Faculty | Admin | System |
|------------|---------|---------|-------|--------|
| View available categories | ✅ | ✅ | ✅ | ❌ |
| Create category | ❌ | ❌ | ✅ | ❌ |
| Rename category | ❌ | ❌ | ✅ | ❌ |
| Archive category | ❌ | ❌ | ✅ | ❌ |
| Delete category | ❌ | ❌ | ❌ | ❌ |

---

## Notification

| Capability | Student | Faculty | Admin | System |
|------------|---------|---------|-------|--------|
| Receive notification | ✅ | ❌ | ❌ | ❌ |
| View own notifications | ✅ | ❌ | ❌ | ❌ |
| Mark as read | ✅ | ❌ | ❌ | ❌ |
| Create notification | ❌ | ❌ | ❌ | ✅ |
| Delete notification | ❌ | ❌ | ❌ | ❌ |

---

## Student Profile

| Capability | Student | Faculty | Admin | System |
|------------|---------|---------|-------|--------|
| View own profile | ✅ | ❌ | ❌ | ❌ |
| View any student profile | ❌ | ✅ (limited) | ✅ | ❌ |
| Create student account | ❌ | ❌ | ✅ | ✅ (on first login) |
| Suspend student | ❌ | ❌ | ✅ | ❌ |
| Reinstate student | ❌ | ❌ | ✅ | ❌ |
| Remove student | ❌ | ❌ | ✅ | ❌ |

---

## Faculty Profile

| Capability | Student | Faculty | Admin | System |
|------------|---------|---------|-------|--------|
| View own profile | ❌ | ✅ | ✅ | ❌ |
| Create faculty account | ❌ | ❌ | ✅ | ❌ |
| Suspend faculty | ❌ | ❌ | ✅ | ❌ |
| Reinstate faculty | ❌ | ❌ | ✅ | ❌ |
| Deactivate faculty | ❌ | ❌ | ✅ | ❌ |

---

## Reports & Analytics

| Capability | Student | Faculty | Admin | System |
|------------|---------|---------|-------|--------|
| View personal attendance | ✅ | ❌ | ❌ | ❌ |
| View personal streaks | ✅ | ❌ | ❌ | ❌ |
| View personal statistics | ✅ | ❌ | ❌ | ❌ |
| View workspace attendance reports | ❌ | ✅ | ✅ | ❌ |
| View workspace analytics | ❌ | ✅ | ✅ | ❌ |
| View global statistics | ❌ | ❌ | ✅ | ❌ |
| Export reports | ❌ | ✅ | ✅ | ❌ |
| View activity log | ❌ | ❌ | ✅ | ❌ |

---

## Summary by Actor

### Student
✅ View personal data, manage own sessions (category, summary), receive notifications

### Faculty
✅ Record entry, record normal exit, perform manual exit, view all sessions and reports, search students

### Admin
✅ Manage users (students, faculty), manage categories, override sessions, archive sessions, view all data, configure workspace, view activity log

### System
✅ Create notifications, record activity log entries, enforce business rules

---

## Principle

Permissions follow the **principle of least privilege**:
- A Student can only access data they own
- A Faculty can access data needed for operational duties
- An Admin can access all data needed for system management
- No actor can access data or perform actions that are unnecessary for their role

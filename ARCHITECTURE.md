# 8Hour Workspace Attendance System — Architecture

## System Overview

Role-based platform that records student attendance and daily work activity inside the startup workspace.

---

## Locked Architecture

- **Frontend**: Single React Progressive Web App (PWA)
- **Backend**: Single REST API (Node.js + Express + SQLite)
- **Database**: Single relational database (SQLite)
- **Authentication**: Single authentication system (Google OAuth + JWT)
- **Authorization**: Role-based access control

No separate Android applications. No duplicate frontends. No separate scanner application. The scanner is simply a faculty feature inside the same application.

---

## Domain Model

### Primary Entities

| Entity | Description |
|--------|-------------|
| Student | A person enrolled in the workspace program |
| Faculty | Staff who manage attendance scanning |
| Admin | System administrators |
| WorkspaceSession | Records a single entry-to-exit period |
| Category | Predefined work categories (e.g., Coding, Design, Research) |
| Notification | Messages sent to students on entry/exit |
| ActivityLog | Audit trail for all system actions |
| Role | Defines permissions (Student, Faculty, Admin) |

### WorkspaceSession States

```
PENDING  →  ACTIVE  →  COMPLETED
 (entry)    (category   (summary
             selected)   submitted)
```

---

## Core Workflow

### Entry Flow

```
Faculty logs into PWA
  ↓
Faculty scans student barcode
  ↓
Backend verifies student identity
  ↓
If no active session exists:
  → Create WorkspaceSession (status: PENDING)
  → Send notification to student
  → Student selects today's work category
  → Session becomes ACTIVE
```

### Exit Flow

```
Faculty scans student barcode
  ↓
Backend finds active WorkspaceSession
  ↓
Close session (status: COMPLETED)
  ↓
Send notification to student
  ↓
Student submits work summary
  ↓
Session completed
```

---

## Scanning Architecture

- **Only faculty scan**. Students NEVER scan.
- Faculty mobile device performs all barcode scanning.
- Student phones are used for: notifications, dashboard, work category selection, work summary submission, attendance history.

---

## User Roles & Permissions

### Student

- View dashboard
- View attendance history
- Receive notifications
- Select today's work category
- Submit work summary
- View streaks
- View statistics

**Cannot**: Scan IDs, access reports, view other students, access administration.

### Faculty

- Scan student barcodes
- Record entry / record exit
- View live occupancy
- Search students
- View reports
- View analytics

**Cannot**: Modify historical attendance directly, access admin configuration unless granted.

### Admin

- Manage users
- Manage faculty
- Manage categories
- Manage workspace settings
- View global analytics
- Configure the system

---

## Existing Codebase (Pre-Adaptation)

The project is adapted from **Campus Passport**, a QR-code-based hostel meal attendance system.

### Current Sub-projects

| Project | Role | Tech Stack |
|---------|------|------------|
| `passport-pwa/` | Student QR display app | React + TypeScript + Vite |
| `vjscanner-pwa/` | Faculty/warden scanner app | React + TypeScript + Vite |
| `api-server/` | Backend API | Node.js + Express + SQLite |

### What Stays (Reused)

- Google OAuth + JWT authentication
- QR/barcode scanning infrastructure (html5-qrcode)
- PWA infrastructure (service workers, manifest, offline support)
- SQLite database via better-sqlite3
- IndexedDB for offline storage
- Camera scanner component
- Report views (adapted for analytics)
- Student data loading from roster files

### What Changes

- Domain: hostel meal tracking → workspace session management
- `scans` table → `workspace_sessions` table
- `memberships`/`devices` → removed or repurposed
- Meal categories → work categories
- Meal time windows → workspace hours
- QR generation (student app) → dashboard + notifications
- Meal-based duplicate detection → session-based state machine
- Reports filtered by meal → reports filtered by date/category/student

---

## API Endpoints (Implemented — Milestone 5)

All endpoints are mounted under `/api` prefix. All **34 endpoints** are consumed by the frontend UI — 100% alignment.

### Auth
| Method | Endpoint | Auth | Role | Frontend |
|--------|----------|------|------|----------|
| POST | `/api/auth/login` | None | All | Login page |
| POST | `/api/auth/logout` | Bearer | All | Layout logout button |
| GET | `/api/auth/me` | Bearer | All | Session restore on page load |

### Scan
| Method | Endpoint | Auth | Role | Frontend |
|--------|----------|------|------|----------|
| POST | `/api/scan` | Bearer | Faculty/Admin | Scanner page |

### Sessions
| Method | Endpoint | Auth | Role | Frontend |
|--------|----------|------|------|----------|
| GET | `/api/sessions` | Bearer | All | Sessions page (all) / Student dashboard (filtered) |
| GET | `/api/sessions/:id` | Bearer | All | Session detail page |
| GET | `/api/sessions/active/:studentId` | Bearer | All | Student dashboard current session |
| POST | `/api/sessions` | Bearer | Faculty/Admin | (reserved for manual creation) |
| PATCH | `/api/sessions/:id/start` | Bearer | Faculty/Admin | (reserved) |
| PATCH | `/api/sessions/:id/exit` | Bearer | Faculty/Admin | (reserved) |
| PATCH | `/api/sessions/:id/manual-exit` | Bearer | Faculty/Admin | (reserved) |
| PATCH | `/api/sessions/:id/complete` | Bearer | Faculty/Admin/Student* | Sessions page + Session detail page (student own sessions) |
| PATCH | `/api/sessions/:id/archive` | Bearer | Admin | Sessions page — archive button |

*Students can only complete their own sessions (ownership check via `requireOwnership`).

### Students
| Method | Endpoint | Auth | Role | Frontend |
|--------|----------|------|------|----------|
| GET | `/api/students` | Bearer | All | Students page — paginated list with status filter |
| GET | `/api/students/:id` | Bearer | All | (reserved for detail view) |
| GET | `/api/students/:id/history` | Bearer | All | Student dashboard — recent sessions |
| POST | `/api/students` | Bearer | Admin | Students page — create form |
| PUT | `/api/students/:id` | Bearer | Admin | (reserved) |
| PATCH | `/api/students/:id/suspend` | Bearer | Admin | Students page — suspend button |
| PATCH | `/api/students/:id/depart` | Bearer | Admin | Students page — depart button |
| GET | `/api/students/lookup` | Bearer | All | (reserved for search) |
| GET | `/api/students/search` | Bearer | All | (reserved for search) |

### Categories
| Method | Endpoint | Auth | Role | Frontend |
|--------|----------|------|------|----------|
| GET | `/api/categories` | Bearer | All | Categories page — list |
| GET | `/api/categories/:id` | Bearer | All | (reserved) |
| POST | `/api/categories` | Bearer | Admin | Categories page — create form |
| PUT | `/api/categories/:id` | Bearer | Admin | Categories page — inline edit |
| PATCH | `/api/categories/:id/archive` | Bearer | Admin | Categories page — archive button |

### Activity Logs
| Method | Endpoint | Auth | Role | Frontend |
|--------|----------|------|------|----------|
| GET | `/api/activity-logs` | Bearer | Admin | Activity Logs page — paginated with actor-type filter |
| GET | `/api/activity-logs/:id` | Bearer | Admin | (reserved) |
| GET | `/api/activity-logs/recent` | Bearer | Admin | Admin dashboard — recent activity count |

### Notifications
| Method | Endpoint | Auth | Role | Frontend |
|--------|----------|------|------|----------|
| GET | `/api/notifications` | Bearer | Student | Notifications page — paginated list |
| GET | `/api/notifications/unread-count` | Bearer | Student | Layout notification bell badge |
| PATCH | `/api/notifications/:id/read` | Bearer | Student | Notifications page — mark single as read |
| PATCH | `/api/notifications/read-all` | Bearer | Student | Notifications page — mark all as read |

### System
| Method | Endpoint | Auth | Frontend |
|--------|----------|------|----------|
| GET | `/api/health` | None | (health check, not UI-consumed) |

### Response Format

All endpoints return camelCase JSON properties. The backend converts SQLite snake_case column names to camelCase at the service layer:

| Snake case (DB) | Camel case (API) |
|-----------------|------------------|
| `student_id` | `studentId` |
| `entry_time` | `entryTime` |
| `created_at` | `createdAt` |
| `actor_type` | `actorType` |
| `student_roll` | `studentRoll` (from JOIN) |
| `category_name` | `categoryName` (from JOIN) |

---

## Database Schema (Target)

```sql
-- Roles
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Users (faculty + admin accounts)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role_id TEXT NOT NULL REFERENCES roles(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Students (workspace participants)
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roll TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Work categories
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workspace sessions (core entity)
CREATE TABLE workspace_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id),
  scanned_by INTEGER REFERENCES users(id),
  category_id INTEGER REFERENCES categories(id),
  entry_time DATETIME NOT NULL,
  exit_time DATETIME,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'completed')),
  summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id),
  session_id INTEGER REFERENCES workspace_sessions(id),
  type TEXT NOT NULL CHECK (type IN ('entry', 'exit', 'reminder')),
  message TEXT,
  read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activity log (audit trail)
CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id INTEGER,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Key Design Decisions

1. **Single PWA** — Both student and faculty interfaces coexist in one React app, role-routed.
2. **Barcode/QR scanning** — Faculty scans student barcode/QR to record entry/exit (reuses existing html5-qrcode).
3. **Session state machine** — WorkspaceSession transitions: pending → active → completed. Each transition is a distinct API call with authorization checks.
4. **No meal concepts** — All hostel/meal terminology removed. Replaced by work categories and workspace sessions.
5. **Duplicate scan prevention** — Prevent double entry (no active session) and double exit (no open session). Validate at API level.
6. **Offline-first** — Faculty app caches student roster and can queue scans for sync.
7. **Notification system** — Notifications are auto-created server-side on entry/exit/complete/archive via `createNotification()`. Students poll for unread count every 30s and view full history in the notification center.

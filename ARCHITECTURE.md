# Hive — Architecture

## System Overview

Role-based platform that records student attendance and daily work activity inside the startup workspace.

---

## Locked Architecture

- **Frontend**: Single React Progressive Web App (PWA)
- **Backend**: Single REST API (Node.js + Express + PostgreSQL)
- **Database**: Single relational database (PostgreSQL 15+)
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

## API Endpoints (Implemented — Production MVP 1)

All endpoints are mounted under `/api` prefix. All **43 endpoints** are consumed by the frontend UI — 100% alignment.

### Auth
| Method | Endpoint | Auth | Role | Frontend |
|--------|----------|------|------|----------|
| POST | `/api/auth/google` | Rate limited | All | Login page — "Continue with Google" (verifies Google ID token, domain-gated `@vnrvjiet.in`) |
| GET | `/api/auth/me` | Bearer | All | Session restore on page load |
| POST | `/api/auth/logout` | Bearer | All | Layout logout button |

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
| GET | `/api/sessions/stats/:studentId` | Bearer | All | Student dashboard — stats cards |
| GET | `/api/sessions/live` | Bearer | All | Live occupancy count + students |
| GET | `/api/sessions/stats/live` | Bearer | Admin/Faculty | Live occupancy (separate route) |
| POST | `/api/sessions` | Bearer | Faculty/Admin | (reserved for manual creation) |
| PATCH | `/api/sessions/:id/start` | Bearer | Faculty/Admin | (reserved) |
| PATCH | `/api/sessions/:id/exit` | Bearer | Faculty/Admin | (reserved) |
| PATCH | `/api/sessions/:id/manual-exit` | Bearer | Faculty/Admin | Scanner force-exit dialog |
| PATCH | `/api/sessions/:id/complete` | Bearer | Faculty/Admin/Student* | Sessions page + Session detail page (student own sessions) |
| PATCH | `/api/sessions/:id/archive` | Bearer | Admin | Sessions page — archive button |
| POST | `/api/sessions/:id/review` | Bearer | Admin/Faculty | Faculty review (approve/reject) |
| PATCH | `/api/sessions/:id/override` | Bearer | Admin | Sessions page — override button |

*Students can only complete their own sessions (ownership check via `requireOwnership`).

### Students
| Method | Endpoint | Auth | Role | Frontend |
|--------|----------|------|------|----------|
| GET | `/api/students` | Bearer | All | Students page — paginated list with status filter |
| GET | `/api/students/:id` | Bearer | All | Student detail (IDOR-protected) |
| GET | `/api/students/:id/history` | Bearer | All | Student dashboard — paginated session history (IDOR-protected) |
| POST | `/api/students` | Bearer | Admin | Students page — create form |
| PUT | `/api/students/:id` | Bearer | Admin | (reserved) |
| PATCH | `/api/students/:id/suspend` | Bearer | Admin | Students page — suspend button |
| PATCH | `/api/students/:id/depart` | Bearer | Admin | Students page — depart button |
| GET | `/api/students/lookup` | Bearer | All | (reserved for search) |
| GET | `/api/students/search` | Bearer | All | Student search (limited to 20 results) |

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

All endpoints return camelCase JSON properties. The backend converts PostgreSQL snake_case column names to camelCase at the service layer:

| Snake case (DB) | Camel case (API) |
|-----------------|------------------|
| `student_id` | `studentId` |
| `entry_time` | `entryTime` |
| `created_at` | `createdAt` |
| `actor_type` | `actorType` |
| `student_roll` | `studentRoll` (from JOIN) |
| `category_name` | `categoryName` (from JOIN) |

---

## Database Schema (PostgreSQL — Production)

```sql
-- Roles
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Users (faculty + admin accounts)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role_id TEXT NOT NULL REFERENCES roles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'deactivated')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  google_sub TEXT UNIQUE,
  profile_picture TEXT
);

-- Students (workspace participants)
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  roll TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT UNIQUE,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('invited', 'enrolled', 'suspended', 'departed')),
  branch TEXT,
  section TEXT,
  hostel TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workspace sessions (core entity)
CREATE TABLE workspace_sessions (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  scanned_by INTEGER REFERENCES users(id),
  exit_recorder_id INTEGER REFERENCES users(id),
  category_id INTEGER REFERENCES categories(id),
  entry_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  exit_time TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'awaiting_summary', 'completed', 'archived')),
  summary TEXT,
  completion_reason TEXT DEFAULT 'NORMAL'
    CHECK (completion_reason IN ('NORMAL', 'AUTO_COMPLETED', 'MANUAL_EXIT', 'ADMIN_OVERRIDE')),
  is_manual_exit INTEGER DEFAULT 0,
  manual_exit_reason TEXT,
  override_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  session_id INTEGER REFERENCES workspace_sessions(id),
  type TEXT NOT NULL CHECK (type IN ('entry', 'exit', 'reminder', 'summary_required', 'session_completed', 'session_archived')),
  message TEXT,
  read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity log (audit trail)
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id INTEGER,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push subscriptions
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Faculty notifications
CREATE TABLE faculty_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activation OTPs
CREATE TABLE activation_otps (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  otp_hash TEXT NOT NULL,
  activation_token TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  expires_at TIMESTAMP NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

8. **IDOR protection** — `requireOwnStudentResource` middleware resolves the calling user's student record via `JOIN students s ON s.email = u.email` and rejects if the resource `studentId`/`id` param does not match. Applied to all student-scoped endpoints.
10. **Race condition prevention** — Session state transitions use `SELECT ... FOR UPDATE` row-level locking inside transactions. The UPDATE checks `rowCount === 0` to detect concurrent modifications and returns a `RACE_CONDITION` error.

11. **Search bounded** — Student search queries are limited to 20 results to prevent unbounded queries on large datasets.

12. **Graceful shutdown** — `SIGTERM`/`SIGINT` handlers close the HTTP server, clear maintenance intervals, close database connections, and force-exit after 10s timeout.

13. **Camera lifecycle** — Camera scanner pauses when browser tab is hidden (`visibilitychange`) and resumes when visible, preventing unnecessary camera resource usage.

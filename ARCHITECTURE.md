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

## API Endpoints (Target)

### Auth
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/login` | None |
| POST | `/api/auth/google` | None |

### Sessions
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/api/session/entry` | Bearer | Faculty |
| POST | `/api/session/exit` | Bearer | Faculty |
| GET | `/api/session/active/{roll}` | Bearer | Faculty |
| GET | `/api/session/history/{roll}` | Bearer | Student/Faculty |

### Categories
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/categories` | Bearer | All |
| POST | `/api/categories` | Bearer | Admin |
| POST | `/api/session/category` | Bearer | Student |

### Work Summary
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/api/session/summary` | Bearer | Student |
| GET | `/api/session/summary/{sessionId}` | Bearer | Student/Faculty |

### Reports & Analytics
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/reports/attendance` | Bearer | Faculty/Admin |
| GET | `/api/reports/analytics` | Bearer | Faculty/Admin |
| GET | `/api/reports/streaks` | Bearer | Student |

### Admin
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/admin/users` | Bearer | Admin |
| POST | `/api/admin/users` | Bearer | Admin |
| GET | `/api/admin/settings` | Bearer | Admin |
| PUT | `/api/admin/settings` | Bearer | Admin |

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

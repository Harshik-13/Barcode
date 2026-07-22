# 8Hour Workspace Attendance System — Adaptation Roadmap

## Phase 1: Foundation (Database + Auth)

### Database Migration
- [ ] Create new migration script (`migrations-workspace.sql`)
- [ ] Add tables: `roles`, `users`, `categories`, `workspace_sessions`, `notifications`, `activity_logs`
- [ ] Deprecate/remove: `scans`, `devices`, `memberships` tables
- [ ] Seed data: default roles (student, faculty, admin), default categories
- [ ] Seed data: admin user account

### Auth & Roles
- [ ] Add role field to JWT payload
- [ ] Create auth middleware with role checking
- [ ] Update `/api/auth/login` to return role
- [ ] Update `/api/auth/google` to return role
- [ ] Auth middleware for each role level

---

## Phase 2: Session Management API

### Entry/Exit Endpoints
- [ ] `POST /api/session/entry` — Faculty scans → create WorkspaceSession (pending)
- [ ] `POST /api/session/exit` — Faculty scans → close active WorkspaceSession
- [ ] `GET /api/session/active/{roll}` — Check if student has active session
- [ ] `GET /api/session/history/{roll}` — Student's session history

### Category Selection
- [ ] `GET /api/categories` — List available work categories
- [ ] `POST /api/session/category` — Student selects category for active session

### Work Summary
- [ ] `POST /api/session/summary` — Student submits work summary
- [ ] `GET /api/session/summary/{sessionId}` — View summary

### Notifications
- [ ] `GET /api/notifications` — Student fetches notifications
- [ ] `POST /api/notifications/read/{id}` — Mark as read

---

## Phase 3: Single PWA Restructure

### Project Merge
- [ ] Create new top-level PWA project (or restructure existing)
- [ ] Combine passport-pwa + vjscanner-pwa into single app
- [ ] Role-based routing (student view / faculty view / admin view)
- [ ] Shared component library (reused from both apps)

### Student Dashboard (adapted from passport-pwa)
- [ ] Replace QR code display with dashboard homepage
- [ ] Show active session status
- [ ] Show today's work category selector
- [ ] Show notification list
- [ ] Show attendance history
- [ ] Show streaks and statistics
- [ ] Remove QR generation (students no longer display QR)

### Faculty Scanner (adapted from vjscanner-pwa)
- [ ] Retain camera scanning (html5-qrcode)
- [ ] Replace meal type selector with entry/exit mode toggle
- [ ] Show live occupancy count
- [ ] Student search functionality
- [ ] Remove hostel selector
- [ ] Remove meal time windows

### Admin Panel
- [ ] User management (CRUD for faculty accounts)
- [ ] Category management
- [ ] Workspace settings
- [ ] Global analytics dashboard

### Reports & Analytics (adapted from ReportsView)
- [ ] Attendance reports (date range, student, category filters)
- [ ] Productivity analytics (hours per category, trends)
- [ ] Streak tracking
- [ ] CSV export (reuse existing export logic)

---

## Phase 4: Security & Production

### Security Hardening
- [ ] Rate limiting on session endpoints
- [ ] Input sanitization on all endpoints
- [ ] Ownership verification (students see only their data)
- [ ] Duplicate scan prevention (race condition safe)
- [ ] Concurrent request handling with transactions
- [ ] Audit logging for all state changes

### Testing
- [ ] Unit tests for session state machine
- [ ] Unit tests for auth middleware
- [ ] Integration tests for entry/exit flow
- [ ] Integration tests for role enforcement
- [ ] Test duplicate scan prevention
- [ ] Test concurrent session creation

---

## Phase 5: Polish

- [ ] Error handling improvements
- [ ] Loading states and UX feedback
- [ ] Offline support for faculty scanning
- [ ] PWA manifest update
- [ ] Environment configuration cleanup
- [ ] Remove all remaining hostel/meal references
- [ ] Final production readiness review

---

## Migration Notes

### What to Reuse (Don't Rewrite)

| Existing Code | Reuse As |
|---------------|----------|
| CameraScanner.tsx | Faculty barcode scanner (unchanged) |
| GoogleLogin.tsx | Auth component (unchanged) |
| ReportsView.tsx | Analytics reports (adapted) |
| IndexedDB wrapper (idb.ts) | Offline storage (unchanged) |
| Service worker (sw.ts) | PWA offline support (unchanged) |
| PWA manifest | Single app manifest (updated) |
| API auth middleware pattern | Role-based auth (extended) |
| Database connection (db.js) | Database access (unchanged) |

### What to Remove

- Hostel roster text files (BH1, GH1) — or repurpose as student roster
- Meal time configuration variables
- Meal type selection UI
- Hostel selector dropdown
- QR generation in student app
- Demo/dev tools for QR secrets

### What to Rename

- `scans` → `workspace_sessions`
- `foodType` → `categoryId`
- `hostelId` → (removed)
- `device` → (removed)
- `mode` (meal/Hostel In) → `session_type` (entry/exit)

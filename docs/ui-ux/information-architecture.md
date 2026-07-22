# Information Architecture

## Application Structure

```
  ┌─────────────────────────────────────────────────────┐
  │                  Login / Auth                        │
  └─────────────────────┬───────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ Student  │  │ Faculty  │  │  Admin   │
   │  Portal  │  │  Portal  │  │  Portal  │
   └──────────┘  └──────────┘  └──────────┘
```

The application is a single-page application (SPA) with role-based routing. After authentication, the user is directed to their role-specific portal. Unauthenticated users see only the Login screen.

### Implementation Type

The application is a **Progressive Web App (PWA).**

- One React-based PWA — single codebase for all three roles.
- Installable on supported devices (desktop and mobile).
- Camera access for QR Code and 1D Barcode scanning.
- Offline capability for cached content.
- Background synchronization for notification polling and data refresh.
- Responsive layouts adapt to mobile, tablet, and desktop viewports.
- No separate native Android or iOS applications.

---

## Primary Navigation

### Student Navigation

```
┌─────────────────────────────────────────┐
│  Dashboard        (default landing)      │
│  My Sessions      (history)              │
│  Profile          (settings)             │
│  Logout                                  │
└─────────────────────────────────────────┘
```

- **Dashboard:** Active session status, unread notifications, recent sessions summary
- **My Sessions:** Full session history with filtering and search
- **Profile:** View and edit personal details, change email
- **Install App:** PWA install prompt (available on supported browsers)

### Faculty Navigation

```
┌─────────────────────────────────────────┐
│  Dashboard        (default landing)      │
│  Scanner          (entry/exit)           │
│  Students         (search/lookup)        │
│  Reports          (analytics)            │
│  Logout                                  │
└─────────────────────────────────────────┘
```

- **Dashboard:** Occupancy overview, recent scans, quick actions
- **Scanner:** Camera-based identification scanning with entry/exit mode toggle and QR/Barcode scan format toggle
- **Students:** Search and view student details
- **Reports:** Daily summary, category analytics, student reports

### Admin Navigation

```
┌─────────────────────────────────────────┐
│  Dashboard        (default landing)      │
│  Students         (manage)               │
│  Faculty          (manage)               │
│  Admins           (manage)               │
│  Categories       (manage)               │
│  Sessions         (manage, override)      │
│  Reports          (analytics)            │
│  Activity Log     (audit)                │
│  Logout                                  │
└─────────────────────────────────────────┘
```

- **Dashboard:** Global metrics, recent activity, flagged sessions
- **Students:** Full CRUD, status management (suspend/depart)
- **Faculty:** Full CRUD, status management
- **Admins:** Full CRUD, status management
- **Categories:** Create, edit, archive
- **Sessions:** View all, override sessions
- **Reports:** Daily, student, category reports
- **Activity Log:** Audit trail with filtering

---

## Secondary Navigation

### Contextual Actions

| Screen | Secondary Actions |
|--------|------------------|
| Session List | Filter by status, date, category |
| Student Detail | View sessions, edit details, suspend |
| Faculty Detail | View recorded sessions, edit details |
| Session Detail | Override (admin only), view audit log |
| Scanner | Toggle entry/exit mode, toggle QR/Barcode mode, manual entry |

### Breadcrumb Pattern

All drill-down screens use a breadcrumb for navigation context:

```
Student List > Alice Smith
Dashboard > Sessions > Session #42
```

---

## User Entry Points

| Actor | First Screen | Entry Condition |
|-------|-------------|-----------------|
| Unauthenticated user | Login | No valid session token |
| Student | Dashboard | Valid token + student role |
| Faculty | Dashboard | Valid token + faculty role |
| Admin | Dashboard | Valid token + admin role |
| Student (deep link) | Session History | Direct navigation from notification |
| All (PWA install) | — | "Install App" prompt on supported browsers |

---

## Screen Hierarchy

### Student

```
Login
└── Student Dashboard
    ├── Active Session Card
    │   ├── Category Selection (if CREATED)
    │   └── Summary Submission (if AWAITING_SUMMARY)
    ├── Notification List
    ├── Session History
    │   └── Session Detail
    └── Profile
```

### Faculty

```
Login
└── Faculty Dashboard
    ├── Occupancy Overview
    ├── Scanner (entry/exit)
    │   └── Scan Result (success/error)
    │   └── Manual Exit
    ├── Student Search
    │   └── Student Detail
    │       └── Session History
    └── Reports
        ├── Daily Summary
        ├── Student Report
        └── Category Report
```

### Admin

```
Login
└── Admin Dashboard
    ├── Student Management
    │   └── Student Detail → Session History → Session Detail
    ├── Faculty Management
    │   └── Faculty Detail
    ├── Admin Management
    │   └── Admin Detail
    ├── Category Management
    ├── Session Management
    │   └── Session Detail (with override)
    ├── Reports
    │   ├── Daily Summary
    │   ├── Student Report
    │   └── Category Report
    └── Activity Log
```

---

## Navigation Map

```
                          ┌─────────────┐
                          │    Login     │
                          └──────┬──────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
   │ Student Dashboard│ │ Faculty Dashboard│ │  Admin Dashboard │
   └───┬───┬───┬──────┘ └───┬───┬───┬──────┘ └───┬───┬───┬──────┘
       │   │   │            │   │   │            │   │   │
       ▼   ▼   ▼            ▼   ▼   ▼            ▼   ▼   ▼
    ┌──┐ ┌──┐ ┌──┐     ┌──┐ ┌──┐ ┌──┐     ┌──┐ ┌──┐ ┌──┐
    │DS│ │SH│ │PR│     │SC│ │ST│ │RP│     │ST│ │FA│ │CA│
    └──┘ └──┘ └──┘     └──┘ └──┘ └──┘     └──┘ └──┘ └──┘
       │     │            │                  │     │     │
       ▼     ▼            ▼                  ▼     ▼     ▼
    ┌──┐ ┌─────┐      ┌─────┐            ┌─────┐ ┌──┐ ┌─────┐
    │SD│ │  SE │      │  SE │            │  SE │ │FD│ │  CA │
    └──┘ └─────┘      └─────┘            └─────┘ └──┘ └─────┘
         │                                               │
         ▼                                               ▼
      ┌──────┐                                       ┌──────┐
      │  SD  │                                       │  SD  │
      └──────┘                                       └──────┘
```

**Key:**
- DS = Dashboard
- SH = Session History
- PR = Profile
- SC = Scanner
- ST = Student Management
- RP = Reports
- FA = Faculty Management
- CA = Category Management
- SD = Session Detail
- SE = Student Detail
- FD = Faculty Detail

---

### Faculty Scanner (entry/exit)

```
Login
└── Faculty Dashboard
    ├── Occupancy Overview
    ├── Scanner (entry/exit)
    │   ├── QR Code mode
    │   ├── Barcode mode
    │   ├── Scan Result (success/error)
    │   └── Manual Exit
    ├── Student Search
    │   └── Student Detail
    │       └── Session History
    └── Reports
        ├── Daily Summary
        ├── Student Report
        └── Category Report
```

---

## Global Navigation Rules

1. **Role-based routing.** Users cannot navigate to screens outside their role. Attempted navigation to unauthorized routes redirects to Dashboard with a 403 message.
2. **Dashboard is the default landing.** Every role lands on their Dashboard after login.
3. **Back navigation.** All detail screens provide a "Back" button that returns to the previous list or parent screen.
4. **Logout is always accessible.** Logout is available from every screen via the navigation menu.
5. **Notifications badge.** The student's notification icon shows an unread count badge on all screens.
6. **Session context bar.** When a student has an active session, a persistent bar is shown at the top indicating the current session status.
7. **PWA install prompt.** The application offers an install prompt on supported browsers. The prompt appears once and can be dismissed. An "Install App" option is available in the navigation menu.
8. **Service worker registration.** The PWA registers a service worker on login for caching static assets and enabling offline capability.
9. **No dead ends.** Every action either succeeds (with confirmation) or fails (with actionable error). Every screen has a navigation path to at least one other screen.

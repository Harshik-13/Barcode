# Role Dashboards

---

## Student Dashboard

### Widgets

```
┌──────────────────────────────────────────────┐
│ ← Dashboard                     🔔 [3]   👤   │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ ACTIVE SESSION                         │  │
│  │                                        │  │
│  │  ⏱️ 09:00 - now · 2h 30m              │  │
│  │                                        │  │
│  │  ┌──────┬──────┬──────────┐            │  │
│  │  │Status│ Cat  │ Summary  │            │  │
│  │  ├──────┼──────┼──────────┤            │  │
│  │  │🟡    │ ⚪    │ ⚪        │            │  │
│  │  │Created│ None │ N/A      │            │  │
│  │  └──────┴──────┴──────────┘            │  │
│  │                                        │  │
│  │  [Select Category →]                   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────┬───────────────────────────┐  │
│  │            │  RECENT SESSIONS           │  │
│  │  STATS     │  ┌─────────────────────┐  │  │
│  │  45        │  │Jul 22 Coding 3h DONE│  │  │
│  │  Sessions  │  ├─────────────────────┤  │  │
│  │            │  │Jul 21 Design 3.5h MN│  │  │
│  │  89.5h     │  ├─────────────────────┤  │  │
│  │  Total     │  │Jul 19 Rsrch 1.5h AC│  │  │
│  │            │  └─────────────────────┘  │  │
│  │  3.2h      │  [View All →]            │  │
│  │  Avg/day   │                           │  │
│  └────────────┴───────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ NOTIFICATIONS                          │  │
│  │ ● Entry recorded at 09:00          2m  │  │
│  │ ○ Session completed yesterday      1d  │  │
│  │ [View All →]                           │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### Quick Actions

| Action | Visible When | Leads To |
|--------|-------------|----------|
| Select Category | Session in CREATED | Category Selection (S4) |
| Submit Summary | Session in AWAITING_SUMMARY | Summary Submission (S5) |
| View Sessions | Always | Session History (S6) |
| View Notifications | Always | Notification List (S8) |
| Edit Profile | Always | Profile (S9) |

### Key Metrics

| Metric | Source | Update |
|--------|--------|--------|
| Total sessions | GET /sessions (count) | On page load |
| Total hours | Computed from session durations | On page load |
| Average daily hours | Computed from recent 30 days | On page load |

---

## Faculty Dashboard

### Widgets

```
┌──────────────────────────────────────────────┐
│ ← Dashboard                             👤   │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ NOW IN WORKSPACE                     │    │
│  │                                      │    │
│  │        15  students                   │    │
│  │                                      │    │
│  │  Coding:   8  ●●●●●●●●                │    │
│  │  Design:   4  ●●●●                     │    │
│  │  Research: 3  ●●●                      │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ 📷 Scan  │ │ 📷 Scan  │ │ 🔧 Manual    │ │
│  │  Entry   │ │  Exit    │ │   Exit       │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ RECENT SCANS                           │  │
│  │ ┌──────────┬────────┬────────┬──────┐  │  │
│  │ │ 09:02    │ Alice  │ Entry  │ ✓    │  │  │
│  │ │ 09:01    │ Bob    │ Entry  │ ✓    │  │  │
│  │ │ 08:55    │ Carol  │ Exit   │ ✓    │  │  │
│  │ │ 08:50    │ David  │ Entry  │ ✓    │  │  │
│  │ └──────────┴────────┴────────┴──────┘  │  │
│  │ [View All Sessions →]                  │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### Quick Actions

| Action | Leads To |
|--------|----------|
| Scan Entry | Scanner (S11) — Entry mode |
| Scan Exit | Scanner (S11) — Exit mode |
| Manual Exit | Manual Exit (S13) |
| Student Search | Student Search & Detail (S14) |
| Reports | Reports (S15) |

### Key Metrics

| Metric | Source | Update |
|--------|--------|--------|
| Current occupancy | GET /sessions/occupancy | Every 30s |
| Occupancy by category | GET /sessions/occupancy | Every 30s |
| Recent scans | GET /sessions | On page load |

---

## Admin Dashboard

### Widgets

```
┌──────────────────────────────────────────────┐
│ ← Dashboard                             👤   │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ 150  │ │  45  │ │  15  │ │   2  │       │
│  │Total │ │Today │ │ Now  │ │Flagged│       │
│  │Stud. │ │Pres. │ │Inside│ │       │       │
│  └──────┘ └──────┘ └──────┘ └──────┘       │
│                                              │
│  ┌──────────────┬──────────────┬──────────┐  │
│  │   Students   │   Faculty    │Categories│  │
│  ├──────────────┼──────────────┼──────────┤  │
│  │ 150 total    │ 12 active    │ 4 active │  │
│  │ 2 suspended  │ 1 suspended  │ 1 archived│  │
│  │ 3 departed   │ 0 deactivated│          │  │
│  └──────────────┴──────────────┴──────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ ⚠️  FLAGGED SESSIONS                   │  │
│  │                                        │  │
│  │  ❗ 2 sessions AWAITING_SUMMARY        │  │
│  │     > 30 mins without summary          │  │
│  │     [View →]                           │  │
│  │                                        │  │
│  │  ❗ 1 session missing category         │  │
│  │     [View →]                           │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ RECENT ACTIVITY                        │  │
│  │ 09:02  John (Faculty)  Entry scan      │  │
│  │ 09:01  Admin (System)  Category updated│  │
│  │ 08:55  System          Auto-completed  │  │
│  │ 08:50  Jane (Faculty)  Student created │  │
│  │ [View Full Log →]                      │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### Quick Actions

| Action | Leads To |
|--------|----------|
| Manage Students | Student Management (S17) |
| Manage Faculty | Faculty Management (S18) |
| Manage Admins | Admin Management (S19) |
| Manage Categories | Category Management (S20) |
| All Sessions | Session Management (S21) |
| Reports | Reports (S24) |
| Activity Log | Activity Log (S23) |

### Key Metrics

| Metric | Source | Update |
|--------|--------|--------|
| Total students | GET /students (count) | On page load |
| Today's attendance | GET /reports/daily-summary | On page load |
| Current occupancy | GET /sessions/occupancy | Every 30s |
| Flagged sessions | GET /sessions?status=CREATED,ACTIVE (incomplete/uncategorized) | On page load |
| Users by status | GET /students, /faculty (aggregated) | On page load |

---

## Dashboard Design Rules

1. **Most important content is top-left.** Active session (Student), occupancy (Faculty), metrics (Admin) are in the position of highest visual priority.
2. **Information density increases with role.** Student dashboard is simple (1-2 widgets). Admin dashboard is dense (stats, tables, flags).
3. **Every widget has a defined empty state.** If a data source is empty or unavailable, the widget shows its empty state, not a blank block.
4. **Auto-refresh for time-sensitive data.** Occupancy count refreshes every 30 seconds. Flagged sessions refresh on page focus.
5. **Stat cards are skeleton-loadable.** Each stat card loads independently. Total Students can show while Today's Attendance is still loading.
6. **Action buttons are prominent.** Scan Entry/Exit on Faculty dashboard are the largest buttons. Quick actions are always visible without scrolling.

# Wireframes

Low-fidelity text-based wireframes for every screen.

---

## S1: Login

```
┌──────────────────────────────────────────┐
│  [App Logo]                              │
│                                          │
│          8Hour Workspace                 │
│          Attendance System               │
│                                          │
│  ┌─────────────────────────────────┐     │
│  │ Email                           │     │
│  │ [_____________________________] │     │
│  └─────────────────────────────────┘     │
│                                          │
│  ┌─────────────────────────────────┐     │
│  │ Password                        │     │
│  │ [_____________________________] │     │
│  └─────────────────────────────────┘     │
│                                          │
│  ┌─────────────────────────────────┐     │
│  │          Sign In                │     │
│  └─────────────────────────────────┘     │
│                                          │
│  [Forgot password?]                      │
│                                          │
│  "Faculty/Admin: Use your registered     │
│   email. Students: Use your roll number" │
└──────────────────────────────────────────┘
```

---

## S3: Student Dashboard

```
┌──────────────────────────────────────────┐
│  ← Dashboard           🔔 [3]   👤      │
├──────────────────────────────────────────┤
│  ┌────────────────────────────────────┐  │
│  │ ACTIVE SESSION                     │  │
│  │                                    │  │
│  │ Entry: 09:00 AM                    │  │
│  │ Duration: 2h 30m                   │  │
│  │ Status: CREATED                    │  │
│  │                                    │  │
│  │  [Select Category →]               │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ NOTIFICATIONS                      │  │
│  │                                    │  │
│  │ ● Entry recorded at 09:00 AM   2m  │  │
│  │ ○ Session completed yesterday  1d  │  │
│  │                                    │  │
│  │  [View All →]                      │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ RECENT SESSIONS                    │  │
│  │                                    │  │
│  │ Jul 21  Coding  09:00-12:00  3h   │  │
│  │ Jul 20  Design  10:00-13:30  3.5h │  │
│  │ Jul 19  Research 09:30-11:00  1.5h│  │
│  │                                    │  │
│  │  [View All →]                      │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
│  [Dashboard]  [Sessions]  [Profile]      │
└──────────────────────────────────────────┘
```

---

## S4: Category Selection

```
┌──────────────────────────────────────────┐
│  ← Select Category                       │
├──────────────────────────────────────────┤
│                                          │
│  Choose your work category for today:    │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 💻 Coding                          │  │
│  │ Software development work          │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 🎨 Design                          │  │
│  │ UI/UX and graphic design work      │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 📚 Research                        │  │
│  │ Technical research and study       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ⚙️ DevOps                          │  │
│  │ Infrastructure and deployment      │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Confirm Selection]                     │
└──────────────────────────────────────────┘
```

---

## S5: Summary Submission

```
┌──────────────────────────────────────────┐
│  ← Submit Summary                        │
├──────────────────────────────────────────┤
│                                          │
│  Session Summary                         │
│  ───────────────────────                 │
│  Category: Coding                        │
│  Entry: 09:00 AM                         │
│  Exit:  12:00 PM                         │
│  Duration: 3h 00m                        │
│                                          │
│  Describe what you worked on:            │
│  ┌──────────────────────────────────┐    │
│  │ [                              ] │    │
│  │ [                              ] │    │
│  │ [                              ] │    │
│  │ [                   0/2000 chars] │    │
│  └──────────────────────────────────┘    │
│                                          │
│  [Submit]          [Skip - Auto Complete]│
└──────────────────────────────────────────┘
```

---

## S6: Session History

```
┌──────────────────────────────────────────┐
│  ← My Sessions          🔍               │
├──────────────────────────────────────────┤
│                                          │
│  Filters: [Status ▼] [Category ▼]        │
│           [From: __]  [To: __]           │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Jul 22  Coding  09:00-12:00  ACTIVE│  │
│  │       3h 00m                       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Jul 21  Design  10:00-13:30  DONE │  │
│  │       3h 30m   Summary: ✓         │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Jul 20  Research 09:30-11:00  DONE │  │
│  │       1h 30m   Summary: ✓         │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [< Prev]  Page 1 of 5  [Next >]        │
└──────────────────────────────────────────┘
│  [Dashboard]  [Sessions]  [Profile]      │
└──────────────────────────────────────────┘
```

---

## S7: Session Detail

```
┌──────────────────────────────────────────┐
│  ← Session #42                           │
├──────────────────────────────────────────┤
│                                          │
│  Status: COMPLETED ✓                     │
│  Completion: NORMAL                      │
│                                          │
│  Student:  Alice Smith (STU001)          │
│  Category: Coding                        │
│                                          │
│  ─── Timeline ───                        │
│  09:00  Entry     by Dr. John            │
│  09:05  Category  Coding selected        │
│  12:00  Exit      by Dr. Jane            │
│  12:05  Summary   Submitted              │
│  12:05  Completed ✓                      │
│                                          │
│  Duration: 3h 00m                        │
│                                          │
│  Summary:                                │
│  "Worked on UI design for the            │
│   dashboard module. Implemented          │
│   responsive layout components."         │
│                                          │
└──────────────────────────────────────────┘
```

---

## S8: Notification List

```
┌──────────────────────────────────────────┐
│  ← Notifications       [Mark All Read]   │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ● Entry recorded at 09:00 AM   2m  │  │
│  │   You entered the workspace.       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ● Exit recorded at 17:30      1h  │  │
│  │   You exited the workspace.        │  │
│  │   Submit your summary →            │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ○ Session completed yesterday  1d  │  │
│  │   Your session was auto-completed. │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ○ Reminder: Submit summary   3d   │  │
│  │   Your summary is pending.         │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
│  [Dashboard]  [Sessions]  [Profile]      │
└──────────────────────────────────────────┘
```

---

## S9: Profile

```
┌──────────────────────────────────────────┐
│  ← Profile                               │
├──────────────────────────────────────────┤
│                                          │
│  👤 Alice Smith                          │
│     Student                              │
│                                          │
│  Name:     [Alice Smith            ]     │
│  Email:    [alice@example.com      ]     │
│  Roll:     STU001  (cannot change)       │
│  Status:   ENROLLED                      │
│  Enrolled: 15 Jan 2026                   │
│                                          │
│  Total Sessions: 45                      │
│  Total Hours:   89.5                     │
│                                          │
│  [Save Changes]                          │
└──────────────────────────────────────────┘
│  [Dashboard]  [Sessions]  [Profile]      │
└──────────────────────────────────────────┘
```

---

## S10: Faculty Dashboard

```
┌──────────────────────────────────────────┐
│  ← Dashboard                      👤     │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  WORKSPACE OCCUPANCY               │  │
│  │                                    │  │
│  │  15  students currently inside     │  │
│  │                                    │  │
│  │  Coding:   8                       │  │
│  │  Design:   4                       │  │
│  │  Research: 3                       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  [📷 Scan Entry]  [📷 Scan Exit]  │  │
│  │  [🔧 Manual Exit]                  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  RECENT SCANS                      │  │
│  │                                    │  │
│  │  09:02  Alice Smith     Entry ✓    │  │
│  │  09:01  Bob Johnson     Entry ✓    │  │
│  │  08:55  Carol White     Exit  ✓    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Dashboard]  [Scanner]  [Students] [R]  │
└──────────────────────────────────────────┘
```

---

## S11: Scanner

```
┌────────────────────────────────────────────┐
│  ← Scanner                                 │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │           [Camera View]              │  │
│  │                                      │  │
│  │    ┌───────────────────────┐         │  │
│  │    │                       │         │  │
│  │    │     Scanning...        │         │  │
│  │    │                       │         │  │
│  │    └───────────────────────┘         │  │
│  │                                      │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Mode: ● Entry    ○ Exit                   │
│  Format: ● QR Code    ○ Barcode            │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  [🔍 Manual Entry / Student Search]   │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  [Dashboard]  [Scanner]  [Students] [R]    │
└────────────────────────────────────────────┘
```

---

## S12: Scan Result

```
┌──────────────────────────────────────────┐
│  ← Scan Result                            │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  ✅  Entry Recorded                │  │
│  │                                    │  │
│  │  Student:  Alice Smith             │  │
│  │  Roll:     STU001                   │  │
│  │  Time:     09:00 AM                │  │
│  │  Status:   Session Active          │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Scan Next Student]                     │
│  [Back to Dashboard]                     │
└──────────────────────────────────────────┘

---

When error:

┌──────────────────────────────────────────┐
│  ← Scan Result                            │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  ❌  Entry Failed                   │  │
│  │                                    │  │
│  │  Student:  Alice Smith             │  │
│  │  Reason:   Student already has     │  │
│  │            an active session        │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Try Again]                             │
│  [Back to Dashboard]                     │
└──────────────────────────────────────────┘
```

---

## S13: Manual Exit

```
┌──────────────────────────────────────────┐
│  ← Manual Exit                           │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Search Student:                    │  │
│  │  [___________________________][🔍]  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Student: Alice Smith (STU001)           │
│  Session: 09:00 AM - present (ACTIVE)    │
│  Duration: 2h 30m                        │
│                                          │
│  Category (if not set):                  │
│  [Select Category ▼]                     │
│                                          │
│  Reason for manual exit:                 │
│  ┌──────────────────────────────────┐    │
│  │ [                              ] │    │
│  │ [               0/500 chars]    │    │
│  └──────────────────────────────────┘    │
│                                          │
│  [Confirm Manual Exit]                   │
└──────────────────────────────────────────┘
```

---

## S15 / S24: Reports

```
┌──────────────────────────────────────────┐
│  ← Reports                               │
├──────────────────────────────────────────┤
│                                          │
│  Report Type: [Daily ▼]                  │
│  Date: [2026-07-22]                      │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  DAILY SUMMARY - 22 Jul 2026       │  │
│  │                                    │  │
│  │  Total Students:  150              │  │
│  │  Present Today:   45               │  │
│  │  Avg Duration:    3h 00m           │  │
│  │                                    │  │
│  │  ─── By Category ───              │  │
│  │  Coding:   20 students  3h 20m avg │  │
│  │  Design:   15 students  2h 40m avg │  │
│  │  Research: 10 students  3h 00m avg │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Download CSV] (future)                 │
└──────────────────────────────────────────┘
│  [Dashboard]  [Scanner]  [Students] [R]  │
└──────────────────────────────────────────┘
```

---

## S16: Admin Dashboard

```
┌──────────────────────────────────────────┐
│  ← Dashboard                      👤     │
├──────────────────────────────────────────┤
│                                          │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐              │
│  │150│ │45 │ │ 15│ │ 3 │              │
│  │Stu│ │Tdy│ │Now│ │Flg│              │
│  └───┘ └───┘ └───┘ └───┘              │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  QUICK ACTIONS                     │  │
│  │  [Students] [Faculty] [Categories]  │  │
│  │  [Sessions] [Reports] [Activity]   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  FLAGGED SESSIONS                  │  │
│  │                                    │  │
│  │  ❗ 2 sessions in AWAITING_SUMMARY │  │
│  │     > 30 mins without summary      │  │
│  │  ❗ 1 session lacks category       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  RECENT ACTIVITY                   │  │
│  │  09:02  John (Faculty) entry scan  │  │
│  │  09:01  Admin updated category     │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
│[DS] [Stu] [Fac] [Adm] [Cat] [Ses] [Rep] │
└──────────────────────────────────────────┘
```

---

## S17 / S18 / S19: User Management

```
┌──────────────────────────────────────────┐
│  ← Students                      [+ Add] │
├──────────────────────────────────────────┤
│                                          │
│  Search: [___________________][🔍]       │
│  Filter: [All Status ▼]                  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Alice Smith    STU001  ENROLLED    │  │
│  │ alice@example.com        22 Jul   │  │
│  ├────────────────────────────────────┤  │
│  │ Bob Johnson     STU002  SUSPENDED  │  │
│  │ bob@example.com           22 Jul   │  │
│  ├────────────────────────────────────┤  │
│  │ Carol White     STU003  ENROLLED   │  │
│  │ carol@example.com         21 Jul   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [< Prev]  Page 1 of 8  [Next >]         │
└──────────────────────────────────────────┘
│[DS] [Stu] [Fac] [Adm] [Cat] [Ses] [Rep] │
└──────────────────────────────────────────┘
```

---

## S20: Category Management

```
┌──────────────────────────────────────────┐
│  ← Categories                   [+ Add]  │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Coding           ACTIVE   120 uses │  │
│  │ Software development work          │  │
│  │ [Edit] [Archive]                   │  │
│  ├────────────────────────────────────┤  │
│  │ Design           ACTIVE    85 uses │  │
│  │ UI/UX and graphic design           │  │
│  │ [Edit] [Archive]                   │  │
│  ├────────────────────────────────────┤  │
│  │ DevOps           ACTIVE    12 uses │  │
│  │ Infrastructure work                │  │
│  │ [Edit] [Archive]                   │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
│[DS] [Stu] [Fac] [Adm] [Cat] [Ses] [Rep] │
└──────────────────────────────────────────┘
```

---

## S21: Session Management (Admin)

```
┌──────────────────────────────────────────┐
│  ← Sessions                              │
├──────────────────────────────────────────┤
│                                          │
│  Filters: [Status ▼] [Category ▼]        │
│           [Date From] [Date To]          │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ #42 Alice     Coding  09-12  DONE  │  │
│  │ STU001        Dr. John  3h        │  │
│  ├────────────────────────────────────┤  │
│  │ #41 Bob       Design  09-11  DONE  │  │
│  │ STU002        Dr. Jane  2h        │  │
│  ├────────────────────────────────────┤  │
│  │ #40 Carol     —       09-   ACTIVE │  │
│  │ STU003        Dr. John  30m       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [< Prev]  Page 1 of 15  [Next >]        │
└──────────────────────────────────────────┘
│[DS] [Stu] [Fac] [Adm] [Cat] [Ses] [Rep] │
└──────────────────────────────────────────┘
```

---

## S22: Session Detail (Admin)

```
┌──────────────────────────────────────────┐
│  ← Session #42                           │
├──────────────────────────────────────────┤
│                                          │
│  Status: COMPLETED ✓                     │
│  Completion: NORMAL                      │
│                                          │
│  Student:   Alice Smith (STU001)         │
│  Entry:     09:00 by Dr. John            │
│  Exit:      12:00 by Dr. Jane            │
│  Category:  Coding                       │
│  Duration:  3h 00m                       │
│                                          │
│  Summary:                                │
│  "Worked on UI design..."                │
│                                          │
│  ═══════════════════════════════════════ │
│  ADMIN ACTIONS                           │
│                                          │
│  [Override Session]  [Archive Session]   │
│                                          │
│  ─── Activity Log ───                   │
│  12:05 System  Summary Submitted         │
│  12:00 Dr.Jane Exit Recorded             │
│  09:05 System  Category Selected         │
│  09:00 Dr.John Entry Recorded           │
└──────────────────────────────────────────┘
│[DS] [Stu] [Fac] [Adm] [Cat] [Ses] [Rep] │
└──────────────────────────────────────────┘
```

---

## S25: Loading

```
┌──────────────────────────────────────────┐
│                                          │
│                                          │
│              ⟳ Loading...                │
│                                          │
│         [Skeleton placeholders]          │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  │
│  └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

---

## S26: Offline

```
┌──────────────────────────────────────────┐
│                                          │
│              📡 No Connection            │
│                                          │
│  You appear to be offline.               │
│  Some features may be unavailable.       │
│                                          │
│  [Try Again]                             │
│                                          │
│  Cached content may still be viewable.   │
└──────────────────────────────────────────┘
```

---

## S27: Page Not Found

```
┌──────────────────────────────────────────┐
│                                          │
│              404                         │
│         Page Not Found                   │
│                                          │
│  The page you're looking for doesn't     │
│  exist or was moved.                     │
│                                          │
│  [Go to Dashboard]                       │
│                                          │
└──────────────────────────────────────────┘
```

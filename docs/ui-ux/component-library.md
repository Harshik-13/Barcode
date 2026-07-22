# Component Library

---

## C1: Button

| Variant | Usage |
|---------|-------|
| Primary | Main action on screen (submit, confirm, save) |
| Secondary | Alternative action (cancel, back, skip) |
| Destructive | Irreversible action (delete-equivalent, suspend, deactivate) |
| Ghost | Low-emphasis action (view, edit) |
| Icon-only | Tools with recognizable icon (scan, search, add) |

**States:** default, hover, active, disabled, loading

**Usage rules:**
- One primary button per screen
- Destructive buttons require confirmation dialog
- Loading state shows spinner, disables interaction

---

## C2: Card

**Purpose:** Group related content in a contained block

**Variants:**
| Variant | Usage |
|---------|-------|
| Default | Dashboard widgets, session summaries |
| Clickable | Session list items (tappable → detail) |
| Status | Active session card with status indicator |
| Stat | Metric display (count + label) |

**Usage rules:**
- Cards in lists are tappable
- Status cards have a colored left border based on status

---

## C3: Table

**Purpose:** Display structured data in rows and columns

**Variants:**
| Variant | Usage |
|---------|-------|
| Default | User lists, session lists |
| Compact | Reports with dense data |
| Sortable | Column headers with sort indicators |

**Usage rules:**
- Each row must have a distinct tap target
- Tables use horizontal scrolling on mobile

---

## C4: Form Input

**Purpose:** Capture user input

| Variant | Usage |
|---------|-------|
| Text | Single-line input (name, email) |
| Textarea | Multi-line input (summary, reason) |
| Select | Dropdown (category, status filter) |
| Search | Text input with search icon and clear button |

**States:** default, focused, filled, error, disabled

**Usage rules:**
- Error state shows inline message below input
- Character count shown for textarea
- Labels are always visible (not placeholder)

---

## C5: Search Bar

**Purpose:** Filter a list by text

**Variants:**
| Variant | Usage |
|---------|-------|
| Inline | Embedded in list screen header |
| Full-screen | Scanner manual entry, student search |

**States:** empty, typing, no results, results

**Usage rules:**
- Placeholder text describes what is searched
- Clear button appears when text is entered
- Debounce input by 300ms before triggering search

---

## C6: Navigation

**Purpose:** Provide screen-to-screen navigation

| Variant | Usage |
|---------|-------|
| Sidebar | Admin desktop navigation |
| Bottom tab | Student and faculty mobile navigation |
| Top bar | Current screen title + back + actions |
| Breadcrumb | Drill-down context (List > Item > Detail) |

**Usage rules:**
- Active tab/section is highlighted
- Bottom tabs show only on mobile, sidebar only on desktop
- Top bar always shows current screen name

---

## C7: Dialog

**Purpose:** Require user confirmation or attention

| Variant | Usage |
|---------|-------|
| Confirm | "Are you sure?" before destructive action |
| Alert | Critical information ("Session expired") |
| Prompt | Input required before proceeding (override reason) |
| Informational | Non-blocking information ("Session completed") |

**States:** open, closed

**Usage rules:**
- Dialogs are modal (block background interaction)
- Escape key dismisses non-destructive dialogs
- Destructive confirmations have red action button

---

## C8: Notification

**Purpose:** Display real-time system notifications

| Variant | Usage |
|---------|-------|
| In-app toast | Temporary notification at top of screen (3s auto-dismiss) |
| Inline | Notification item in list |
| Badge | Unread count on bell icon |

**Types:** entry, exit, reminder
**Priority:** high (reminder), normal (entry/exit)

**Usage rules:**
- Toasts auto-dismiss after 3 seconds
- Badge updates via polling every 30 seconds

---

## C9: Badge

**Purpose:** Label status or count

| Variant | Usage |
|---------|-------|
| Status | Session status (ACTIVE, COMPLETED, ARCHIVED) |
| Count | Unread notifications |
| Role | Student, Faculty, Admin label |

**Color mapping:**
| Status | Color |
|--------|-------|
| ENROLLED / ACTIVE | Green |
| SUSPENDED | Orange |
| COMPLETED | Blue |
| DEPARTED / ARCHIVED | Gray |

**Usage rules:**
- Status badges are not interactive
- Count badges are positioned on top-right of icon

---

## C10: List

**Purpose:** Display a collection of items

**Variants:**
| Variant | Usage |
|---------|-------|
| Plain | Simple list of text items (categories) |
| Rich | Items with icon, title, subtitle, metadata (sessions) |
| Action | Items with trailing action button (notification dismiss) |

**Usage rules:**
- Lists with clickable items show a right-chevron indicator
- Empty list shows corresponding empty state component

---

## C11: Avatar

**Purpose:** Display user identity

**Variants:**
| Variant | Usage |
|---------|-------|
| Initials | User initials on colored background |
| Icon | Generic user icon (when no initials) |

**Sizes:** small (24px), medium (32px), large (48px)

---

## C12: Status Indicator

**Purpose:** Show entity lifecycle status

**Variants:**
| Variant | Usage |
|---------|-------|
| Dot | Small colored circle (inline with text) |
| Bar | Colored left border on card |
| Label | Full text badge (ACTIVE, SUSPENDED, etc.) |

**Usage rules:**
- Status indicators use consistent color mapping across all screens
- Status text follows database enum values

---

## C13: Timeline

**Purpose:** Display chronological sequence of events

**Usage:** Session detail (entry → category → exit → summary)

**Structure:**
```
● 09:00  Entry recorded        by Dr. John
● 09:05  Category selected     Coding
● 12:00  Exit recorded         by Dr. Jane
● 12:05  Summary submitted
● 12:05  Completed             NORMAL
```

**Usage rules:**
- Each event has a timestamp, description, and optional actor
- Events are ordered chronologically (oldest at top)
- Current status is highlighted

---

## C14: Skeleton

**Purpose:** Indicate loading content

**Variants:**
| Variant | Usage |
|---------|-------|
| Text | Pulsing gray bars for text lines |
| Card | Pulsing card-shaped placeholder |
| Table | Row-by-row skeleton for data tables |

**Usage rules:**
- Skeleton matches the layout of the final content
- Used on first load, not on refresh

---

## Component Inventory

| # | Component | Screens Used On |
|---|-----------|----------------|
| C1 | Button | All screens |
| C2 | Card | S3, S10, S16 |
| C3 | Table | S6, S17, S18, S19, S21, S23 |
| C4 | Form Input | S1, S5, S9, S13, S17-S20 |
| C5 | Search Bar | S13, S14, S17, S18, S19, S21 |
| C6 | Navigation | All screens |
| C7 | Dialog | S4, S13, S22 |
| C8 | Notification | S3, S8 |
| C9 | Badge | S3, S8, S10, S16 |
| C10 | List | S4, S8, S20 |
| C11 | Avatar | S9, S14, S17, S18 |
| C12 | Status Indicator | S3, S6, S7, S10, S16, S21, S22 |
| C13 | Timeline | S7, S22 |
| C14 | Skeleton | S25 |

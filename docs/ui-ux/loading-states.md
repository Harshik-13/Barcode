# Loading States

---

## Page Loading

**When:** Initial navigation to a screen

| Screen | Loading Pattern | Duration Expectation |
|--------|----------------|---------------------|
| Student Dashboard | Skeleton cards (3) | < 2s |
| Faculty Dashboard | Skeleton cards (3) | < 2s |
| Admin Dashboard | Skeleton stat cards + skeleton list | < 3s |
| Session History | Skeleton list (5 rows) | < 2s |
| Notification List | Skeleton list (4 rows) | < 1.5s |
| Student Management | Skeleton table (10 rows) | < 2s |
| Faculty Management | Skeleton table (10 rows) | < 2s |
| Session Management | Skeleton table (10 rows) | < 2s |
| Activity Log | Skeleton table (10 rows) | < 2s |
| Reports | Skeleton stats + skeleton chart area | < 3s |
| Category Selection | Skeleton card list (4 items) | < 1.5s |

**Pattern:** Skeleton placeholders matching final layout dimensions. Show immediately on navigation start. Transition to content with fade-in (200ms).

---

## Form Submission

**When:** User submits a form (create, edit, login)

| Form | Loading Indicator | Behavior |
|------|-------------------|----------|
| Login | Submit button shows spinner, text changes to "Signing in..." | Button disabled |
| Create/Edit student | Submit button shows spinner, text changes to "Saving..." | Button disabled |
| Summary submission | Submit button shows spinner, text changes to "Submitting..." | Button disabled |
| Manual exit | Confirm button shows spinner | Button disabled |
| Override | Confirm button shows spinner | Button disabled |
| Category create | Submit button shows spinner | Button disabled |

**Pattern:** Button enters loading state. All form fields become read-only during submission. If submission takes > 3s, show a subtle "Still working..." message below the button.

---

## Dashboard Loading

**When:** Dashboard screens load multiple data sources

**Pattern:** Progressive loading — each widget loads independently as its data arrives.

**Student Dashboard load order:**
1. Active session (critical — renders immediately)
2. Notification count (shown within 1s)
3. Notifications list
4. Recent sessions (lowest priority)

**Faculty Dashboard load order:**
1. Occupancy count (critical — renders immediately)
2. Action buttons (always visible, no load required)
3. Recent scans
4. Category breakdown

**Admin Dashboard load order:**
1. Stat cards (renders as each loads)
2. Flagged sessions
3. Recent activity

---

## Report Loading

**When:** Report generation with date range or filter parameters

**Pattern:** Progress bar + status message

**Steps:**
1. User clicks "Generate" → button shows spinner
2. Screen shows: "Generating report..."
3. If > 5s: Update to "Aggregating session data..."
4. If > 10s: Update to "Almost done..."
5. On completion: Transition to report view (fade in 200ms)

**Optimistic behavior:** Show skeleton of report structure immediately (headers, empty chart areas). Fill in data progressively.

---

## Background Synchronization

**When:** Non-blocking data refresh

**Pattern:** Subtle indicator, no user interruption

| Scenario | Indicator | Location |
|----------|-----------|----------|
| Notification polling | None (silent) | Background |
| Occupancy count refresh | Spinner overlay on count number | Occupancy card |
| Session status refresh | Spinner on status badge | Active session card |

**Rules:**
- Background sync never shows a full-screen loading state
- Sync indicator is subtle (small spinner, 12px)
- If sync fails, data remains as-is (no stale update)
- User can always act on currently displayed data

---

## Loading Rules

1. **Show loading state immediately.** Never show a blank screen while waiting for data. Show skeleton or spinner within 100ms of navigation.
2. **Loading is cancellable.** If the user navigates away during loading, cancel in-flight requests.
3. **Timeout handling.** If a request takes > 30 seconds, show a timeout error with retry option.
4. **No loading spinners on cached data.** If data is available in local cache, show it immediately and silently refresh in the background.
5. **Skeleton over spinner.** Prefer skeleton placeholders over spinning indicators for page-level loading. Skeletons set layout expectations and reduce perceived wait time.
6. **Button loading preserves state.** Loading state on a button does not change the button width. Text expands inward, not outward.
7. **Testing.** Loading states must be testable by simulating slow network conditions (Slow 3G in DevTools).

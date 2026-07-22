# Empty States

---

## E1: No Sessions

**Screen:** Student Dashboard — Active Session Card

```
┌──────────────────────────────────────────┐
│                                          │
│     📋  No Active Session                │
│                                          │
│     Ask a faculty member to scan         │
│     your ID to start a work session.     │
│                                          │
└──────────────────────────────────────────┘
```

**Icon:** Clipboard icon
**Visual elements:** Centered content card, muted colors
**Action:** None (passive — scanning initiated by faculty)

---

## E2: No Notifications

**Screen:** Notification List (S8)

```
┌──────────────────────────────────────────┐
│                                          │
│     🔔  No Notifications                 │
│                                          │
│     You're all caught up!                │
│     Notifications about your sessions    │
│     will appear here.                    │
│                                          │
└──────────────────────────────────────────┘
```

**Icon:** Bell icon
**Visual elements:** Centered content, muted colors
**Action:** "Back to Dashboard" button

---

## E3: No Reports

**Screen:** Reports (S15 / S24)

```
┌──────────────────────────────────────────┐
│                                          │
│     📊  No Data Available                │
│                                          │
│     No sessions found for the selected   │
│     filters. Try adjusting the date      │
│     range or clearing filters.           │
│                                          │
│     [Clear Filters]                      │
│                                          │
└──────────────────────────────────────────┘
```

**Icon:** Chart icon
**Visual elements:** Centered content, muted colors
**Action:** "Clear Filters" button (resets all filter parameters)

---

## E4: No Search Results

**Screen:** Any search screen (Student Search, Session Filter)

```
┌──────────────────────────────────────────┐
│                                          │
│     🔍  No Results Found                 │
│                                          │
│     No {entity} matching "{query}"       │
│     Try a different search term.         │
│                                          │
└──────────────────────────────────────────┘
```

**Icon:** Search icon (or magnifying glass)
**Visual elements:** Centered content, muted colors
**Action:** Clear search text (X button in search bar)

**Entity-specific messages:**
| Context | Message |
|---------|---------|
| Student search | 'No students matching "xyz"' |
| Faculty search | 'No faculty matching "xyz"' |
| Session filter | 'No sessions matching your filters' |
| Category search | 'No categories matching "xyz"' |

---

## E5: No Categories

**Screen:** Category Selection (S4)

```
┌──────────────────────────────────────────┐
│                                          │
│     📂  No Categories Available          │
│                                          │
│     No work categories have been set     │
│     up yet. Please contact an admin.     │
│                                          │
│     [Back to Dashboard]                  │
│                                          │
└──────────────────────────────────────────┘
```

**Icon:** Folder icon
**Visual elements:** Centered content, muted colors
**Action:** "Back to Dashboard" button

---

## E6: No Faculty

**Screen:** Faculty Management (S18)

```
┌──────────────────────────────────────────┐
│                                          │
│     👤  No Faculty Found                │
│                                          │
│     No faculty accounts exist yet.       │
│     Add the first faculty member.        │
│                                          │
│     [+ Add Faculty]                      │
│                                          │
└──────────────────────────────────────────┘
```

**Icon:** User icon
**Visual elements:** Centered content, muted colors
**Action:** "Add Faculty" button (admin only)

---

## E7: No Students

**Screen:** Student Management (S17)

```
┌──────────────────────────────────────────┐
│                                          │
│     👤  No Students Found                │
│                                          │
│     No students have been enrolled yet.  │
│     Add the first student.               │
│                                          │
│     [+ Add Student]                      │
│                                          │
└──────────────────────────────────────────┘
```

**Icon:** User icon
**Visual elements:** Centered content, muted colors
**Action:** "Add Student" button (admin only)

---

## E8: No Activity Log

**Screen:** Activity Log (S23)

```
┌──────────────────────────────────────────┐
│                                          │
│     📝  No Activity                      │
│                                          │
│     No activity matches the current      │
│     filters. Try adjusting the date      │
│     range or clearing filters.           │
│                                          │
│     [Clear Filters]                      │
│                                          │
└──────────────────────────────────────────┘
```

**Icon:** Document icon
**Visual elements:** Centered content, muted colors
**Action:** "Clear Filters" button

---

## Empty State Rules

1. **Every screen without data shows an empty state.** Never show a blank screen or an empty list with no explanation.
2. **Empty states are informative.** They tell the user why the content is missing (no sessions yet, no matching filters, no data available).
3. **Empty states provide a path forward.** Either a suggested action button (Add, Clear Filters, Back) or an explanation of how the data gets there (e.g., "Ask a faculty member to scan your ID").
4. **Empty states are consistent.** All empty states follow the same layout: centered icon → title → description → optional action button.
5. **No technical jargon.** Empty states use plain language. No error codes, no database terminology.
6. **Role-appropriate actions.** An admin empty state shows admin actions (Add Student). A student empty state shows informational content (Ask faculty to scan).

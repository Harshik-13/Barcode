# UX Guidelines

---

## Navigation Consistency

1. **Back is always top-left.** Every detail screen has a back button (←) in the top-left corner. Tapping it returns to the previous screen.
2. **Top bar shows current screen name.** Every screen has a clear, concise title in the top bar.
3. **Navigation is role-specific.** Users only see navigation items relevant to their role. No empty sections or disabled links for unavailable features.
4. **Active navigation is highlighted.** The current section is visually distinct in the navigation (bold, colored, or underlined).
5. **No deep nesting.** Maximum navigation depth is 3 levels: List → Detail → Action. Users should never navigate deeper.
6. **External links open in new tab.** Any link to external resources opens in a new browser tab.

---

## Form Behavior

1. **Labels are always visible.** Placeholder text is not a substitute for labels. Every form input has a visible label above the field.
2. **Required fields are marked.** Required fields have a `*` after the label. Optional fields are explicitly marked with "(optional)".
3. **Single column layout.** Forms use a single column layout (fields stack vertically). Multi-column forms are not used in V1.
4. **Submit at the bottom.** Form submission button is at the bottom of the form, not at the top.
5. **Preserve input on error.** When a form submission fails, all entered values are preserved. No fields are cleared.
6. **Auto-focus first field.** When a form screen opens, the first input field receives focus automatically.
7. **Tab through fields.** Pressing Tab moves to the next field. Shift+Tab moves to the previous field. Tab order follows visual order.
8. **Enter submits.** Pressing Enter in any text field submits the form (unless the field is a textarea).

---

## Confirmation Dialogs

1. **Destructive actions need confirmation.** Any action that is irreversible or has significant consequences requires a confirmation dialog.
2. **Dialog shows what will happen.** The dialog clearly describes the consequence of the action. "Suspend Alice Smith" not "Confirm."
3. **Cancel is the default.** The Cancel button is always on the left (or primary position). The action button is on the right.
4. **Destructive confirmation uses red.** Irreversible actions (depart, deactivate, archive) use a red confirmation button.
5. **No confirmation for reversible actions.** Editing a name, updating a description, or marking a notification as read does not require confirmation.

---

## Destructive Actions

| Action | Irreversible? | Confirmation Required? | Special UX |
|--------|---------------|----------------------|------------|
| Depart student | Yes | Yes | Red button, "This action is irreversible" |
| Deactivate faculty | Yes | Yes | Red button, "This action is irreversible" |
| Deactivate admin | Yes | Yes | Red button, "This action is irreversible" |
| Archive category | No (but visible impact) | Yes | Warning about impact on future sessions |
| Suspend student | No (reversible) | Yes | Warning about impact on sessions |
| Override session | No (historical) | Yes | Reason required, logged for audit |
| Manual exit | No (historical) | Yes | Reason required |

---

## Search Behavior

1. **Debounce search input.** Search triggers 300ms after the user stops typing.
2. **Minimum 2 characters.** Search is not triggered until at least 2 characters are entered.
3. **Search results replace list.** When search is active, the full list is replaced by search results. Clearing search restores the full list.
4. **No results state.** If search returns no results, show the empty search state (E4) rather than an empty list.
5. **Clear button.** A visible "X" button in the search field clears the search text and restores the full list.
6. **Search is case-insensitive.** Searching "alice" finds "Alice", "ALICE", and "alice".

---

## Filtering Behavior

1. **Active filters are visible.** Applied filters are shown as tags or chips above the filtered list, each with a dismiss button.
2. **Clear all.** A "Clear All Filters" option removes all active filters at once.
3. **Filters are AND-combined.** Multiple active filters narrow results (status=COMPLETED AND category=Coding).
4. **Filter state persists.** Filters remain applied when navigating to a detail screen and back to the list.
5. **Default date ranges.** Report date ranges default to the current week (Mon-Sun) when no range is specified.

---

## Accessibility Consistency

1. **All interactive elements are keyboard accessible.** Every button, link, form control, and custom widget can be reached and activated via keyboard.
2. **Error messages use role="alert".** Dynamic error messages are announced by screen readers.
3. **Status changes are announced.** When content updates dynamically (new notification, session status change), a live region announces the change.
4. **Focus is managed.** After navigation, focus moves to the main heading. After dialog close, focus returns to the trigger element.
5. **Skip to content.** Every screen has a "Skip to main content" link as the first focusable element.

---

## Error Messaging

1. **Plain language.** Error messages use language the user understands. No error codes, no technical terms, no abbreviations.
2. **Actionable.** Every error message tells the user what to do next. "Check your email and password" not "Authentication failed."
3. **Specific.** "Summary must be at least 10 characters" not "Invalid input."
4. **Dismissible.** Non-critical error notifications can be dismissed without fixing the issue.
5. **Not dismissible.** Critical errors (session expired, no permission) cannot be dismissed until resolved.

---

## Global UX Rules

1. **One action per screen.** Each screen has one primary action. Screens do not compete for the user's attention with multiple equally prominent actions.
2. **Data freshness.** Time-sensitive data (occupancy, session status) auto-refreshes via polling. Historical data (session history, reports) loads fresh on navigation.
3. **Optimistic updates.** Marking a notification as read is optimistic (UI updates immediately, API call in background). Revert on failure.
4. **Loading is not a state.** Loading is a transient state. After loading, the screen shows either data or an error/empty state.
5. **No surprise navigation.** Navigation only happens when the user explicitly taps a navigation element. No automatic redirects except for session expiry.
6. **Session awareness.** If a student has an active session, it is shown on every screen they visit (persistent bar at top). The student should never wonder if they are "inside" or not.
7. **Faculty scanning efficiency.** The Scanner screen is designed for rapid scanning. Success/error results are shown briefly, and the scanner is immediately ready for the next scan. Faculty should be able to scan 1 student/second in optimal conditions. Scan format switching (QR/Barcode) should not add friction — the toggle is accessible without leaving the camera view.

---

## PWA Guidelines

1. **Install prompt is non-blocking.** The PWA install prompt appears once per session and can be dismissed. The user can access "Install App" from the navigation menu at any time.
2. **Service worker lifecycle.** Register the service worker on login. Unregister on logout. Cache static assets on first load.
3. **Offline behavior.** The application shows the offline state (S26) when the network is unavailable. Cached content (dashboard, session history) remains viewable. Scanner requires network connectivity (scans create server-side sessions).
4. **Display modes.** The application must function correctly in both browser tab and standalone (installed PWA) display modes. In standalone mode, navigation must be self-contained (no browser chrome dependencies).
5. **Theme and icons.** Provide a web app manifest with app name, icons (192px and 512px), theme color, and background color. The manifest must be linked from the HTML `<head>`.

---

## Scanner Mode Guidelines

1. **Dual format support.** The Scanner screen supports both QR Code and 1D Barcode scanning. The user selects the active format via a toggle on the scanner screen.
2. **Format independence.** The scan format is completely independent of attendance business logic. The decoded value (student identifier) is treated identically regardless of format.
3. **Mode persistence.** The selected scan format persists until explicitly changed by the user. It does not reset on navigation, session change, or page reload.
4. **Format switching.** Switching between QR Code and Barcode does not require leaving the scanner screen and does not interrupt the scanning workflow.
5. **Extensibility.** The scanner architecture should accommodate future formats (Data Matrix, PDF417, Aztec) by adding a new format option. No business logic changes are required when adding a new scan format.
6. **Viewfinder adaptation.** The camera viewfinder overlay adjusts to the selected format: square for QR Code, horizontal strip for 1D Barcode. This provides visual guidance to the user.

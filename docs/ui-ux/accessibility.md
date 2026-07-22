# Accessibility

---

## Compliance Target

**WCAG 2.1 Level AA** for all screens.

---

## Keyboard Navigation

### Focusable Elements
All interactive elements must be keyboard-focusable:
- Links, buttons, form controls, custom interactive widgets
- Tab order follows visual order (left-to-right, top-to-bottom)

### Tab Order
1. Skip to content link (first focusable element)
2. Navigation items (top nav → sidebar → bottom tabs)
3. Page content in visual order
4. Form fields (top to bottom)
5. Action buttons (left to right)

### Keyboard Shortcuts (Desktop)

| Key | Action | Context |
|-----|--------|---------|
| Tab | Next focusable element | Global |
| Shift+Tab | Previous focusable element | Global |
| Enter/Space | Activate focused element | Global |
| Escape | Close dialog/modal | Dialog open |
| Ctrl+K | Focus search | List screens with search |

---

## Focus Management

- **Visible focus indicator:** All focusable elements show a 2px blue outline on focus. Never use `outline: none` without a replacement.
- **Skip to content:** The first focusable element on every screen is a "Skip to main content" link.
- **Focus trapping:** Dialogs and modals trap focus. Tab cycles within the dialog. Escape closes the dialog and returns focus to the trigger element.
- **Route changes:** Focus moves to the screen title or main heading after navigation.
- **Error focus:** When a form submission fails, focus moves to the first field with an error.

---

## Screen Reader Support

### Required ARIA

| Element | ARIA Attribute | Value |
|---------|---------------|-------|
| Navigation | role="navigation" + aria-label | "Main navigation" / "Student navigation" |
| Search | role="search" | — |
| Dialog | role="dialog" + aria-modal="true" + aria-labelledby | Dialog title ID |
| Alert | role="alert" | — |
| Status badge | aria-label | "Status: Active" |
| Notification count | aria-label | "3 unread notifications" |
| Progress | aria-busy="true" + aria-label | "Loading content" |
| Error message | role="alert" | — |
| Table | <caption> or aria-label | Table description |
| Icon button | aria-label | Action description, e.g., "Search students" |

### Screen Reader Announcements

| Event | Announcement |
|-------|-------------|
| Page loaded | "{Screen name} — 8Hour Workspace Attendance" |
| Navigation changed | "Navigated to {screen name}" |
| Error occurred | "{Error message}" (role="alert") |
| Loading | "Loading, please wait" |
| Loaded | "Content loaded" |
| Notification received | "New notification: {message}" |
| Session status changed | "Session status changed to {status}" |
| Form submitted | "Form submitted successfully" or "Form has {count} errors" |

---

## Color Contrast

| Requirement | Ratio | Elements |
|-------------|-------|----------|
| Normal text | 4.5:1 minimum | Body text, labels, captions |
| Large text (≥18px) | 3:1 minimum | H1-H3 headings, stat values |
| UI components | 3:1 minimum | Icon borders, focus indicators |
| Error/success indicators | 3:1 minimum (text inclusive) | Status badges, validation messages |

**Forbidden patterns:**
- Gray text on gray background
- Colored text on colored background without sufficient contrast
- Status indicated by color alone (always include text label)

---

## Touch Target Sizes

| Target | Minimum Size | Context |
|--------|--------------|---------|
| Buttons | 44px × 44px | All interactive buttons |
| Navigation tabs | 44px × 44px | Bottom tab items |
| List items | 44px minimum height | Clickable rows |
| Form inputs | 44px minimum height | Text inputs, selects |
| Checkboxes | 44px × 44px (including label area) | Form checkboxes |
| Close buttons | 44px × 44px | Dialog close buttons |

---

## Text Scaling

- Application supports browser zoom up to **200%** without loss of functionality or content.
- All font sizes are defined in relative units (rem), not absolute pixels.
- Layout does not break when text is scaled up to 200%.
- Content does not overflow containers at maximum zoom.
- No horizontal scroll introduced by text scaling.

---

## Semantic Structure

### Heading Hierarchy

- Every screen must have exactly one `<h1>` (screen title).
- Sections within a screen use `<h2>`.
- Subsections use `<h3>`.
- Headings must not skip levels (h1 → h2 → h3, never h1 → h3).

### Landmarks

| Landmark | Content | Screens |
|----------|---------|---------|
| `<header>` | Top bar (screen title, back, actions) | All |
| `<nav>` | Navigation (sidebar or bottom tabs) | All |
| `<main>` | Primary content area | All |
| `<aside>` | Secondary info panels | Detail screens |
| `<footer>` | — | Not used (bottom nav is nav, not footer) |

### Forms

- Every input must have a visible `<label>` (not placeholder as label).
- Related fields are grouped with `<fieldset>` and `<legend>`.
- Error messages are associated with their input via `aria-describedby`.
- Required fields are indicated with both visual (`*`) and programmatic (`required` attribute, `aria-required="true"`) indicators.

---

## Accessibility Rules

1. **No accessibility exceptions.** Every screen, including error screens and empty states, must meet all accessibility requirements.
2. **Test with real tools.** All screens must be tested with keyboard-only navigation and a screen reader (NVDA or VoiceOver) before release.
3. **No mouse-dependent interactions.** All functionality must be available via keyboard.
4. **No time-dependent interactions.** Auto-dismissing toasts must have a "pause on hover/focus" behavior.
5. **Reduce motion.** All animations respect the `prefers-reduced-motion` media query. When enabled, transitions are instant (0ms) or disabled.
6. **Clear language.** Error messages and instructions use plain language. No jargon, no technical error codes shown to users.
7. **Status announcements.** Dynamic content changes (loading complete, new notifications, status changes) are announced to screen readers via live regions (`aria-live="polite"`).

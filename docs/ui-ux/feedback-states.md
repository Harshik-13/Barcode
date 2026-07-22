# Feedback States

---

## Success

**Visual:** Green checkmark icon, green accent color
**Position:** Toast (top of screen, auto-dismiss 3s) or inline (below action)
**Content:** What was completed + optional detail

| Scenario | Message |
|----------|---------|
| Entry recorded | "Entry recorded for Alice Smith" |
| Exit recorded | "Exit recorded for Alice Smith" |
| Summary submitted | "Summary submitted successfully" |
| Category selected | "Category 'Coding' selected" |
| Manual exit completed | "Session completed (manual exit)" |
| Override applied | "Session overridden successfully" |
| Session archived | "Session archived" |
| Student created | "Student created successfully" |
| Faculty created | "Faculty created successfully" |
| User updated | "Profile updated" |
| Category created | "Category 'DevOps' created" |
| Status changed | "Student status updated to SUSPENDED" |
| Mark all read | "All notifications marked as read" |

**Behavior:** Toast slides in from top, auto-dismisses after 3 seconds. No user action required. If user hovers over toast, auto-dismiss timer pauses.

---

## Warning

**Visual:** Orange triangle icon, orange accent color
**Position:** Inline (below relevant section) or dialog (for decisions)
**Content:** What needs attention + suggested action

| Scenario | Message | Action |
|----------|---------|--------|
| Auto-complete imminent | "Summary not submitted. Session will auto-complete in 15 minutes" | Go to summary |
| Duplicate scan attempt | "Student already has an active session" | Dismiss |
| Session without category | "This session has no category. Please assign one." | Assign category |
| Active sessions warning | "This action affects 3 active sessions. Proceed?" | Confirm/cancel |
| Faculty not active | "This faculty account is not active. Scans are blocked." | View faculty |

**Behavior:** Warning stays visible until user dismisses or addresses the issue. Does not auto-dismiss.

---

## Information

**Visual:** Blue info icon, blue accent color
**Position:** Inline (above or below relevant section)
**Content:** Helpful contextual information

| Scenario | Message |
|----------|---------|
| Empty filter results | "No sessions match your filters. Try adjusting the date range." |
| First session | "Welcome! Ask a faculty member to scan your ID to begin." |
| Profile view | "Your roll number cannot be changed. Contact an admin for corrections." |
| Auto-complete note | "Sessions with exit recorded auto-complete after 30 minutes without a summary." |
| Manual exit note | "Use manual exit only when the student cannot scan out (e.g., forgot ID, device failure)." |
| Category archive note | "Archived categories remain visible in session history but cannot be selected for new sessions." |

**Behavior:** Information banners are dismissible (X button). They do not auto-dismiss.

---

## Confirmation

**Visual:** Dialog/modal with action buttons
**Position:** Centered modal overlay
**Content:** Description of what will happen + two action buttons

| Scenario | Dialog Title | Message | Buttons |
|----------|-------------|---------|---------|
| Category selection | "Confirm Category" | "Set 'Coding' as your work category for today?" | [Cancel] [Confirm] |
| Manual exit | "Confirm Manual Exit" | "This will complete Alice Smith's session. Reason: ..." | [Cancel] [Confirm] |
| Override session | "Override Session" | "This will mark session #42 as completed. Reason: ..." | [Cancel] [Confirm] |
| Suspend student | "Suspend Student" | "Alice Smith will be unable to start new sessions. Are you sure?" | [Cancel] [Suspend] |
| Depart student | "Depart Student" | "This action is irreversible. Alice Smith cannot return." | [Cancel] [Depart] |
| Archive category | "Archive Category" | "'DevOps' will no longer be available for new sessions. It remains in history." | [Cancel] [Archive] |
| Deactivate faculty | "Deactivate Faculty" | "This action is irreversible. Dr. John's account will be deactivated." | [Cancel] [Deactivate] |
| Discard changes | "Discard Changes?" | "You have unsaved changes. Discard?" | [Keep Editing] [Discard] |

**Behavior:** Modal overlay blocks background interaction. Escape key cancels. Confirm/destructive button is highlighted. On destructive actions, the confirm button uses red color.

---

## Progress

**Visual:** Progress bar or spinner with percentage/message
**Position:** Inline within card or section
**Content:** What is happening + progress indicator

| Scenario | Indicator | Message |
|----------|-----------|---------|
| Form submission | Spinner on submit button | "Saving..." |
| Dashboard load | Skeleton screen | "Loading dashboard..." |
| Report generation | Progress bar | "Generating report..." |
| Bulk operation | Progress bar | "Archiving 5 sessions..." |

**Behavior:** Progress indicator is shown until operation completes or fails. Button is disabled during loading. On failure, button re-enables and shows error.

---

## Validation

**Visual:** Red border on input field + inline error message below
**Position:** Directly below the invalid input
**Content:** What is wrong + how to fix it

| Field | Validation Message |
|-------|-------------------|
| Email (empty) | "Email is required" |
| Email (format) | "Enter a valid email address" |
| Password (short) | "Password must be at least 8 characters" |
| Summary (empty) | "Summary cannot be empty" |
| Summary (short) | "Summary must be at least 10 characters" |
| Summary (long) | "Summary must not exceed 2000 characters" |
| Name (empty) | "Name is required" |
| Name (short) | "Name must be at least 2 characters" |
| Roll (empty) | "Roll number is required" |
| Roll (duplicate) | "This roll number is already in use" |
| Manual exit reason (empty) | "Reason is required for manual exit" |
| Override reason (empty) | "Reason is required for override" |
| Date range (invalid) | "Start date must be before end date" |

**Validation behavior:**
- Real-time validation after field loses focus (blur)
- Full validation on form submission
- First error field receives focus
- Error messages use clear, specific language (not "Invalid input")

---

## Feedback Rules

1. **Every user action produces feedback.** No silent failures. No actions that appear to do nothing.
2. **Feedback is specific.** "Saved" is better than "Success." "Email is required" is better than "Invalid input."
3. **Feedback is immediate.** Visual feedback appears within 100ms of action.
4. **Feedback is dismissible.** Non-critical feedback can be dismissed by the user.
5. **Feedback does not block.** Only confirmations block interaction. Success and info toasts are non-blocking.
6. **Error feedback is actionable.** Every error message tells the user what to do next.
7. **Consistent positioning.** Validation errors appear below their field. Toast notifications appear at top. Dialogs appear centered.

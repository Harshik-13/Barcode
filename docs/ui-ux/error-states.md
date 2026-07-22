# Error States

---

## X1: Offline

**Screen:** Any screen when network is unavailable

```
┌──────────────────────────────────────────┐
│                                          │
│     📡  No Internet Connection           │
│                                          │
│     You appear to be offline.            │
│     Check your connection and try again. │
│                                          │
│     [Try Again]                          │
│                                          │
└──────────────────────────────────────────┘
```

**Behavior:**
- Detected via navigator.onLine + failed API requests
- Does not replace existing content (keeps cached data visible)
- Shows as overlay at bottom if cached content is available
- Shows as full screen if no cached content
- Auto-dismisses when connection is restored
- Pending requests are queued for retry

---

## X2: Unauthorized

**Screen:** Any screen when user is not authenticated

```
┌──────────────────────────────────────────┐
│                                          │
│     🔒  Session Expired                  │
│                                          │
│     Your session has expired.            │
│     Please sign in again.                │
│                                          │
│     [Sign In]                            │
│                                          │
└──────────────────────────────────────────┘
```

**Behavior:**
- Shown when API returns 401
- Clears stored token
- Redirects to Login screen after a 2s delay (or immediately on button click)
- Current page state is preserved in browser history (user can return after re-login)

---

## X3: Forbidden

**Screen:** Any screen when user lacks permission

```
┌──────────────────────────────────────────┐
│                                          │
│     🚫  Access Denied                    │
│                                          │
│     You don't have permission to         │
│     access this page or perform          │
│     this action.                         │
│                                          │
│     [Go to Dashboard]                    │
│                                          │
└──────────────────────────────────────────┘
```

**Behavior:**
- Shown when API returns 403
- Redirect button goes to role-appropriate Dashboard
- Logged for audit

---

## X4: Server Error

**Screen:** Any screen following a 500 error

```
┌──────────────────────────────────────────┐
│                                          │
│     ⚠️  Something Went Wrong             │
│                                          │
│     An unexpected error occurred.        │
│     Please try again. If the problem     │
│     persists, contact support.           │
│                                          │
│     [Try Again]    [Go to Dashboard]     │
│                                          │
└──────────────────────────────────────────┘
```

**Behavior:**
- Shown when API returns 500
- "Try Again" retries the failed request
- "Go to Dashboard" navigates to home
- Error is logged server-side with request ID
- Shown only after request timeout (30s) or instant 500

---

## X5: Validation Failure

**Screen:** Any form screen

**Visual:** Inline below each invalid field (see [Feedback States](feedback-states.md))

**Global form error (if validation cannot determine field):**
```
  ┌────────────────────────────────────┐
  │  ⚠️  Please fix the errors below   │
  └────────────────────────────────────┘
```

**Behavior:**
- Shown at top of form if multiple fields have errors
- First error field receives focus
- Form inputs retain entered values (not cleared)
- Submit button re-enables after failure

---

## X6: Session Expired During Flow

**Screen:** Scanner (S11), Summary Submission (S5), or Manual Exit (S13)

```
┌──────────────────────────────────────────┐
│                                          │
│     🔒  Session Expired                  │
│                                          │
│     Your session expired during this     │
│     operation. Please sign in again.     │
│                                          │
│     Your work has been saved locally.    │
│                                          │
│     [Sign In]                            │
│                                          │
└──────────────────────────────────────────┘
```

**Behavior:**
- For scanner: Scan queue is lost (not stored locally)
- For summary: Draft text is preserved in localStorage
- For manual exit: Form data is lost (requires re-entry)
- On re-login: Restore draft if available, navigate to appropriate screen

---

## X7: Scanner Unavailable

**Screen:** Scanner (S11)

```
┌──────────────────────────────────────────┐
│                                          │
│     📷  Camera Unavailable               │
│                                          │
│     Camera access was denied or is       │
│     not available on this device.        │
│                                          │
│     [Use Manual Entry]  [Go Back]        │
│                                          │
└──────────────────────────────────────────┘
```

**Behavior:**
- Shown when camera permission is denied or camera hardware is not found
- "Use Manual Entry" navigates to Student Search (S14)
- "Go Back" returns to Faculty Dashboard
- Error persists until camera permission is granted in browser settings

---

## X8: Rate Limited

**Screen:** Any screen when 429 is returned

```
┌──────────────────────────────────────────┐
│                                          │
│     ⏳  Too Many Requests                │
│                                          │
│     Please wait a moment before          │
│     trying again.                        │
│                                          │
│     [Try Again in {seconds}s]            │
│                                          │
└──────────────────────────────────────────┘
```

**Behavior:**
- Shows countdown timer (from Retry-After header)
- Button updates every second
- Auto-retry after countdown completes

---

## Error State Rules

1. **Errors are contextual.** An error on the Scanner shows scanner-specific recovery options. An error on a Form shows form-specific recovery. Generic errors only for truly unknown failures.
2. **Errors are recoverable.** Every error state provides a clear action to resolve or recover from the error. No dead-end error screens.
3. **Errors preserve work.** Form state, search queries, and draft content are preserved on error. The user does not lose their work.
4. **Errors are not scary.** Use plain language. No exclamation marks except for critical failures. No technical details unless the user requests them.
5. **No full-screen errors on partial failures.** If one widget on a dashboard fails, show the error only on that widget, not the entire page.
6. **Retry is idempotent.** Multiple retries of the same action produce the same result (no duplicate sessions, no duplicate notifications).

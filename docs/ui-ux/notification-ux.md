# Notification UX

---

## Notification Types

| Type | Trigger | Priority | Content Template |
|------|---------|----------|------------------|
| ENTRY | Faculty scans student entry | Normal | "Entry recorded at {time}" |
| EXIT | Faculty scans student exit | Normal | "Exit recorded at {time}. Submit your summary." |
| REMINDER | Grace period half-expired | High | "Reminder: Submit your work summary for session at {time}. Auto-completes in {X} minutes." |

---

## Delivery Mechanism — HTTP Polling

For MVP (Phase 6), notification delivery uses **HTTP polling** at a fixed interval.

| Attribute | Value |
|-----------|-------|
| Method | HTTP GET polling |
| Interval | 30 seconds |
| Endpoint | GET /notifications (list), GET /notifications/unread-count (badge) |
| Start | Begins automatically after successful login |
| Stop | Stops when user logs out |
| Recovery | Automatically retries after network failures with exponential backoff (1s, 2s, 4s, max 30s) |
| Workflow impact | Polling runs in background — never interrupts user workflows |

### Polling Lifecycle

```
Login ──► Start polling (30s interval)
            │
            ├─ Success ──► Update badge / notification list
            │                 └─ Continue polling
            │
            ├─ Network error ──► Retry with backoff
            │                       └─ Max 30s between retries
            │
            └─ Logout ──► Stop polling

Re-login ──► Start polling (30s interval)
```

### Polling Rules

1. **Background only.** Polling never shows a loading indicator. The badge count updates silently.
2. **No duplicate toasts.** If polling finds notifications that were already shown as toasts, they update the list but do not re-trigger the toast.
3. **Graceful degradation.** If polling fails repeatedly, the badge retains its last known count. The UI does not indicate that notifications are stale.
4. **Polling does not block UI.** All poll requests are non-blocking. The UI remains fully interactive during polling.

---

## Future Migration Path

The polling architecture is designed for future replacement. The notification service layer abstracts delivery so it can be swapped to:

- **WebSockets:** Persistent connection for real-time delivery
- **Server-Sent Events (SSE):** One-way event stream from server to client

Phase 6 implements polling only. No WebSocket or SSE code is written in MVP.

---

## In-App Notifications

### Delivery

| Method | Location | Duration | When |
|--------|----------|----------|------|
| Toast | Top of screen | 3 seconds, auto-dismiss | On new notification detected via poll |
| List item | Notification List | Persistent until read | On demand |
| Badge | Bell icon in nav | Until read count is 0 | Always visible, updated via poll |

### Toast Behavior

- Slides in from top of viewport
- Stays for 3 seconds, then slides out
- Hovering/focusing pauses auto-dismiss
- Tapping opens Notification List or relevant Session Detail
- Supports 1 notification at a time (queue if multiple arrive)

### Toast Content

```
┌──────────────────────────────────────────┐
│  🔔  Entry recorded for Alice Smith     │
│      at 09:00 AM                         │
└──────────────────────────────────────────┘
```

### Badge Behavior

- Shows number of unread notifications
- Updates every 30 seconds via GET /notifications/unread-count (polling)
- Clears when all notifications are read
- Positioned on top-right of bell icon in navigation
- Shows "99+" for counts > 99

---

## Push Notifications

**Not implemented in V1.** Push notifications are a future enhancement after MVP.

Future considerations:
- Service worker registration in PWA manifest (already required for offline caching)
- Push notification permission request (after login, with explanation)
- System notifications for REMINDER type

---

## Reminder Interactions

### Reminder Timing

| Event | Time Since Exit | Action |
|-------|----------------|--------|
| No reminder | 0-15 min | No action |
| First reminder | 15 min | Create REMINDER notification |
| Second reminder | 25 min | Create REMINDER notification (if still AWAITING_SUMMARY) |
| Auto-complete | 30 min | Session transitions to COMPLETED (AUTO_COMPLETED) |

### Reminder UX

**Student Dashboard — AWAITING_SUMMARY session:**

```
┌──────────────────────────────────────────┐
│  ⏰  REMINDER                            │
│                                          │
│  Your session at 09:00 AM (Coding)       │
│  is waiting for your summary.            │
│                                          │
│  Auto-completes in 15 minutes.           │
│                                          │
│  [Submit Summary →]                      │
└──────────────────────────────────────────┘
```

---

## Priority Levels

| Priority | Visual | Behavior |
|----------|--------|----------|
| High (REMINDER) | Red/orange accent, toast has alert icon | Toast stays 5 seconds, appears even during active scanning |
| Normal (ENTRY, EXIT) | Blue/info accent, standard icon | Toast stays 3 seconds, may queue behind high priority |

---

## Dismissal

| Method | Action | Scope |
|--------|--------|-------|
| Tap toast | Opens Notification List or Session | Single notification |
| Swipe toast | Dismiss (remains unread) | Single notification |
| Tap "Mark All Read" | POST /notifications/read-all | All notifications |
| Tap "X" on notification item | Marks as read | Single notification |
| Tap notification item | Opens related session + marks as read | Single notification |

---

## Notification History

- All notifications are stored in database (see [Data Model](../data-api/data-model.md))
- Accessible via Notification List screen
- Sorted by created_at descending (newest first)
- Filterable by read status
- Read notifications are visually muted (lower opacity or gray text)
- Notifications are never deleted (retained with student record)

---

## Notification Display Rules

1. **Unread priority.** Unread notifications appear first in the list, regardless of age.
2. **Grouped by session.** If multiple notifications belong to the same session, they show as a group with expand/collapse.
3. **Session link.** Tapping a notification navigates to the related Session Detail screen (if session_id is set).
4. **No duplicate reminders.** The system does not create a REMINDER notification if one already exists for the same session in the same grace period cycle.
5. **Offline queuing.** If the student is offline when a notification is created, it appears when they come online (notifications are stored server-side and fetched on next poll).
6. **Polling is transparent.** All notification delivery mechanics (polling, retries, backoff) are invisible to the user. The UI shows only notifications and badge counts.

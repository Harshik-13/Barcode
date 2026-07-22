# Scanner App - Offline Capabilities

## ✅ Yes, the Scanner Works Offline!

### Offline Features:

#### 1. **Hostel Authorization Check (Fully Offline)**
- All hostel rosters loaded into memory at startup
- BH1: ~982 students, GH1: ~949 students
- **O(1) lookup** - instant authorization check
- Works 100% offline, no network needed

#### 2. **QR Verification (Hybrid)**
- **Online mode** (preferred): Validates with backend API
- **Offline fallback**: Uses cached secrets from localStorage
  - Requires prior sync via "Sync Pending Logs" button
  - Verifies HMAC signature locally using Web Crypto API

#### 3. **Scan Logging (Background Sync)**
- All scans logged to IndexedDB immediately
- When online: Syncs logs to backend automatically
- When offline: Stores locally, syncs when connection returns
- Uses Background Sync API for automatic retry

#### 4. **Service Worker**
- Registered automatically on app load
- Handles background sync events
- Ensures no data loss even with intermittent connectivity

### Offline Workflow:

```
1. App starts → Load hostel rosters (BH1, GH1) into memory
2. Scan QR code
3. Check authorization (offline, instant)
   ├─ Not authorized → Show "Not Authorized" (no network needed)
   └─ Authorized → Proceed to verification
4. Try online verification
   ├─ Success → Show result
   └─ Fail (offline) → Use cached secrets
5. Log scan to IndexedDB
6. Background sync uploads when online
```

### New Feature: Hostel Selector Dropdown

- Switch between hostels without restarting app
- Shows student count for each hostel
- Selection saved to localStorage (persists across sessions)
- Displays:
  - BH1 - Boys Main Hostel (982 students)
  - GH1 - Girls Main Hostel (949 students)

### Memory Usage:

| Data | Size | Persistence |
|------|------|-------------|
| Hostel rosters | ~240 KB | RAM (reloaded on app start) |
| Cached secrets | ~10-50 KB | localStorage (persistent) |
| Scan logs | Varies | IndexedDB (persistent) |

### Requirements for Full Offline Mode:

1. ✅ Load app once while online (downloads JS/CSS)
2. ✅ Install as PWA (optional, but recommended)
3. ⚠️ Pre-sync secrets via "Sync Pending Logs" button (for QR verification)

### Limitations:

- Cannot fetch new student secrets while offline
- Cannot validate against latest backend rules while offline
- First-time app load requires internet connection
- Time-based QR codes require accurate device clock

### Network States:

| State | Authorization | QR Verification | Logging | Sync |
|-------|---------------|-----------------|---------|------|
| **Online** | ✅ RAM | ✅ Backend API | ✅ IndexedDB | ✅ Immediate |
| **Offline** | ✅ RAM | ⚠️ Cached only | ✅ IndexedDB | ⏳ Queued |
| **Intermittent** | ✅ RAM | ✅/⚠️ Fallback | ✅ IndexedDB | 🔄 Auto-retry |

### Testing Offline Mode:

1. Load the scanner app while online
2. Click "Sync Pending Logs" to cache secrets
3. Open DevTools → Network → Enable "Offline" throttling
4. Scan QR codes - should still work!
5. Re-enable network to see logs sync automatically

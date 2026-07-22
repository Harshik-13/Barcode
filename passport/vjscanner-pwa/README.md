# VJ Scanner PWA

Warden/security app for scanning and verifying student QR codes with online/offline support, meal tracking, and built‑in reporting.

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env values below, at minimum set VITE_API_BASE_URL
npm run dev
```

Open http://localhost:5173

## Authentication

The scanner supports two login methods:

1. **Google Sign-In** (for authorized college accounts)
2. **Custom Username/Password** (for hostel staff)

### Custom Accounts

Three scanner accounts are hardcoded with specific hostel permissions:

| Username | Password | Allowed Hostels | Role |
|----------|----------|----------------|------|
| boyshostel@gmail.com | vnrvjiet@123 | BH1, BH2, BH3, BH4 | boys |
| girlshostel@gmail.com | vnrvjiet@321 | GH1, GH2, GH3, GH4 | girls |
| adminhostel@gmail.com | vnrvjiet@999 | ALL | admin |

- **Boys/Girls hostel accounts**: Can only select from their assigned hostels
- **Admin account**: Can select any hostel
- **Google accounts**: Get access to all hostels

The hostel selector in the menu will automatically filter to show only allowed hostels based on the logged-in account.

## Required .env settings

- VITE_API_BASE_URL: Base URL of the API server (e.g., http://localhost:8080)
- VITE_HOSTEL_ID: Default hostel to show on first run (e.g., BH1 | GH1 | NONE)

Optional:
- VITE_DISABLE_AUTH=true to bypass Google sign-in during development
- VITE_ENABLE_FLOAT_ANIMATION=true to show the floating name overlay animation
- VITE_GOOGLE_CLIENT_ID if you enable sign-in

Meal time configuration (optional, set in your `.env`):

- VITE_BREAKFAST_START (HH:mm) — default `07:30`
- VITE_BREAKFAST_END (HH:mm) — default `09:30`
- VITE_LUNCH_START (HH:mm) — default `12:00`
- VITE_LUNCH_END (HH:mm) — default `14:00`
- VITE_SNACKS_START (HH:mm) — default `16:00`
- VITE_SNACKS_END (HH:mm) — default `18:00`
- VITE_DINNER_START (HH:mm) — default `19:30`
- VITE_DINNER_END (HH:mm) — default `21:30`
- VITE_MEAL_GRACE_MINUTES (number) — default `30` (applies +/- to start/end)

Notes on meal windows and grace period:
- The scanner uses these values (HH:mm) to auto-select the meal type when "Auto-select by time" is enabled in the menu.
- The grace period (minutes) is applied as: effectiveStart = start - grace, effectiveEnd = end + grace. For example, with breakfast 07:30–09:30 and grace 30, effective window is 07:00–10:00.
- If you don't set these variables, the app falls back to the defaults shown above.

## How to use

1) Sign In
- Click "Sign in with Google" for college accounts, or
- Click "Sign in with Username" and enter one of the custom accounts above

2) Select Hostel and Meal Type
- Open the menu (☰) and select a hostel from your allowed list.
- Choose Meal Type under "Meal Type". Enable "Auto-select by time" to auto-switch based on configured windows (see meal configuration below).

3) Start Scanning
- Point the camera at a student QR. The app shows a large status banner:
	- ✅ valid: first scan accepted for this meal
	- 🟡 duplicate: same student scanned again within 10s for the **same meal**
	- ❌ already-used: same student scanned again after 10s for the **same meal**
	- 🔴 not-authorized: student not authorized (e.g., wrong hostel)
	- 🚫 invalid: unreadable/invalid QR
- **Important**: Duplicate detection is **per meal type and per day**. A student can scan for:
  - Breakfast, then Lunch, then Snacks, then Dinner on the same day ✅
  - Same meal type on different days ✅
  - But cannot scan for the same meal type twice on the same day (within or after 10s) ❌
- If the same QR stays in view, the app suppresses re-counting and after ~3s shows "NEXT…" as a hint. Move to the next student.

3) Online/Offline and Sync
- All scans are saved locally (IndexedDB). When online, the app uploads only VALID scans every second (delta-only). If offline, they'll sync automatically when connectivity returns.
- Upload endpoint used: POST /api/scans/upload
- The scanner always verifies against the selected hostel roster only (no event/gatepass modes).

4) View Reports
- Open the menu (☰) → click “📊 View Reports”.
- Filters available: Day, Student Batch (e.g., 2023,2024), Food Type.
- Summary cards show totals and per-meal breakdown.
- Export CSV from the reports page.
- A “Quick Preview” in the menu shows the latest 5 rows inline.

5) Offline Keys (optional)
- If you need completely offline verification, download hostel keys from the API and cache them on the device (menu option in app). Endpoint: GET /api/sync/hostel-keys?hostelId=BH1

## Installing as a Mobile App (PWA)

The VJ Scanner can be installed on your phone or desktop as a native-like app for quick access and offline support.

### Android (Chrome/Edge)

1. Open the scanner website in Chrome or Edge browser
2. You'll see an "Install App" banner at the bottom of the screen
3. Tap **Install** on the banner, or
4. Tap the menu (⋮) → **Install app** → **Install**
5. The app will be added to your home screen and app drawer

### iOS (Safari)

1. Open the scanner website in Safari browser
2. Tap the **Share** button (square with arrow pointing up)
3. Scroll down and tap **Add to Home Screen**
4. Edit the name if desired, then tap **Add**
5. The app icon will appear on your home screen

### Desktop (Chrome/Edge)

1. Open the scanner website in Chrome or Edge
2. Look for the install icon (⊕) in the address bar, or
3. Click menu (⋮) → **Install VJ Scanner...**
4. Click **Install** in the confirmation dialog
5. The app will open in its own window

### Benefits of Installing

- **Quick Access**: Launch directly from home screen/app drawer
- **Offline Support**: Works without internet connection (with cached data)
- **Native Feel**: Runs in standalone mode without browser UI
- **Background Sync**: Automatically uploads scans when connection returns
- **Better Performance**: Optimized caching for faster load times

### Uninstalling

- **Android**: Long-press app icon → **Uninstall** or **App info** → **Uninstall**
- **iOS**: Long-press app icon → **Remove App** → **Delete App**
- **Desktop**: Right-click app icon → **Uninstall** or go to browser settings → Apps

## Tips

- Use HTTPS in production to allow camera access on all browsers.
- Keep the device screen bright for outdoor scanning.
- If scans don't upload, verify VITE_API_BASE_URL and network, then check the server logs.
- Install the app for the best mobile experience and offline support.

## Features

- **Progressive Web App (PWA)**: Installable on phones and desktop with offline support
- **Dual authentication**: Google Sign-In or custom username/password accounts
- **Role-based hostel access**: Boys/Girls/Admin accounts with specific hostel permissions
- **Meal tracking**: Breakfast/Lunch/Snacks/Dinner with configurable time windows
- **Smart duplicate detection**: Per meal type + per day (students can scan for different meals on same day)
- Duplicate vs already-used detection with a 10s threshold
- Same-QR suppression and "NEXT…" overlay hint
- Online verification with backend; optional offline mode with cached keys
- 1s background delta sync of VALID scans only
- Full reports page with filters and CSV export
- Enhanced caching strategies for optimal performance

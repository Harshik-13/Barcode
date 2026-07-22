# PASSPORT PWA

Student app that displays a rotating QR code for entry/meal verification and lets students view their own activity.

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env values below, at minimum set VITE_API_BASE_URL and VITE_GOOGLE_CLIENT_ID
npm run dev
```

Open http://localhost:5173

## Required .env settings

- VITE_API_BASE_URL: Base URL of the API server (e.g., http://localhost:8080)
- VITE_GOOGLE_CLIENT_ID: Client ID from Google Identity Services

Optional:
- VITE_APP_ENV=production|dev (affects some dev-only UI)
- VITE_QR_REFRESH_INTERVAL=15 (seconds)
- VITE_QR_VERSION=1|2 (QR v2 includes name in payload)
- VITE_ENABLE_ROLL_OVERRIDE=true (dev-only: let you preview a different roll)

## How to use

1) Sign In
- Use your college Google account. On success, the app stores your JWT and fetches your per-student secret securely.

2) Show Your QR
- Your QR refreshes every VITE_QR_REFRESH_INTERVAL seconds and includes a countdown.
- Present it at the scanner. If the scanner is online and you’re authorized, it will mark you as valid for the selected meal.

3) View Your Activity
- Open the menu (☰) → click “📊 View My Activity”.
- Filter by Food Type (Breakfast/Lunch/Snacks/Dinner).
- See status for each attempt (valid, duplicate, already-used, not-authorized, etc.).
- Export your history as CSV.

Note for admins/scanners: meal time windows are configurable on the scanner app using `.env` variables (e.g., `VITE_BREAKFAST_START`, `VITE_LUNCH_START`, `VITE_MEAL_GRACE_MINUTES`). If you need different meal windows, edit the scanner's `.env` and restart that app.

4) Offline behavior
- Your QR can still be generated if your device remains signed in and the secret is cached locally. The scanner may verify offline using its cached hostel keys.

## Features

- Rotating HMAC-SHA256 QR codes (with optional v2 payload including name)
- Secure secret retrieval and local storage with IndexedDB
- Student activity view with filters and CSV export
- Service worker for basic offline capabilities

## Troubleshooting

- Ensure your Google client ID and API base URL are correct.
- If you see “Not authenticated”, sign out and sign in again.
- For QR debugging tips, see `DEBUGGING_QR_CODES.md`.

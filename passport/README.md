# Campus Passport — Offline-first PWAs + API

This workspace contains three sub-projects:

- `passport-pwa/` — Student PWA (React + Vite + TS)
- `vjscanner-pwa/` — Warden/Scanner PWA (React + Vite + TS)
- `api-server/` — Node.js + Express + SQLite backend

Each project has an `.env.example` and minimal run scripts. The apps are scaffolded as lightweight starters to demonstrate the following features:

- QR generation with HMAC-SHA256
- Encrypted secrets (AES-GCM) stored in IndexedDB
- Service Worker for offline caching
- Sync endpoints to upload scan logs and download hostel key bundles

See individual README.md inside each subproject for run instructions.

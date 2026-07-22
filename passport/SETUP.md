# Campus Passport System — Complete Setup Guide

This repository contains three offline-first Progressive Web Apps and a backend API:

1. **passport-pwa** — Student app that displays a rotating QR code
2. **vjscanner-pwa** — Security scanner app for verification
3. **api-server** — Node.js backend with SQLite

---

## Quick Start

### 1. Backend API Server

```bash
cd api-server
npm install
cp .env.example .env
# Edit .env if needed (default PORT=8080)
npm run migrate
npm start
```

The API will be running at `http://localhost:8080`.

**Endpoints:**
- `POST /api/auth/login` — OAuth stub (pass `{ "email": "roll@vnrvjiet.in" }`)
- `GET /api/student/secret` — Returns encrypted secret (requires Bearer token)
- `POST /api/verify/online` — Verifies a QR code
- `POST /api/sync/logs` — Accepts scan logs array
- `GET /api/sync/hostel-keys?hostelId=H1` — Returns key bundle for offline verification

---

### 2. PASSPORT PWA (Student App)

```bash
cd passport-pwa
npm install
cp .env.example .env
# Edit .env to set VITE_API_BASE_URL=http://localhost:8080
npm run dev
```

Open `http://localhost:5173` in your browser.

**Features:**
- Auto-generates QR code every 15 seconds using HMAC-SHA256
- Stores secret in IndexedDB (AES-GCM encrypted in production)
- Service worker for offline support
- Countdown timer showing time until next QR refresh

---

### 3. VJ Scanner PWA (Security App)

```bash
cd vjscanner-pwa
npm install
cp .env.example .env
# Edit .env to set:
#   VITE_API_BASE_URL=http://localhost:8080
#   VITE_HOSTEL_ID=H1 (or H4)
npm run dev
```

Open `http://localhost:5173` in a separate browser/tab.

**Features:**
- Online verification (tries backend first)
- Offline verification (uses cached hostel keys from IndexedDB)
- Color-coded results:
  - ✅ **Green** → Valid
  - 🟡 **Yellow** → Expired
  - 🔴 **Red** → Invalid
  - 🔵 **Blue** → Not Authorized (wrong hostel)
- Logs scans locally and syncs when online

---

## Architecture

### QR Format
```
rollNumber|timeStep|hash
```

- **timeStep**: `Math.floor(Date.now() / 15000)` (15-second window)
- **hash**: HMAC-SHA256(secret, rollNumber + timeStep)

### Security
- Secrets are per-student and stored encrypted server-side
- Client-side encryption via Web Crypto API (AES-GCM)
- Time window tolerance: ±1 step (30 seconds total)
- HTTPS required in production

### Offline Support
- **Service Workers** cache static assets
- **IndexedDB** stores secrets, keys, and logs
- Background Sync API (or manual "Sync Now" button)
- Works fully offline after initial login/key fetch

---

## Testing

### Unit Tests (Passport PWA)
```bash
cd passport-pwa
npm test
```

Tests HMAC QR generation and verification logic.

### Integration Testing
1. Start backend: `cd api-server && npm start`
2. Login via API:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"student001@vnrvjiet.in"}'
   ```
3. Copy the JWT token and fetch secret:
   ```bash
   curl http://localhost:8080/api/student/secret \
     -H "Authorization: Bearer <TOKEN>"
   ```
4. Start passport PWA and observe QR generation
5. Copy a QR code and verify via scanner PWA or API:
   ```bash
   curl -X POST http://localhost:8080/api/verify/online \
     -H "Content-Type: application/json" \
     -d '{"qr":"student001|123456|abc123..."}'
   ```

---

## Database Schema (SQLite)

**hostels**
- `id` (TEXT, PK) — e.g., "H1", "H4"
- `name` (TEXT)

**students**
- `id` (INTEGER, PK, AUTO)
- `roll` (TEXT, UNIQUE)
- `name`, `email`
- `hostel_id` (FK → hostels.id)
- `secret_encrypted` (BLOB)
- `created_at` (DATETIME)

**devices**
- `id` (INTEGER, PK, AUTO)
- `device_uuid` (TEXT, UNIQUE)
- `hostel_id` (FK → hostels.id)
- `registered_at` (DATETIME)

**scans**
- `id` (INTEGER, PK, AUTO)
- `roll`, `mode`, `hostel_id`, `device_id`
- `timestamp` (DATETIME)
- `status` (TEXT: valid/expired/invalid)
- `metadata` (JSON)

---

## Environment Variables

### Backend (.env)
```env
PORT=8080
DATABASE_URL=./campus_passport.db
JWT_SECRET=supersecretkey
OAUTH_CLIENT_ID=xxxx
OAUTH_CLIENT_SECRET=yyyy
APP_ENV=dev
```

### PASSPORT PWA (.env)
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_ENV=dev
VITE_QR_REFRESH_INTERVAL=15
```

### VJ Scanner PWA (.env)
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_HOSTEL_ID=H4
VITE_APP_ENV=dev
```

---

## Deployment

### Local/Dev
Use the Quick Start instructions above.

### Production
1. Set `VITE_API_BASE_URL` to your production API domain (HTTPS)
2. Run `npm run build` in both PWAs
3. Serve the `dist/` folders via a static host (Nginx, Vercel, Netlify, etc.)
4. Deploy backend to a Node.js host (Railway, Render, AWS, etc.)
5. Update `.env` with production secrets and OAuth credentials
6. Use a proper SQLite mount or migrate to PostgreSQL for multi-instance setups

### Security Checklist
- [ ] Enable HTTPS everywhere
- [ ] Use strong JWT_SECRET (32+ random chars)
- [ ] Rotate secrets periodically
- [ ] Implement rate limiting on verification endpoints
- [ ] Add OAuth 2.0 with college IdP (Microsoft/Google)
- [ ] Encrypt secrets server-side with AES-GCM + KMS
- [ ] Set CORS properly for production domains
- [ ] Add CSP headers to PWAs

---

## Known Limitations (Demo)

- OAuth is stubbed (auto-creates student on login)
- Secrets are stored as plaintext in SQLite (should be AES-GCM encrypted with a master key)
- No camera integration in VJ Scanner (manual QR input only)
- Service workers are minimal (static caching only, no Background Sync API yet)
- IndexedDB encryption is not implemented (should use Web Crypto + user passphrase)
- Time tolerance is ±1 step; adjust as needed for network latency

---

## Next Steps / Enhancements

1. **Real OAuth Integration**
   - Integrate Microsoft/Google OAuth for `@vnrvjiet.in` emails
   - Fetch student metadata (roll, name, hostel) from college directory

2. **Camera Scanning**
   - Use `react-qr-reader` or `html5-qrcode` in VJ Scanner
   - Add continuous scan mode with beep/vibration feedback

3. **Background Sync**
   - Implement Background Sync API for automatic log uploads
   - Show sync status indicator in UI

4. **Encryption Enhancements**
   - Server-side: use AWS KMS or similar for secret encryption
   - Client-side: encrypt IndexedDB with user passphrase

5. **Advanced Features**
   - Multi-hostel access for wardens (dropdown selector)
   - Admin dashboard for analytics (scans/hour, most active times)
   - Push notifications for invalid scan attempts
   - Geofencing (verify scanner is physically at hostel gate)

6. **Testing**
   - E2E tests with Playwright/Cypress
   - Load testing for verification endpoint
   - Offline-first test suite (Service Worker mocks)

---

## Troubleshooting

### "Cannot find module 'crypto'"
The passport PWA crypto helper was updated to use Web Crypto API. If you see this error, ensure you're using the browser-compatible version (async HMAC).

### "Port 8080 already in use"
Change `PORT` in `api-server/.env` or kill the existing process:
```bash
lsof -ti:8080 | xargs kill -9
```

### "IndexedDB not defined"
Run the PWAs in a browser, not Node.js. Use `npm run dev` and open the localhost URL.

### "Type errors in .tsx files"
Ensure `@types/react` and `@types/react-dom` are installed:
```bash
cd passport-pwa  # or vjscanner-pwa
npm install --save-dev @types/react @types/react-dom
```

---

## License

MIT

---

## Contact

For questions or contributions, open an issue or PR on this repository.

**Happy scanning! 🎉**

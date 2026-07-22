# Google OAuth Integration — Setup Complete ✅

## What's Implemented

### Backend (api-server)
- ✅ Added `google-auth-library` dependency
- ✅ New endpoint: `POST /api/auth/google` that:
  - Accepts Google ID token from client
  - Verifies token with Google's servers
  - Enforces email domain (@vnrvjiet.in)
  - Creates student record if needed
  - Returns your app's JWT for subsequent API calls
- ✅ Environment variables configured

### PASSPORT PWA (passport-pwa)
- ✅ Google Sign-In button component (`GoogleLogin.tsx`)
- ✅ Login/logout flow with token persistence
- ✅ Fetches student secret from backend after login
- ✅ Generates QR code every 15 seconds
- ✅ Shows roll number and hostel ID
- ✅ Environment variables configured

### VJ Scanner PWA (vjscanner-pwa)
- ✅ Google Sign-In for wardens/security
- ✅ Login/logout flow
- ✅ Camera scanning with html5-qrcode
- ✅ Online and offline QR verification
- ✅ Background Sync API integration
- ✅ "Sync Pending Logs" button
- ✅ Environment variables configured

## Environment Configuration

### Backend (.env)
```bash
PORT=8080
DATABASE_URL=./campus_passport.db
JWT_SECRET=supersecretkey
OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com  # ← SET THIS
OAUTH_CLIENT_SECRET=yyyy
APP_ENV=dev
ALLOWED_EMAIL_DOMAIN=vnrvjiet.in
```

### PASSPORT PWA (.env)
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_ENV=dev
VITE_QR_REFRESH_INTERVAL=15
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com  # ← SET THIS
```

### VJ Scanner PWA (.env)
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_HOSTEL_ID=H4
VITE_APP_ENV=dev
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com  # ← SET THIS
```

## Google Cloud Console Setup

### 1. Create OAuth Client
1. Go to https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: "Campus Passport"

### 2. Configure Authorized Origins
Add these to "Authorized JavaScript origins":
```
http://localhost:5173
http://localhost:5174
http://localhost:8080
https://your-production-domain.com
```

### 3. No Redirect URIs Needed
For Google Identity Services (One Tap), you only need JavaScript origins, not redirect URIs.

### 4. Copy Client ID
- Copy the Client ID (looks like: `123456789-abc.apps.googleusercontent.com`)
- Paste it into all three `.env` files as `OAUTH_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (PWAs)

## How It Works

### Login Flow (Student - PASSPORT)
1. User clicks "Sign in with Google"
2. Google Identity Services popup appears
3. User selects their `@vnrvjiet.in` email
4. Google returns an ID token to the client
5. Client posts ID token to `/api/auth/google`
6. Backend verifies token with Google
7. Backend checks email domain
8. Backend creates/finds student record
9. Backend generates per-student secret (if new)
10. Backend returns app JWT
11. Client stores JWT in localStorage
12. Client fetches secret from `/api/student/secret` with Bearer token
13. Client stores secret in IndexedDB
14. QR code generation starts (refresh every 15s)

### Login Flow (Warden - VJ Scanner)
1. Similar to above, but stores token as `scanner_token`
2. After login, scanner can:
   - Scan QR codes via camera
   - Verify online via `/api/verify/online`
   - Verify offline using cached keys
   - Upload logs via "Sync Pending Logs"
   - Download hostel keys for offline use

## Testing Without Real Google OAuth

If you want to test without setting up Google OAuth yet:
- Use the old stub endpoint: `POST /api/auth/login` with `{ "email": "student001@vnrvjiet.in" }`
- This still works for local testing

## API Endpoints

### Auth
- `POST /api/auth/google` — Verify Google ID token, returns JWT
  - Request: `{ "idToken": "..." }`
  - Response: `{ "token": "jwt...", "roll": "student001", "hostelId": "H1" }`
- `POST /api/auth/login` — Stub for local testing (no Google required)

### Student
- `GET /api/student/secret` — Requires `Authorization: Bearer <JWT>`
  - Response: `{ "roll": "...", "hostel_id": "...", "secret_b64": "..." }`

### Verification
- `POST /api/verify/online` — Validate QR code
  - Request: `{ "qr": "roll|timestep|hash" }`
  - Response: `{ "status": "valid", "code": "VALID", "hostel_id": "H1" }`

### Sync
- `POST /api/sync/logs` — Upload scan logs
  - Request: `{ "logs": [...] }`
- `GET /api/sync/hostel-keys?hostelId=H1` — Download key bundle for offline use

## Security Notes

### Domain Restriction
- Backend enforces `ALLOWED_EMAIL_DOMAIN=vnrvjiet.in`
- Only `@vnrvjiet.in` emails can log in
- Change this if you use a different domain

### Token Expiration
- Google ID tokens: valid for ~1 hour
- App JWT tokens: valid for 12 hours (configurable in backend)
- Refresh logic: not implemented yet; users must re-login after expiration

### HTTPS in Production
- Google OAuth requires HTTPS in production
- Use `http://localhost` for local dev only
- Deploy PWAs to HTTPS domains (Vercel, Netlify, etc.)
- Deploy backend to HTTPS (Railway, Render, AWS, etc.)

## Common Issues

### "VITE_GOOGLE_CLIENT_ID not configured"
- Edit `.env` files and replace `your-google-client-id.apps.googleusercontent.com` with your real Client ID

### "email domain not allowed"
- Backend only accepts emails ending with `@vnrvjiet.in`
- Change `ALLOWED_EMAIL_DOMAIN` in backend `.env` if needed

### "invalid google token"
- Client ID in Google Cloud Console must match `.env` files
- Check "Authorized JavaScript origins" includes your dev server URL

### CORS errors
- Backend has `cors()` enabled for all origins in dev
- In production, restrict to your domains: `cors({ origin: ['https://passport.yourdomain.com', 'https://scanner.yourdomain.com'] })`

## Next Steps

1. **Get Google Client ID**
   - Create OAuth client in Google Cloud Console
   - Copy Client ID to all `.env` files

2. **Run the apps**
   ```bash
   # Terminal 1: Backend
   cd api-server
   npm start
   
   # Terminal 2: PASSPORT
   cd passport-pwa
   npm run dev
   
   # Terminal 3: Scanner
   cd vjscanner-pwa
   npm run dev
   ```

3. **Test the flow**
   - Open PASSPORT at http://localhost:5173
   - Click "Sign in with Google"
   - Use your `@vnrvjiet.in` email
   - See QR code generate every 15s
   - Open Scanner in another browser tab
   - Sign in and scan the QR

4. **Deploy to production**
   - Update all `.env` files with production URLs
   - Build PWAs: `npm run build`
   - Deploy `dist/` folders to static hosting
   - Deploy backend to Node.js hosting
   - Update Google Cloud Console with production domains

## Files Changed

- `api-server/package.json` — added google-auth-library
- `api-server/index.js` — added `/api/auth/google` endpoint
- `api-server/.env` — added ALLOWED_EMAIL_DOMAIN
- `api-server/.env.example` — documented Google OAuth setup
- `passport-pwa/src/App.tsx` — full OAuth login flow
- `passport-pwa/src/components/GoogleLogin.tsx` — Google Sign-In button
- `passport-pwa/.env` — added VITE_GOOGLE_CLIENT_ID
- `passport-pwa/src/vite-env.d.ts` — added type definition
- `vjscanner-pwa/src/App.tsx` — OAuth login for wardens
- `vjscanner-pwa/src/components/GoogleLogin.tsx` — Google Sign-In button
- `vjscanner-pwa/.env` — added VITE_GOOGLE_CLIENT_ID
- `vjscanner-pwa/src/vite-env.d.ts` — added type definition

---

**Ready to use!** Just add your Google Client ID to the `.env` files and you're good to go. 🚀

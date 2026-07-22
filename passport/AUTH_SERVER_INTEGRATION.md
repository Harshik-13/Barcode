# SSO Authentication with Auth Server (Port 3115)

## Updated Architecture

Your frontend apps now use a **separate auth server** running on `localhost:3115` that handles Google OAuth SSO.

## How It Works

### Authentication Flow

1. **User clicks "Sign in with Google"** in PASSPORT or VJ Scanner
2. **Frontend redirects** to: `http://localhost:3115/auth/google?callback=<frontend-url>`
3. **Auth server handles Google OAuth**:
   - Shows Google sign-in page
   - User authenticates with Google
   - Auth server validates with Google
   - Auth server creates/fetches student record
   - Auth server generates JWT token
4. **Auth server redirects back** to frontend with: `?token=<jwt>&roll=<roll>&hostelId=<hostel>`
5. **Frontend receives token** and stores it
6. **Frontend uses token** for API calls to backend (port 8080)

## Configuration

### Auth Server (Port 3115)
Your auth server should expose:
- `GET /auth/google?callback=<url>` - Initiates Google OAuth flow
- After auth, redirects to: `<callback>?token=<jwt>&roll=<roll>&hostelId=<hostel>`

### Backend API (Port 8080)
- Validates JWT tokens from auth server
- Provides student secret, verification, sync endpoints
- Uses same JWT_SECRET as auth server

### Frontend Apps
Both PASSPORT and VJ Scanner:
- Redirect to auth server for login
- Receive token via callback URL
- Store token in localStorage
- Use token for backend API calls

## Environment Variables

### passport-pwa/.env
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_ENV=dev
VITE_QR_REFRESH_INTERVAL=15
VITE_AUTH_SERVER_URL=http://localhost:3115
```

### vjscanner-pwa/.env
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_HOSTEL_ID=
VITE_APP_ENV=dev
VITE_AUTH_SERVER_URL=http://localhost:3115
```

### api-server/.env
```bash
PORT=8080
DATABASE_URL=./campus_passport.db
JWT_SECRET=supersecretkey  # Must match auth server!
ALLOWED_EMAIL_DOMAIN=vnrvjiet.in
APP_ENV=dev
```

## What Changed

### GoogleLogin Components
- **Before**: Loaded Google Identity Services directly, got ID token, sent to backend
- **After**: Simple redirect to auth server at port 3115, receives JWT token back

### Benefits
- Centralized authentication logic in auth server
- Single sign-on across multiple apps
- Auth server handles all Google OAuth complexity
- Frontend apps just redirect and receive tokens
- Easier to add more auth providers later (Microsoft, etc.)

## Testing

1. **Start your auth server** on port 3115
2. **Start backend API**:
   ```bash
   cd api-server
   npm start  # Runs on port 8080
   ```
3. **Start PASSPORT PWA**:
   ```bash
   cd passport-pwa
   npm run dev  # Runs on port 5173
   ```
4. **Start Scanner PWA**:
   ```bash
   cd vjscanner-pwa
   npm run dev  # Runs on port 5174
   ```
5. **Test login flow**:
   - Open http://localhost:5173
   - Click "Sign in with Google"
   - Should redirect to http://localhost:3115/auth/google?callback=...
   - After Google auth, should redirect back with token
   - Should see QR code generation page

## Auth Server Requirements

Your auth server at port 3115 should:

1. **Expose OAuth endpoint**:
   ```
   GET /auth/google?callback=<encoded-callback-url>
   ```

2. **Handle Google OAuth**:
   - Redirect to Google
   - Receive OAuth code
   - Exchange for Google tokens
   - Verify email domain (@vnrvjiet.in)
   - Extract roll number from email

3. **Create/fetch user**:
   - Check if student exists in DB
   - Create if new
   - Generate per-student secret (if needed)

4. **Issue JWT token**:
   - Sign with JWT_SECRET (same as api-server)
   - Include: `{ roll, hostelId }`
   - 12-hour expiry

5. **Redirect back to frontend**:
   ```
   <callback-url>?token=<jwt>&roll=<roll>&hostelId=<hostel>
   ```

## CORS Configuration

Your auth server should allow CORS from:
- http://localhost:5173 (PASSPORT)
- http://localhost:5174 (VJ Scanner)
- Production frontend domains

## Security Notes

- Auth server must use HTTPS in production
- JWT_SECRET must be strong and same across auth server + api server
- Callback URL should be validated (whitelist allowed origins)
- Tokens should have expiration (12 hours recommended)
- Use secure cookies if possible instead of URL params in production

## Files Modified

- `passport-pwa/src/components/GoogleLogin.tsx` - Now redirects to auth server
- `vjscanner-pwa/src/components/GoogleLogin.tsx` - Now redirects to auth server
- `passport-pwa/.env` - Added VITE_AUTH_SERVER_URL
- `vjscanner-pwa/.env` - Added VITE_AUTH_SERVER_URL

## Next Steps

1. Ensure your auth server at port 3115 is running
2. Verify auth server returns tokens in correct format: `?token=<jwt>&roll=<roll>&hostelId=<hostel>`
3. Restart frontend dev servers to pick up new .env variables
4. Test the complete login flow

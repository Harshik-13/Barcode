# Google OAuth Login Issues - Troubleshooting Guide

## Issue: Empty Login Page or "Loading Google Sign-In..." Forever

### Quick Fixes

1. **Restart Dev Servers** (Environment variables only load on startup)
   ```bash
   # Stop all running dev servers (Ctrl+C in each terminal)
   
   # Start backend
   cd api-server
   npm start
   
   # In new terminal - Start PASSPORT
   cd passport-pwa
   npm run dev
   
   # In new terminal - Start Scanner
   cd vjscanner-pwa
   npm run dev
   ```

2. **Check Google Cloud Console Settings**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID: `522460567146-ubk3ojomopil8f68hl73jt1pj0jbbm68.apps.googleusercontent.com`
   - Click "Edit"
   - Under "Authorized JavaScript origins", add:
     ```
     http://localhost:5173
     http://localhost:5174
     http://localhost:8080
     ```
   - Click "Save"
   - Wait 5 minutes for changes to propagate

3. **Check Browser Console for Errors**
   - Open browser DevTools (F12)
   - Look for errors in Console tab
   - Common errors:
     - "Not a valid origin for the client" → Add origin to Google Console
     - "Failed to load Google Sign-In script" → Check internet connection
     - Network errors → Check if backend is running on port 8080

4. **Verify Environment Files**
   ```bash
   # Check passport-pwa/.env
   cat passport-pwa/.env
   # Should have: VITE_GOOGLE_CLIENT_ID=522460567146-ubk3ojomopil8f68hl73jt1pj0jbbm68.apps.googleusercontent.com
   
   # Check vjscanner-pwa/.env
   cat vjscanner-pwa/.env
   # Should have: VITE_GOOGLE_CLIENT_ID=522460567146-ubk3ojomopil8f68hl73jt1pj0jbbm68.apps.googleusercontent.com
   
   # Check api-server/.env
   cat api-server/.env
   # Should have: OAUTH_CLIENT_ID=522460567146-ubk3ojomopil8f68hl73jt1pj0jbbm68.apps.googleusercontent.com
   ```

5. **Clear Browser Cache**
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

## What Was Fixed

### GoogleLogin Component Issues:
- **Problem**: Button element was created before script loaded
- **Fix**: Used `useRef` to ensure element exists before Google renders button
- **Problem**: Script was added to body instead of head
- **Fix**: Changed to `document.head.appendChild(script)`
- **Problem**: No error handling for script load failures
- **Fix**: Added `script.onerror` handler
- **Problem**: Missing dependency array causing re-renders
- **Fix**: Added proper dependencies to useEffect

## Testing Steps

1. Open PASSPORT: http://localhost:5173
   - Should see "Sign in with Google" button
   - Click it and sign in with @vnrvjiet.in email
   - Should redirect to QR code page after login

2. Open Scanner: http://localhost:5174 (or new browser profile)
   - Should see "Sign in with Google" button
   - Sign in with @vnrvjiet.in email
   - Should see scanner interface with camera

## Still Not Working?

### Check Backend Logs
```bash
cd api-server
npm start
# Watch for errors when you try to login
```

### Test Backend Directly
Use the stub login endpoint:
```bash
# In browser console or terminal with curl:
fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({email: 'test@vnrvjiet.in'})
}).then(r => r.json()).then(console.log)
```

### Enable Debug Mode
Add to passport-pwa/src/App.tsx before `return`:
```tsx
console.log('Login state:', { loggedIn, token, roll, hostelId, error })
```

### Google OAuth Status Check
The Client ID `522460567146-ubk3ojomopil8f68hl73jt1pj0jbbm68.apps.googleusercontent.com` is configured.

**Important**: You must add http://localhost:5173 and http://localhost:5174 to "Authorized JavaScript origins" in Google Cloud Console for the sign-in button to work!

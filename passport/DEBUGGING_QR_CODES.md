# Debugging QR Code Verification

## 🐛 Common Issue: "INVALID" Error When Scanning

### Problem
You generate a QR code in the Passport app with a custom roll number, but when scanning it shows "INVALID".

### Root Cause
The QR code verification uses HMAC-SHA256 which requires both apps (Passport & Scanner) to have the **same secret** for that roll number.

## 🔍 How QR Verification Works

### QR Code Format (v2):
```
roll|name|timestep|hmac
Example: 24071A6222|Student Name|117448070|573660912904fb9338a480d8dac1efc601736b32ea08ea8b59cd1a9b1506e917
```

### HMAC Calculation:
```javascript
HMAC-SHA256(roll + name + timestep, secret)
```

### Verification Process:
1. Scanner extracts: roll, name, timestep, hmac
2. Scanner looks up secret for that roll
3. Scanner recalculates: `HMAC-SHA256(roll + name + timestep, secret)`
4. Compares calculated HMAC with received HMAC
5. ✅ Match = VALID | ❌ Mismatch = INVALID

## 🔧 Debug Steps

### Step 1: Check Console Logs

**In Passport App:**
Open browser console (F12) and look for:
```
📊 Barcode scanned: [roll]
📱 QR code scanned: [roll]
Using cached secret for custom roll: [roll]
⚠️ No secret found for custom roll [roll]
```

**In Scanner App:**
Open browser console (F12) and look for:
```
🔧 Dev Mode: Using demo secret for roll: [roll]
📊 Barcode scanned: [roll]
📱 QR code scanned: [roll]
```

### Step 2: Verify Demo Secrets Match

**In Passport App:**
1. Open DevTools Console (F12)
2. Type: `localStorage.getItem('demo_secret_24071A6222')`
3. Note the secret value (should be: `demo_secret_24071A6222`)

**In Scanner App:**
1. Open DevTools Console (F12)
2. Type: `localStorage.getItem('demo_secret_24071A6222')`
3. Should return the SAME value as Passport app

### Step 3: Manually Verify HMAC

Open browser console and run this code to manually verify the QR:

```javascript
// Your QR code string
const qrString = "24071A6222|Innovation Incubation & Entrepreneurship Head|117448070|573660912904fb9338a480d8dac1efc601736b32ea08ea8b59cd1a9b1506e917"

// Parse QR
const parts = qrString.split('|')
const roll = parts[0]
const name = parts[1]
const timestep = parts[2]
const receivedHMAC = parts[3]

// Get secret from localStorage
const secret = localStorage.getItem('demo_secret_' + roll)
console.log('Roll:', roll)
console.log('Name:', name)
console.log('Timestep:', timestep)
console.log('Secret:', secret)
console.log('Received HMAC:', receivedHMAC)

// Calculate expected HMAC
const encoder = new TextEncoder()
const keyData = encoder.encode(secret)
const messageData = encoder.encode(roll + name + timestep)

crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  .then(key => crypto.subtle.sign('HMAC', key, messageData))
  .then(signature => {
    const calculatedHMAC = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    console.log('Calculated HMAC:', calculatedHMAC)
    console.log('Match:', calculatedHMAC === receivedHMAC ? '✅ VALID' : '❌ INVALID')
  })
```

### Step 4: Check Timestep Range

The timestep changes every 15 seconds. If the QR is too old, it will fail verification.

```javascript
// Check current timestep
const currentTimestep = Math.floor(Date.now() / 1000 / 15)
console.log('Current timestep:', currentTimestep)

// Your QR timestep
const qrTimestep = 117448070
const diff = currentTimestep - qrTimestep
console.log('Timestep difference:', diff)
console.log('Age (seconds):', diff * 15)

// Should be within ±1 timestep (±15 seconds) for online verification
if (Math.abs(diff) <= 1) {
  console.log('✅ Timestep is valid')
} else {
  console.log('❌ QR code expired (too old or future)')
}
```

## 🛠️ Using Dev Tools in Scanner App

### Setting Demo Secret via UI:

1. Open Scanner app
2. Click hamburger menu (☰)
3. Scroll to "🔧 Dev Tools" section at bottom
4. Enter roll number: `24071A6222`
5. Click "Set Demo Secret"
6. ✅ Secret is now set for that roll

### Setting Demo Secret via Console:

```javascript
// Set demo secret for any roll
const roll = '24071A6222'
const secret = `demo_secret_${roll}`
localStorage.setItem(`demo_secret_${roll}`, secret)
console.log(`✅ Set demo secret for ${roll}`)
```

## 📋 Quick Testing Workflow

### Test Custom Roll Number QR:

1. **Passport App:**
   - Enable roll override (checkbox)
   - Enter custom roll: `24071A6222`
   - Click "Set Demo Secret"
   - QR code generates

2. **Scanner App:**
   - Open menu → Dev Tools
   - Enter same roll: `24071A6222`
   - Click "Set Demo Secret"
   - Scan the QR code
   - Should show ✅ VALID (demo mode)

### Test Real User QR:

1. **Passport App:**
   - Login as real user
   - QR generates with real secret from API

2. **Scanner App:**
   - Must have internet connection
   - OR must have synced keys offline
   - Scan QR code
   - Verifies against API or cached keys

## 🔐 Secret Sources Priority

Scanner checks secrets in this order:

1. **localStorage demo secret** (highest priority - for testing)
   - `demo_secret_24071A6222`
   - Set via Dev Tools

2. **Online API verification**
   - Sends QR to `/api/verify/online`
   - Server checks against real secrets

3. **Offline cached keys** (fallback when network fails)
   - Synced via "Sync Now" button
   - Stored in IndexedDB

## ⚠️ Common Mistakes

### Mistake 1: Different Secrets
**Problem:** Passport uses `demo_secret_X`, Scanner uses different secret  
**Solution:** Ensure BOTH apps have identical demo secret

### Mistake 2: No Demo Secret in Scanner
**Problem:** Passport set demo secret, Scanner didn't  
**Solution:** Set demo secret in Scanner's Dev Tools menu

### Mistake 3: Online Verification Overrides Demo
**Problem:** Scanner had internet, tried API first (which doesn't have demo secret)  
**Fix:** ✅ Already fixed - Scanner now checks localStorage FIRST

### Mistake 4: Expired Timestep
**Problem:** QR generated 30+ seconds ago  
**Solution:** QR codes refresh every 15 seconds - scan within that window

### Mistake 5: Wrong Roll Number Secret
**Problem:** Using logged-in user's secret for different roll  
**Fix:** ✅ Already fixed - Passport now uses custom roll's secret

## 📊 Expected Console Output

### Successful Scan (Demo Mode):
```
Scanner Console:
🔧 Dev Mode: Using demo secret for roll: 24071A6222
✅ VALID ENTRY
Entry authorized (demo mode)
```

### Failed Scan (No Secret):
```
Scanner Console:
📱 QR code scanned: 24071A6222
Trying online verification...
❌ INVALID
Invalid QR code
```

### Failed Scan (Wrong Secret):
```
Scanner Console:
🔧 Dev Mode: Using demo secret for roll: 24071A6222
Calculated HMAC: abc123...
Received HMAC: 573660...
❌ INVALID
Invalid QR code (demo secret mismatch)
```

## 🎯 Success Checklist

Before reporting an issue, verify:

- [ ] Passport app has demo secret for custom roll
- [ ] Scanner app has SAME demo secret for that roll
- [ ] Both secrets match exactly (check localStorage)
- [ ] QR code is fresh (< 15 seconds old)
- [ ] Browser console shows "Dev Mode: Using demo secret"
- [ ] Roll number in QR matches the custom roll

## 🚀 Production vs Development

### Development (Demo Mode):
- Uses `demo_secret_[roll]` pattern
- Both apps need same demo secret
- Only for testing custom rolls
- Shows "(demo mode)" in scan results

### Production (Real Secrets):
- Uses cryptographically random secrets
- Generated by API server
- Stored in database
- Synced to scanner via API
- Required for real student verification

## 📞 Need More Help?

If QR still shows INVALID after following all steps:

1. Clear browser cache and localStorage:
   ```javascript
   localStorage.clear()
   location.reload()
   ```

2. Restart both apps

3. Check the exact QR string and manually verify HMAC as shown in Step 3

4. Share console logs from both apps for debugging

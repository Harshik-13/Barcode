import { useEffect, useState, useCallback } from 'react'
import { verifyQR } from './shared/crypto'
import CameraScanner from './components/CameraScanner'
import GoogleLogin from './components/GoogleLogin'
import { storeScanLog, getUnsyncedLogs, storeKeys } from './idb'
import { loadHostelData, isAuthorizedForHostel, getHostelStats } from './hostelData'

export default function App(){
  const [loggedIn, setLoggedIn] = useState(false)
  const [token, setToken] = useState('')
  const [qr, setQr] = useState('')
  const [status, setStatus] = useState<'idle'|'valid'|'expired'|'invalid'|'not-authorized'>('idle')
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState('')
  const authDisabled = import.meta.env.VITE_DISABLE_AUTH === 'true'
  const [hostelDataLoaded, setHostelDataLoaded] = useState(false)
  const [availableHostels, setAvailableHostels] = useState<Array<{hostelId: string, count: number}>>([])
  const [selectedHostel, setSelectedHostel] = useState<string>(
    localStorage.getItem('selected_hostel') || import.meta.env.VITE_HOSTEL_ID || 'BH1'
  )
  const [verifyKind, setVerifyKind] = useState<'hostel'|'event'|'gatepass'>(
    (localStorage.getItem('verify_kind') as any) || 'hostel'
  )
  const [verifyValue, setVerifyValue] = useState<string>(
    localStorage.getItem('verify_value') || ''
  )
  const membershipCache = (window as any)._membershipCache || ((window as any)._membershipCache = new Map<string, Set<string>>())
  
  // New UI states
  const [menuOpen, setMenuOpen] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<string>('')
  const [todayStats, setTodayStats] = useState({ total: 0, valid: 0, invalid: 0, notAuth: 0 })
  const [lastScanRoll, setLastScanRoll] = useState('')
  const [lastScanName, setLastScanName] = useState('')
  const [lastScanType, setLastScanType] = useState<'qr'|'barcode'>('qr')

  // Load hostel data on startup
  useEffect(() => {
    try {
      loadHostelData()
      const stats = getHostelStats()
      console.log('📋 Hostel data loaded:', stats)
      setAvailableHostels(stats)
      setHostelDataLoaded(true)
    } catch (err) {
      console.error('❌ Failed to load hostel data:', err)
      setError('Failed to load hostel data')
    }
  }, [])

  // Save selected hostel to localStorage
  useEffect(() => {
    localStorage.setItem('selected_hostel', selectedHostel)
  }, [selectedHostel])

  // Persist verify context
  useEffect(() => {
    localStorage.setItem('verify_kind', verifyKind)
    localStorage.setItem('verify_value', verifyValue)
  }, [verifyKind, verifyValue])

  // Check if already logged in
  useEffect(() => {
    if (authDisabled) {
      setLoggedIn(true)
      return
    }
    const stored = localStorage.getItem('scanner_token')
    if (stored) {
      setToken(stored)
      setLoggedIn(true)
    }
  }, [authDisabled])

  useEffect(() => {
    // Register service worker with background sync capability
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/src/sw.ts').catch(() => {})
    }
  }, [])

  async function ensureMembership(kind: string, value: string): Promise<Set<string>> {
    const key = `${kind}:${value}`
    const cached = membershipCache.get(key)
    if (cached) return cached
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sync/memberships?kind=${encodeURIComponent(kind)}&value=${encodeURIComponent(value)}`)
      if (res.ok) {
        const j = await res.json()
        const set = new Set<string>(j.rolls || [])
        membershipCache.set(key, set)
        return set
      }
    } catch {}
    return new Set()
  }

  const handleScan = useCallback(async (text: string) => {
    setQr(text)
    
    // Detect if this is a barcode (simple roll number) or QR code (with pipes)
    const isBarcode = !text.includes('|')
    let roll: string
    
    if (isBarcode) {
      // Barcode: just the roll number
      roll = text.trim()
      console.log('📊 Barcode scanned:', roll)
    } else {
      // QR code: extract roll from first part
      roll = text.split('|')[0]
      console.log('📱 QR code scanned:', roll)
    }
    
    // Authorization check by selected context
    if (verifyKind === 'hostel') {
      if (!isAuthorizedForHostel(roll, selectedHostel)) {
        setStatus('not-authorized')
        await storeScanLog({
          roll,
          mode: 'Hostel In',
          hostel_id: selectedHostel,
          timestamp: Date.now(),
          status: 'not-authorized',
          metadata: { online: false, reason: 'Not in hostel roster', scanType: isBarcode ? 'barcode' : 'qr' }
        })
        return
      }
    } else {
      const targetValue = verifyValue.trim()
      if (!targetValue) {
        setStatus('not-authorized')
        setMessage('Specify value for selected verification (e.g., Event1)')
        return
      }
      const set = await ensureMembership(verifyKind, targetValue)
      if (!set.has(roll)) {
        setStatus('not-authorized')
        await storeScanLog({
          roll,
          mode: verifyKind,
          hostel_id: selectedHostel,
          timestamp: Date.now(),
          status: 'not-authorized',
          metadata: { online: true, reason: `${verifyKind}:${targetValue} membership missing`, scanType: isBarcode ? 'barcode' : 'qr' }
        })
        return
      }
    }
    
    // For barcodes, skip HMAC verification and just validate membership
    if (isBarcode) {
      setStatus('valid')
      setMessage(`Barcode: ${roll}`)
      await storeScanLog({
        roll,
        mode: verifyKind === 'hostel' ? 'Hostel In' : verifyKind,
        hostel_id: selectedHostel,
        timestamp: Date.now(),
        status: 'valid',
        metadata: { online: false, verify: verifyKind, value: verifyKind==='hostel'?selectedHostel:verifyValue, scanType: 'barcode' }
      })
      return
    }
    
    // For QR codes, do HMAC verification
    // Try online verification
    try{
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/verify/online`,{
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ qr: text })
      })
      const j = await res.json()
      if (j.status === 'valid') {
        setStatus('valid')
      } else if (j.status === 'expired') setStatus('expired')
      else setStatus('invalid')
      await storeScanLog({
        roll,
        mode: verifyKind === 'hostel' ? 'Hostel In' : verifyKind,
        hostel_id: selectedHostel,
        timestamp: Date.now(),
        status: j.status,
        metadata: { online: true, verify: verifyKind, value: verifyKind==='hostel'?selectedHostel:verifyValue, scanType: 'qr' }
      })
      return
    }catch(err){
      // offline: try local verification using cached keys
      const localSecret = localStorage.getItem('demo_secret_' + roll)
      if (localSecret && await verifyQR(text, localSecret)) setStatus('valid')
      else setStatus('invalid')
      await storeScanLog({
        roll,
        mode: verifyKind === 'hostel' ? 'Hostel In' : verifyKind,
        hostel_id: selectedHostel,
        timestamp: Date.now(),
        status: (localSecret ? 'valid' : 'invalid'),
        metadata: { online: false, verify: verifyKind, value: verifyKind==='hostel'?selectedHostel:verifyValue, scanType: 'qr' }
      })
    }
  }, [verifyKind, selectedHostel, verifyValue])

  async function syncNow() {
    setMessage('Syncing...')
    // Upload logs
    const logs = await getUnsyncedLogs()
    if (logs.length) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sync/logs`, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ logs })
        })
        if (res.ok) setMessage(`Uploaded ${logs.length} logs`)
      } catch (e) {
        setMessage('Upload failed; will retry via background sync')
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const reg = await navigator.serviceWorker.ready
          try { await (reg as any).sync?.register('sync-logs') } catch {}
        }
      }
    }
    // Download hostel keys
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sync/hostel-keys?hostelId=${selectedHostel}`)
      if (res.ok) {
        const j = await res.json()
        const keys = j.bundle.map((k: any) => ({ roll: k.roll, secret_b64: k.secret_b64 }))
        await storeKeys(keys)
        setMessage(m => (m ? m + ' • ' : '') + `Fetched ${keys.length} keys`)
      }
    } catch {}
  }

  function handleLoginSuccess(jwtToken: string) {
    localStorage.setItem('scanner_token', jwtToken)
    setToken(jwtToken)
    setLoggedIn(true)
  }

  function handleLogout() {
    localStorage.removeItem('scanner_token')
    setLoggedIn(false)
    setToken('')
  }

  if (!loggedIn && !authDisabled) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h1>VJ Scanner — Security App</h1>
        <p>Sign in with your authorized email (@vnrvjiet.in)</p>
        <GoogleLogin onSuccess={handleLoginSuccess} onError={(msg) => setError(msg)} />
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      </div>
    )
  }

  if (!hostelDataLoaded) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h1>VJ Scanner</h1>
        <p>Loading hostel data...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>VJ Scanner</h1>
      {/* Verification Context */}
      <div style={{ marginBottom: 15, padding: 12, background: '#eef6ff', border: '1px solid #b6daff', borderRadius: 6 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label>
            <span style={{ fontWeight: 'bold', marginRight: 8 }}>Verify:</span>
            <select value={verifyKind} onChange={e => setVerifyKind(e.target.value as any)}>
              <option value="hostel">Hostel</option>
              <option value="event">Event</option>
              <option value="gatepass">GatePass</option>
            </select>
          </label>
          {verifyKind === 'hostel' ? (
            <span style={{ color: '#555' }}>Using selected hostel roster below</span>
          ) : (
            <input 
              type="text" 
              placeholder={verifyKind==='event' ? 'Event name (e.g., Event1)' : 'GatePass list name'} 
              value={verifyValue}
              onChange={e => setVerifyValue(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ced4da', width: 240 }}
            />
          )}
        </div>
      </div>

      {/* Hostel Selector */}
      <div style={{ marginBottom: 15, padding: 12, background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 6 }}>
        <label htmlFor="hostel-select" style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>
          Select Hostel:
        </label>
        <select 
          id="hostel-select"
          value={selectedHostel} 
          onChange={(e) => setSelectedHostel(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            fontSize: 16, 
            borderRadius: 4, 
            border: '1px solid #ced4da',
            width: '100%',
            maxWidth: 300,
            cursor: 'pointer'
          }}
        >
          {availableHostels.map(h => (
            <option key={h.hostelId} value={h.hostelId}>
              {h.hostelId === 'BH1' ? 'BH1 - Boys Main Hostel' : 
               h.hostelId === 'GH1' ? 'GH1 - Girls Main Hostel' : h.hostelId} 
              {' '}({h.count} students)
            </option>
          ))}
        </select>
      </div>

      {authDisabled && <div style={{ marginBottom: 10, padding: 8, background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4 }}>⚠️ Authentication disabled (dev mode)</div>}
      <div style={{ marginBottom: 10 }}>
        {!authDisabled && <button onClick={handleLogout}>Logout</button>}
      </div>

      {/* Scan Results Display - Above Camera */}
      {status !== 'idle' && (
        <div style={{ 
          marginBottom: 15, 
          padding: 16, 
          borderRadius: 8,
          background: status === 'valid' ? '#d4edda' : 
                      status === 'expired' ? '#fff3cd' : 
                      status === 'invalid' ? '#f8d7da' : '#cfe2ff',
          border: `2px solid ${status === 'valid' ? '#28a745' : 
                               status === 'expired' ? '#ffc107' : 
                               status === 'invalid' ? '#dc3545' : '#0d6efd'}`,
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
            {status === 'valid' && '✅ VALID'}
            {status === 'expired' && '🟡 EXPIRED'}
            {status === 'invalid' && '🔴 INVALID'}
            {status === 'not-authorized' && '🔵 NOT AUTHORIZED'}
          </div>
          {qr && (
            <>
              <div style={{ fontSize: 18, marginBottom: 4 }}>
                <strong>Roll:</strong> {qr.split('|')[0]}
              </div>
              {qr.includes('|') && qr.split('|').length >= 2 && qr.split('|')[1] && !qr.split('|')[1].match(/^\d+$/) && (
                <div style={{ fontSize: 16, marginBottom: 4 }}>
                  <strong>Name:</strong> {qr.split('|')[1]}
                </div>
              )}
              {message && <div style={{ fontSize: 14, color: '#555', marginTop: 8 }}>{message}</div>}
            </>
          )}
        </div>
      )}

      <CameraScanner key="scanner-main" onDetected={handleScan} />
      
      <div style={{ marginTop: 15 }}>
        <textarea placeholder="Paste QR here" value={qr} onChange={e=>setQr(e.target.value)} rows={3} style={{ width: '100%', maxWidth: 360, padding: 8 }} />
      </div>
      <div style={{ marginTop: 10 }}>
        <button onClick={()=>handleScan(qr)}>Verify</button>
        <button style={{ marginLeft: 8 }} onClick={syncNow}>Sync Pending Logs</button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { generateQR, timeStep } from './crypto'
import { storeSecret, getSecret } from './idb'
import GoogleLogin from './components/GoogleLogin'
import StudentActivity from './components/StudentActivity'
import QRCode from 'qrcode'

const REFRESH = Number(import.meta.env.VITE_QR_REFRESH_INTERVAL || 15)
const ENABLE_ROLL_OVERRIDE = import.meta.env.VITE_ENABLE_ROLL_OVERRIDE === 'true'
const APP_ENV = import.meta.env.VITE_APP_ENV || 'dev'
const IS_PRODUCTION = APP_ENV === 'production'

// Hostel name mapping
const HOSTEL_NAMES: Record<string, string> = {
  'BH1': 'Boys Main Hostel',
  'GH1': 'Girls Main Hostel',
  'H1': 'Block H1',
  'H4': 'Block H4',
  'NONE': 'Day Scholar'
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [token, setToken] = useState('')
  const [roll, setRoll] = useState('')
  const [hostelId, setHostelId] = useState('')
  const [name, setName] = useState('')
  const [qr, setQr] = useState('')
  const [qrImage, setQrImage] = useState('')
  const [countdown, setCountdown] = useState(REFRESH)
  const [error, setError] = useState('')
  const [customRoll, setCustomRoll] = useState('')
  const [useCustomRoll, setUseCustomRoll] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showActivity, setShowActivity] = useState(false)

  // Determine which roll to use for QR generation
  const effectiveRoll = (ENABLE_ROLL_OVERRIDE && useCustomRoll && customRoll) ? customRoll : roll
  const hostelName = HOSTEL_NAMES[hostelId] || hostelId || 'Unknown'

  // Check if already logged in
  useEffect(() => {
    const stored = localStorage.getItem('app_token')
    const storedRoll = localStorage.getItem('app_roll')
    const storedHostel = localStorage.getItem('app_hostel')
    const storedName = localStorage.getItem('app_name') || ''
    if (stored && storedRoll && storedHostel) {
      setToken(stored)
      setRoll(storedRoll)
      setHostelId(storedHostel)
      setName(storedName)
      setLoggedIn(true)
    }
  }, [])

  // Fetch secret after login
  useEffect(() => {
    if (!loggedIn || !token || !roll) return
    let mounted = true
    async function fetchSecret() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/student/secret`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to fetch secret')
        const j = await res.json()
        const secret = atob(j.secret_b64) // decode base64
        await storeSecret({ roll, secret })
      } catch (e: any) {
        if (mounted) setError(e.message)
      }
    }
    fetchSecret()
    return () => { mounted = false }
  }, [loggedIn, token, roll])

  // Fetch secret for custom roll when override is enabled
  useEffect(() => {
    if (!ENABLE_ROLL_OVERRIDE || !useCustomRoll || !customRoll) return
    let mounted = true
    async function fetchCustomSecret() {
      try {
        // Try to get secret from IDB first
        const existing = await getSecret(customRoll)
        if (existing && existing.secret) {
          console.log('Using cached secret for custom roll:', customRoll)
          return
        }
        
        // If not in IDB, show warning that secret needs to be loaded
        console.warn(`⚠️ No secret found for custom roll ${customRoll}. You need to login as that user first, or use demo mode.`)
        setError(`No secret for roll ${customRoll}. Login as that user first or enable demo mode with a test secret.`)
      } catch (e: any) {
        if (mounted) setError(e.message)
      }
    }
    fetchCustomSecret()
    return () => { mounted = false }
  }, [useCustomRoll, customRoll])

  // Generate QR every second
  useEffect(() => {
    if (!loggedIn) return
    let mounted = true
    async function tick() {
      const ts = timeStep()
      // Use effectiveRoll for secret lookup when overriding in dev mode
      const rollForSecret = (ENABLE_ROLL_OVERRIDE && useCustomRoll && customRoll) ? customRoll : roll
      const s = await getSecret(rollForSecret)
      const q = await generateQR(effectiveRoll, s.secret, ts, name) // Include name for QR v2 if configured
      if (mounted) {
        setQr(q)
        // Generate QR code image with logo
        try {
          // First generate the QR code on a canvas
          const canvas = document.createElement('canvas')
          await QRCode.toCanvas(canvas, q, {
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'H', // High error correction to allow logo overlay
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
          
          // Add logo in the center
          const ctx = canvas.getContext('2d')
          if (ctx) {
            const logoSize = 60 // Logo size in pixels
            
            // Draw white background circle for logo
            ctx.fillStyle = '#FFFFFF'
            ctx.beginPath()
            ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 5, 0, 2 * Math.PI)
            ctx.fill()
            
            // Draw a gradient circle as logo (college colors)
            const gradient = ctx.createRadialGradient(
              canvas.width / 2, canvas.height / 2, 0,
              canvas.width / 2, canvas.height / 2, logoSize / 2
            )
            gradient.addColorStop(0, '#667eea')
            gradient.addColorStop(1, '#764ba2')
            
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, 2 * Math.PI)
            ctx.fill()
            
            // Add icon/text in the center
            ctx.fillStyle = '#FFFFFF'
            ctx.font = 'bold 24px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('🎓', canvas.width / 2, canvas.height / 2)
          }
          
          setQrImage(canvas.toDataURL())
        } catch (err) {
          console.error('Failed to generate QR image:', err)
        }
      }
      const rem = REFRESH - (Math.floor(Date.now() / 1000) % REFRESH)
      setCountdown(rem)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => { mounted = false; clearInterval(id) }
  }, [loggedIn, roll, effectiveRoll, customRoll, useCustomRoll, name])

  function handleLoginSuccess(jwtToken: string, userRoll: string, userHostel: string, userName: string) {
    localStorage.setItem('app_token', jwtToken)
    localStorage.setItem('app_roll', userRoll)
    localStorage.setItem('app_hostel', userHostel)
    localStorage.setItem('app_name', userName || '')
    setToken(jwtToken)
    setRoll(userRoll)
    setHostelId(userHostel)
    setName(userName || '')
    setLoggedIn(true)
  }

  function handleLogout() {
    localStorage.removeItem('app_token')
    localStorage.removeItem('app_roll')
    localStorage.removeItem('app_hostel')
    setLoggedIn(false)
    setToken('')
    setRoll('')
    setHostelId('')
    setName('')
    setQr('')
  }

  if (!loggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{ margin: '0 0 10px', color: '#333', fontSize: '28px' }}>PASSPORT</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>Sign in with your college email</p>
          <GoogleLogin onSuccess={handleLoginSuccess} onError={(msg) => setError(msg)} />
          {error && <div style={{ color: '#dc3545', marginTop: '15px', fontSize: '14px' }}>{error}</div>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>PASSPORT</h1>
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '8px',
            transition: 'background 0.3s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >
          ☰
        </button>
      </div>

      {/* Hamburger Menu */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: menuOpen ? 0 : '-100%',
        width: '300px',
        height: '100vh',
        background: 'white',
        boxShadow: menuOpen ? '-5px 0 15px rgba(0,0,0,0.2)' : 'none',
        transition: 'right 0.3s ease',
        zIndex: 1000,
        padding: '20px',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Menu</h2>
          <button 
            onClick={() => setMenuOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Name</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>{name || '(Unknown)'}</div>
        </div>
        
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>ID#</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>{effectiveRoll}</div>
        </div>
        
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Hostel</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>{hostelName}</div>
        </div>
        
        <button 
          onClick={() => {
            setMenuOpen(false)
            setShowActivity(true)
          }}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 600,
            marginBottom: '15px'
          }}
        >
          📊 View My Activity
        </button>

        {!IS_PRODUCTION && (
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Environment</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#ff9800' }}>Development Mode</div>
          </div>
        )}
        
        <button 
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Logout
        </button>
      </div>

      {/* Overlay when menu is open */}
      {menuOpen && (
        <div 
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}
        />
      )}

      {/* Main Content */}
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        {/* Profile Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              {name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '5px' }}>{name || '(Unknown)'}</div>
              <div style={{ fontSize: '14px', color: '#666' }}>ID# {effectiveRoll}</div>
              <div style={{ fontSize: '14px', color: '#666' }}>{hostelName}</div>
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '20px', color: '#333' }}>Your QR Code</h2>
          {qrImage && (
            <div style={{ marginBottom: '20px' }}>
              <img 
                src={qrImage} 
                alt="QR Code" 
                style={{ 
                  maxWidth: '300px', 
                  width: '100%',
                  border: '2px solid #e0e0e0', 
                  borderRadius: '12px' 
                }} 
              />
            </div>
          )}
          <div style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Refreshes in</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>{countdown}s</div>
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            QR code updates every {REFRESH} seconds
          </div>
        </div>

        {/* Dev Tools Section (Only in Development) */}
        {!IS_PRODUCTION && ENABLE_ROLL_OVERRIDE && (
          <div style={{
            background: '#fff3cd',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: '2px solid #ffc107'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#856404', marginBottom: '15px' }}>
              ⚠️ Developer Tools
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={useCustomRoll} 
                  onChange={(e) => setUseCustomRoll(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Override ID Number</span>
              </label>
            </div>

            {useCustomRoll && (
              <div>
                <input 
                  type="text" 
                  value={customRoll} 
                  onChange={(e) => setCustomRoll(e.target.value)}
                  placeholder="Enter ID number"
                  style={{ 
                    width: '100%',
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid #ced4da',
                    fontSize: '14px',
                    marginBottom: '10px',
                    boxSizing: 'border-box'
                  }}
                />
                {customRoll && (
                  <div>
                    <div style={{ fontSize: '13px', color: '#856404', marginBottom: '10px' }}>
                      QR code will show ID# <strong>{customRoll}</strong>
                    </div>
                    <button 
                      onClick={async () => {
                        const demoSecret = `demo_secret_${customRoll}`
                        await storeSecret({ roll: customRoll, secret: demoSecret })
                        localStorage.setItem(`demo_secret_${customRoll}`, demoSecret)
                        setError('')
                        alert(`✅ Demo secret set for ${customRoll}.\n\nNote: Scanner must use demo mode to verify this QR.`)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      Set Demo Secret
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Raw QR Data (Only in Development) */}
        {!IS_PRODUCTION && qr && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: '#666' }}>
              Raw QR Data (Dev Only)
            </div>
            <pre style={{
              background: '#f8f9fa',
              padding: '15px',
              fontSize: '12px',
              wordBreak: 'break-all',
              borderRadius: '8px',
              margin: 0,
              overflow: 'auto',
              fontFamily: 'monospace'
            }}>{qr}</pre>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '8px',
            marginTop: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Student Activity Modal */}
      {showActivity && <StudentActivity onClose={() => setShowActivity(false)} />}
    </div>
  )
}

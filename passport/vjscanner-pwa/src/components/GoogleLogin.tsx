import { useEffect, useRef, useState } from 'react'

type Props = {
  onSuccess: (token: string, email: string) => void
  onError: (msg: string) => void
}

declare global {
  interface Window {
    google?: any
  }
}

// Hardcoded scanner accounts with hostel permissions
const SCANNER_ACCOUNTS = [
  { email: 'boyshostel@gmail.com', password: 'vnrvjiet@123', hostels: ['BH1', 'BH2', 'BH3', 'BH4'], role: 'boys' },
  { email: 'girlshostel@gmail.com', password: 'vnrvjiet@321', hostels: ['GH1', 'GH2', 'GH3', 'GH4'], role: 'girls' },
  { email: 'adminhostel@gmail.com', password: 'vnrvjiet@999', hostels: 'ALL', role: 'admin' }
]

export default function GoogleLogin({ onSuccess, onError }: Props) {
  const [ready, setReady] = useState(false)
  const [showCustomLogin, setShowCustomLogin] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const authServerUrl = import.meta.env.VITE_AUTH_SERVER_URL
  const apiServerUrl = import.meta.env.VITE_API_BASE_URL

  async function handleCustomLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoggingIn(true)
    
    try {
      const account = SCANNER_ACCOUNTS.find(acc => acc.email === username && acc.password === password)
      
      if (!account) {
        onError('Invalid username or password')
        setIsLoggingIn(false)
        return
      }
      
      // Generate a simple token (in production, this should come from server)
      const token = btoa(JSON.stringify({ email: account.email, role: account.role, hostels: account.hostels, ts: Date.now() }))
      
      // Store hostel permissions
      localStorage.setItem('scanner_hostels', JSON.stringify(account.hostels))
      localStorage.setItem('scanner_role', account.role)
      localStorage.setItem('scanner_email', account.email)
      
      onSuccess(token, account.email)
    } catch (err: any) {
      onError(err.message || 'Login failed')
    } finally {
      setIsLoggingIn(false)
    }
  }

  useEffect(() => {
    if (!clientId || clientId.includes('your-google')) {
      onError('VITE_GOOGLE_CLIENT_ID not configured in .env file')
      return
    }

    async function handleCredentialResponse(response: any) {
      const googleIdToken = response.credential
      if (!googleIdToken) return onError('No credential returned')
      
      try {
        // Step 1: Send Google ID token to auth server
        const authRes = await fetch(`${authServerUrl}/auth/google`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token: googleIdToken }),
          credentials: 'include',
        })
        
        if (!authRes.ok) {
          const j = await authRes.json()
          return onError(j.error || 'Auth server login failed')
        }
        
        const authData = await authRes.json()
        const email = authData.user.email
        
        // Store email for Google login
        localStorage.setItem('scanner_email', email)
        localStorage.setItem('scanner_role', 'google')
        localStorage.setItem('scanner_hostels', 'ALL') // Google users get all hostels
        
        onSuccess('google-token-' + Date.now(), email)
        
      } catch (e: any) {
        onError(e.message || 'Network error')
      }
    }

    // Load Google Identity Services
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (!window.google || !buttonRef.current) return
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        })
        window.google.accounts.id.renderButton(
          buttonRef.current,
          { theme: 'outline', size: 'large', text: 'signin_with', width: 280 }
        )
        setReady(true)
      } catch (err: any) {
        onError('Failed to initialize Google Sign-In: ' + err.message)
      }
    }
    script.onerror = () => {
      onError('Failed to load Google Sign-In script')
    }
    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [clientId, onSuccess, onError, authServerUrl, apiServerUrl])

  return (
    <div style={{ width: '100%' }}>
      {!showCustomLogin ? (
        <>
          <div ref={buttonRef} id="google-signin-button-scanner" />
          {!ready && <div style={{ marginTop: 10, color: '#666' }}>Loading Google Sign-In...</div>}
          
          <div style={{ margin: '20px 0', textAlign: 'center', color: '#999', fontSize: '14px' }}>
            — OR —
          </div>
          
          <button
            onClick={() => setShowCustomLogin(true)}
            style={{
              width: '100%',
              padding: '12px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Sign in with Username
          </button>
        </>
      ) : (
        <form onSubmit={handleCustomLogin} style={{ width: '100%' }}>
          <input
            type="text"
            placeholder="Username (email)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowCustomLogin(false)}
              disabled={isLoggingIn}
              style={{
                flex: 1,
                padding: '12px',
                background: '#e0e0e0',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoggingIn ? 'not-allowed' : 'pointer'
              }}
            >
              Back
            </button>
            
            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                flex: 2,
                padding: '12px',
                background: isLoggingIn ? '#9ca3af' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoggingIn ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'

type Props = {
  onSuccess: (token: string, roll: string, hostelId: string, name: string) => void
  onError: (msg: string) => void
}

declare global {
  interface Window {
    google?: any
  }
}

export default function GoogleLogin({ onSuccess, onError }: Props) {
  const [ready, setReady] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const authServerUrl = import.meta.env.VITE_AUTH_SERVER_URL
  const apiServerUrl = import.meta.env.VITE_API_BASE_URL

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
  const name = authData.user.name
        
        // Step 2: Get student info from backend API
        const backendRes = await fetch(`${apiServerUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, name }),
        })
        
        if (!backendRes.ok) {
          return onError('Failed to get student info from backend')
        }
        
  const backendData = await backendRes.json()
  onSuccess(backendData.token, backendData.roll, backendData.hostelId, backendData.name || name)
        
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
    <div>
      <div ref={buttonRef} id="google-signin-button" />
      {!ready && <div style={{ marginTop: 10, color: '#666' }}>Loading Google Sign-In...</div>}
    </div>
  )
}
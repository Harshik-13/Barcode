import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { env } from '../utils/env';
import type { GoogleCredentialResponse } from '../types/google-accounts';

function HiveHexLogo() {
  return (
    <div className="hive-login-hex">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7.5 4.3v9.4L12 21l-7.5-4.3V7.3z" />
      </svg>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="19" height="19">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.6 3 24 3 16.3 3 9.7 7.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.2 0 10-1.9 13.6-5.1l-6.3-5.3C29.2 36.6 26.7 37.5 24 37.5c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 40.5 16.3 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H24v8h11.3c-1 3-3.4 5.4-6.3 6.6l6.3 5.3C39.5 37.1 43 31 43 24c0-1.4-.1-2.7-.4-3.5z" />
    </svg>
  );
}

export default function Login() {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleCredential = async (response: GoogleCredentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const result = await loginWithGoogle(response.credential);
      if (result.needsOnboarding) {
        navigate('/onboarding', { replace: true });
      }
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!env.googleClientId) return;

    const renderButton = () => {
      const gsi = window.google?.accounts?.id;
      if (!gsi || !googleButtonRef.current) return;
      gsi.initialize({
        client_id: env.googleClientId,
        callback: handleGoogleCredential,
        auto_select: false,
      });
      const width = googleButtonRef.current.clientWidth;
      gsi.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        ...(width > 0 ? { width } : {}),
      });
    };

    const loadGoogleScript = () => {
      const existing = document.getElementById('gsi-client-script');
      if (existing) {
        renderButton();
        return;
      }
      const script = document.createElement('script');
      script.id = 'gsi-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderButton;
      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, []);

  return (
    <div className="hive-login-screen">
      <HiveHexLogo />
      <h2>Welcome to Hive</h2>
      <p className="hive-login-tag">Session &amp; attendance tracking for VNR VJIET students.</p>

      {env.googleClientId ? (
        <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: 300 }} />
      ) : (
        <p style={{ color: 'var(--ink-soft)', fontSize: '14px' }}>
          Google Sign-In is not configured.
        </p>
      )}

      <div className="hive-domain-note">
        Sign-in is restricted to <strong>@vnrvjiet.in</strong> college email accounts.
      </div>

      <div className={`hive-login-error${error ? ' show' : ''}`}>
        {error || 'Sign-in blocked — only @vnrvjiet.in accounts can access Hive.'}
      </div>

      <div className="hive-login-legal">
        By continuing, you agree to Hive's <button onClick={() => navigate('/login')}>Terms of Service</button> and <button onClick={() => navigate('/login')}>Privacy Policy</button>.
      </div>

      {loading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(255,255,255,.92)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          zIndex: 70,
        }}>
          <div style={{
            width: 32,
            height: 32,
            border: '3px solid var(--primary-tint)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin .8s linear infinite',
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>Signing in...</span>
        </div>
      )}
    </div>
  );
}

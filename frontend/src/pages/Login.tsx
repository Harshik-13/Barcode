import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { env } from '../utils/env';
import type { GoogleCredentialResponse } from '../types/google-accounts';

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
      <div className="hive-login-hex">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l7.5 4.3v9.4L12 21l-7.5-4.3V7.3z" />
        </svg>
      </div>
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
        Sign-in is restricted to approved <strong>@vnrvjiet.in</strong> and select <strong>@gmail.com</strong> accounts.
      </div>

      <div className={`hive-login-error${error ? ' show' : ''}`}>
        {error || 'Sign-in blocked — only approved accounts can access Hive.'}
      </div>

      <div className="hive-login-legal">
        By continuing, you agree to Hive's <button onClick={() => navigate('/terms')}>Terms of Service</button> and <button onClick={() => navigate('/privacy')}>Privacy Policy</button>.
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

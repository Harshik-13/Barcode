import { useEffect, useRef } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { env } from '../utils/env';
import type { GoogleCredentialResponse } from '../types/google-accounts';

export default function Login() {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleCredential = async (response: GoogleCredentialResponse) => {
    try {
      const result = await loginWithGoogle(response.credential);
      if (result.needsOnboarding) {
        navigate('/onboarding', { replace: true });
      }
    } catch {
      // Error handled by Google SDK UI
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '24px 20px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>Hive</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
          Where Ideas Work Together. Sign in to your account
        </p>

        {env.googleClientId ? (
          <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center' }} />
        ) : (
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Google Sign-In is not configured.
          </p>
        )}
      </div>
    </div>
  );
}

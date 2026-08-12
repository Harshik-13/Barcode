import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { env } from '../utils/env';
import type { GoogleCredentialResponse } from '../types/google-accounts';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const { login, loginWithGoogle, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleCredential = async (response: GoogleCredentialResponse) => {
    setError('');
    try {
      const result = await loginWithGoogle(response.credential);
      if (result.needsOnboarding) {
        navigate('/onboarding', { replace: true });
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Google sign-in failed. Please try again.');
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

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format';
    if (!password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    try {
      await login(email, password);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Login failed. Please check your credentials.');
    }
  };

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
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '24px 20px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>Hive</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
          Where Ideas Work Together. Sign in to your account
        </p>

        {error && (
          <div
            style={{
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {env.googleClientId && (
          <>
            <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ color: '#9ca3af', fontSize: '12px' }}>or sign in with email</span>
              <span style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>
          </>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="email"
            style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: undefined })); }}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${fieldErrors.email ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
          {fieldErrors.email && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.email}</p>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="password"
            style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: undefined })); }}
            required
            minLength={1}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${fieldErrors.password ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
          {fieldErrors.password && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.password}</p>
          )}
        </div>

        <div style={{ textAlign: 'right', marginBottom: '16px' }}>
          <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}
            style={{ color: '#2563eb', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div>
            New student?{' '}
            <a href="/activate" onClick={(e) => { e.preventDefault(); navigate('/activate'); }} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
              Activate your account
            </a>
          </div>
          <div>
            New faculty?{' '}
            <a href="/faculty/activate" onClick={(e) => { e.preventDefault(); navigate('/faculty/activate'); }} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
              Activate your account
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 1) errors.password = 'Password is required';
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
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '32px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>8Hour Workspace</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
          Sign in to your account
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
      </form>
    </div>
  );
}

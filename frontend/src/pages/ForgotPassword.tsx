import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim() },
      });
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '24px 20px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>8Hour Workspace</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>Reset your password</p>

        {error && (
          <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {sent ? (
          <div>
            <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', color: '#15803d', fontSize: '14px', marginBottom: '16px' }}>
              If the account exists, password reset instructions have been sent.
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>College Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}
            >
              {sending ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px' }}>
              <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}
                style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                Back to Login
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

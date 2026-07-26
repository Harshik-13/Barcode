import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState({ new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. No token provided.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: { token, newPassword, confirmPassword },
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
  };

  const toggleBtnStyle: React.CSSProperties = {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#6b7280',
    padding: '4px',
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '24px 20px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>8Hour Workspace</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>Set a new password</p>

        {error && (
          <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {success ? (
          <div>
            <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', color: '#15803d', fontSize: '14px', marginBottom: '16px' }}>
              Password has been reset successfully. You can now log in with your new password.
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>New Password</label>
              <div style={wrapperStyle}>
                <input
                  id="newPassword"
                  style={inputStyle}
                  type={showPw.new ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  style={toggleBtnStyle}
                  onClick={() => setShowPw({ ...showPw, new: !showPw.new })}
                  tabIndex={-1}
                >
                  {showPw.new ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>Confirm New Password</label>
              <div style={wrapperStyle}>
                <input
                  id="confirmPassword"
                  style={inputStyle}
                  type={showPw.confirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  style={toggleBtnStyle}
                  onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                  tabIndex={-1}
                >
                  {showPw.confirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !token}
              style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', opacity: saving || !token ? 0.7 : 1 }}
            >
              {saving ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

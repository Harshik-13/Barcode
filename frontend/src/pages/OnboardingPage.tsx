import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { api } from '../services/api';
import { BRANCHES, SECTIONS, HOSTELS } from '@workspace/shared';

export default function OnboardingPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [branch, setBranch] = useState('');
  const [section, setSection] = useState('');
  const [hostel, setHostel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    if (user && user.role !== 'student') {
      navigate('/dashboard', { replace: true });
      return;
    }
    api<{ needsOnboarding: boolean }>('/api/auth/onboarding/status')
      .then((res) => {
        if (!res.needsOnboarding) navigate('/dashboard', { replace: true });
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [isAuthenticated, user, navigate]);

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#f9fafb' }}>
        <p style={{ color: '#6b7280' }}>Loading...</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!branch.trim()) { setError('Branch is required'); return; }
    if (!section.trim()) { setError('Section is required'); return; }
    setLoading(true);
    try {
      await api('/api/auth/onboarding', {
        method: 'POST',
        body: { branch: branch.trim(), section: section.trim(), hostel: hostel.trim() || undefined },
      });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '16px', background: '#f9fafb' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '24px 20px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>Welcome to Hive</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>Complete your profile to get started</p>

        {error && (
          <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Branch *</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: '#fff' }}
            >
              <option value="">Select branch</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Section *</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: '#fff' }}
            >
              <option value="">Select section</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Hostel (optional)</label>
            <select
              value={hostel}
              onChange={(e) => setHostel(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: '#fff' }}
            >
              <option value="">Select hostel</option>
              {HOSTELS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

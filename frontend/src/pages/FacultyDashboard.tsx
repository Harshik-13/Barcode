import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { sessionsApi } from '../services/apiService';
import type { SessionWithDetails } from '../services/apiService';
import type { SessionStatus } from '@workspace/shared';

const STATUS_LABELS: Record<SessionStatus, string> = {
  created: 'Created',
  active: 'Active',
  awaiting_summary: 'Awaiting Summary',
  completed: 'Completed',
  archived: 'Archived',
};

const STATUS_COLORS: Record<SessionStatus, string> = {
  created: '#f59e0b',
  active: '#10b981',
  awaiting_summary: '#f97316',
  completed: '#6b7280',
  archived: '#9ca3af',
};

export default function FacultyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSessions, setActiveSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    const activeStatuses = ['created', 'active', 'awaiting_summary'];
    Promise.all(
      activeStatuses.map((status) =>
        sessionsApi.list({ status, limit: 20 })
          .then((r) => r.data)
          .catch(() => [] as SessionWithDetails[])
      )
    )
      .then((results) => {
        setActiveSessions(results.flat());
      })
      .catch(() => setError('Failed to load active sessions'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Dashboard</h1>
          <p style={{ color: '#6b7280' }}>Welcome, {user?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/scanner')}
            style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
          >
            Open Scanner
          </button>
        </div>
      </div>

      <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Active & Pending Sessions</h2>
        {activeSessions.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No active sessions</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Student</th>
                <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Roll</th>
                <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Entry Time</th>
                <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{s.studentName || `Student #${s.studentId}`}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>{s.studentRoll || '-'}</td>
                  <td style={{ padding: '8px 12px' }}>{new Date(s.entryTime).toLocaleString()}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, background: `${STATUS_COLORS[s.status as SessionStatus]}20`, color: STATUS_COLORS[s.status as SessionStatus] }}>
                      {STATUS_LABELS[s.status as SessionStatus] || s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

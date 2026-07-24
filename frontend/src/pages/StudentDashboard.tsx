import { useState, useEffect } from 'react';
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

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<SessionWithDetails | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError('');

    Promise.all([
      sessionsApi.getActive(user.id).catch(() => ({ data: null })),
      sessionsApi.list({ studentId: user.id, limit: 10 }).catch(() => ({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } })),
    ])
      .then(([activeRes, listRes]) => {
        setActiveSession(activeRes.data);
        setRecentSessions(listRes.data);
      })
      .catch(() => setError('Failed to load session data'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
        Loading your dashboard...
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
      <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Dashboard</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>Welcome, {user?.name}</p>

      {activeSession && (
        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Current Session</h2>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Status</span>
              <span style={{ display: 'inline-block', marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, background: `${STATUS_COLORS[activeSession.status as SessionStatus]}20`, color: STATUS_COLORS[activeSession.status as SessionStatus] }}>
                {STATUS_LABELS[activeSession.status as SessionStatus] || activeSession.status}
              </span>
            </div>
            <div>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Entry</span>
              <span style={{ marginLeft: '8px', fontSize: '14px' }}>{new Date(activeSession.entryTime).toLocaleString()}</span>
            </div>
            {activeSession.exitTime && (
              <div>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Exit</span>
                <span style={{ marginLeft: '8px', fontSize: '14px' }}>{new Date(activeSession.exitTime).toLocaleString()}</span>
              </div>
            )}
            {activeSession.categoryName && (
              <div>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Category</span>
                <span style={{ marginLeft: '8px', fontSize: '14px' }}>{activeSession.categoryName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Recent Sessions</h2>
        {recentSessions.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No sessions yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Date</th>
                <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Entry</th>
                <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Exit</th>
                <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Category</th>
                <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px' }}>{new Date(s.entryTime).toLocaleDateString()}</td>
                  <td style={{ padding: '8px 12px' }}>{new Date(s.entryTime).toLocaleTimeString()}</td>
                  <td style={{ padding: '8px 12px' }}>{s.exitTime ? new Date(s.exitTime).toLocaleTimeString() : '-'}</td>
                  <td style={{ padding: '8px 12px' }}>{s.categoryName || '-'}</td>
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

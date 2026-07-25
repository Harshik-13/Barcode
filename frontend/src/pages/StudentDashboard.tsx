import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sessionsApi, notificationsApi } from '../services/apiService';
import type { SessionWithDetails, NotificationItem, SessionStats } from '../services/apiService';
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

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds && seconds !== 0) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<SessionWithDetails | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionWithDetails[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [pendingSummaries, setPendingSummaries] = useState<SessionWithDetails[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const studentId = user?.studentId ?? user?.id;

  const fetchData = useCallback(() => {
    if (!user) return;
    setError('');

    Promise.all([
      sessionsApi.getActive(studentId).catch(() => ({ data: null })),
      sessionsApi.list({ studentId, limit: 10, page: historyPage }).catch(() => ({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } })),
      sessionsApi.list({ studentId, status: 'awaiting_summary', limit: 20 }).catch(() => ({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })),
      notificationsApi.list(1, 5).catch(() => ({ data: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } })),
      notificationsApi.unreadCount().catch(() => ({ data: { count: 0 } })),
    ])
      .then(([activeRes, listRes, pendingRes, notifRes, unreadRes]) => {
        setActiveSession(activeRes.data);
        setRecentSessions(listRes.data);
        setHistoryTotal(listRes.pagination.total);
        setHistoryTotalPages(listRes.pagination.totalPages);
        setPendingSummaries(pendingRes.data);
        setNotifications(notifRes.data);
        setUnreadCount(unreadRes.data.count);
      })
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [user, studentId, historyPage]);

  const fetchStats = useCallback(() => {
    if (!user) return;
    sessionsApi.stats(studentId).then(r => setStats(r.data)).catch(() => {});
  }, [user, studentId]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData, user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats, user]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading your dashboard...</div>;
  }

  if (error) {
    return <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>{error}</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Dashboard</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>Welcome, {user?.name}</p>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <StatCard label="Total Sessions" value={stats.totalSessions} color="#3b82f6" />
          <StatCard label="Total Time" value={formatDuration(stats.totalDurationSeconds)} color="#8b5cf6" />
          <StatCard label="Avg Session" value={formatDuration(stats.averageDurationSeconds)} color="#14b8a6" />
          <StatCard label="Current Streak" value={`${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`} color="#f97316" />
        </div>
      )}

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Current Session</h2>
          {activeSession ? (
            <div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Status </span>
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, background: `${STATUS_COLORS[activeSession.status as SessionStatus]}20`, color: STATUS_COLORS[activeSession.status as SessionStatus] }}>
                  {STATUS_LABELS[activeSession.status as SessionStatus] || activeSession.status}
                </span>
              </div>
              <div style={{ marginBottom: '4px' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>Entry </span><span style={{ fontSize: '14px' }}>{new Date(activeSession.entryTime).toLocaleString()}</span></div>
              {activeSession.exitTime && <div style={{ marginBottom: '4px' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>Exit </span><span style={{ fontSize: '14px' }}>{new Date(activeSession.exitTime).toLocaleString()}</span></div>}
              {activeSession.categoryName && <div style={{ marginBottom: '4px' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>Category </span><span style={{ fontSize: '14px' }}>{activeSession.categoryName}</span></div>}
              {activeSession.status === 'active' && (
                <div style={{ marginBottom: '4px' }}><span style={{ color: '#6b7280', fontSize: '14px' }}>Duration </span><span style={{ fontSize: '14px', fontWeight: 500 }}>{formatDuration(Math.round((Date.now() - new Date(activeSession.entryTime).getTime()) / 1000))}</span></div>
              )}
              <button onClick={() => navigate(`/sessions/${activeSession.id}`)} style={{ marginTop: '12px', padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                View Details
              </button>
            </div>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>No active session</p>
          )}
        </div>

        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Pending Summaries</h2>
          {pendingSummaries.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>All caught up!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendingSummaries.map((s) => (
                <div key={s.id} style={{ padding: '12px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a', cursor: 'pointer' }} onClick={() => navigate(`/sessions/${s.id}`)}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{new Date(s.entryTime).toLocaleDateString()} — {new Date(s.entryTime).toLocaleTimeString()}</div>
                  <div style={{ fontSize: '13px', color: '#92400e' }}>Click to submit summary</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px' }}>Recent Notifications</h2>
            {unreadCount > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '999px', padding: '2px 8px', fontSize: '12px', fontWeight: 600 }}>{unreadCount}</span>}
          </div>
          {notifications.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>No notifications</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map((n) => (
                <div key={n.id} style={{ padding: '10px', background: n.isRead ? 'transparent' : '#eff6ff', borderRadius: '6px', fontSize: '14px', border: n.isRead ? '1px solid transparent' : '1px solid #bfdbfe' }}>
                  <div style={{ fontWeight: n.isRead ? 400 : 500 }}>{n.message}</div>
                  <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '2px' }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
              <button onClick={() => navigate('/notifications')} style={{ marginTop: '8px', padding: '6px 12px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#6b7280' }}>
                View All
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>Recent Sessions</h2>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>{historyTotal} session(s)</span>
        </div>
        {recentSessions.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No sessions yet</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Date</th>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Entry</th>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Exit</th>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Duration</th>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Category</th>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}></th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => navigate(`/sessions/${s.id}`)}>
                    <td style={{ padding: '8px 12px' }}>{new Date(s.entryTime).toLocaleDateString()}</td>
                    <td style={{ padding: '8px 12px' }}>{new Date(s.entryTime).toLocaleTimeString()}</td>
                    <td style={{ padding: '8px 12px' }}>{s.exitTime ? new Date(s.exitTime).toLocaleTimeString() : '-'}</td>
                    <td style={{ padding: '8px 12px' }}>{s.exitTime ? formatDuration(s.durationSeconds) : <LiveDuration entryTime={s.entryTime} />}</td>
                    <td style={{ padding: '8px 12px' }}>{s.categoryName || '-'}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, background: `${STATUS_COLORS[s.status as SessionStatus]}20`, color: STATUS_COLORS[s.status as SessionStatus] }}>
                        {STATUS_LABELS[s.status as SessionStatus] || s.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#2563eb', fontSize: '13px' }}>View</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {historyTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                <button disabled={historyPage <= 1} onClick={() => setHistoryPage(historyPage - 1)} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: historyPage <= 1 ? 'default' : 'pointer', opacity: historyPage <= 1 ? 0.5 : 1 }}>
                  Prev
                </button>
                <span style={{ padding: '6px 12px', fontSize: '14px', color: '#6b7280' }}>{historyPage} / {historyTotalPages}</span>
                <button disabled={historyPage >= historyTotalPages} onClick={() => setHistoryPage(historyPage + 1)} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: historyPage >= historyTotalPages ? 'default' : 'pointer', opacity: historyPage >= historyTotalPages ? 0.5 : 1 }}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: 700, color: color || '#111827', margin: 0 }}>{value}</p>
    </div>
  );
}

function LiveDuration({ entryTime }: { entryTime: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);
  return <span>{formatDuration(Math.round((now - new Date(entryTime).getTime()) / 1000))}</span>;
}

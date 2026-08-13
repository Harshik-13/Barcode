import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sessionsApi, notificationsApi, categoriesApi } from '../services/apiService';
import type { SessionWithDetails, NotificationItem, SessionStats } from '../services/apiService';
import type { Category } from '@workspace/shared';
import { STATUS_LABELS, formatDuration } from '../utils/sessionStatus';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning,';
  if (h < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function SessionRing({ seconds }: { seconds: number }) {
  const circumference = 2 * Math.PI * 27;
  const maxSeconds = 4 * 3600;
  const progress = Math.min(seconds / maxSeconds, 1);
  const offset = circumference * (1 - progress);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const timeStr = h > 0 ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(Math.floor((seconds % 60))).padStart(2, '0')}`;
  return (
    <div className="hive-ring-wrap">
      <svg viewBox="0 0 64 64" width="64" height="64">
        <circle cx="32" cy="32" r="27" fill="none" stroke="#E1D9FA" strokeWidth="6" />
        <circle cx="32" cy="32" r="27" fill="none" stroke="#5B3FE0" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="hive-ring-time">
        <span className="t">{timeStr}</span>
        <span className="l">Duration</span>
      </div>
    </div>
  );
}

const CAT_COLORS: Record<string, string> = {
  coding: 'linear-gradient(150deg,#6E52E8,#4B33B8)',
  ai: 'linear-gradient(150deg,#3AA0C4,#217691)',
  startup: 'linear-gradient(150deg,#EFAE4E,#C6811F)',
  research: 'linear-gradient(150deg,#42B583,#268057)',
};

function catColor(name?: string | null) {
  if (!name) return 'linear-gradient(150deg,#6E52E8,#4B33B8)';
  const key = name.toLowerCase();
  return CAT_COLORS[key] || 'linear-gradient(150deg,#6E52E8,#4B33B8)';
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDuration, setActiveDuration] = useState(0);

  const fetchData = useCallback(() => {
    if (!user) return;
    const sid = user.studentId ?? user.id;
    setError('');

    Promise.all([
      sessionsApi.getActive(sid).catch(() => ({ data: null })),
      sessionsApi.list({ studentId: sid, limit: 10, page: historyPage }).catch(() => ({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } })),
      sessionsApi.list({ studentId: sid, status: 'awaiting_summary', limit: 20 }).catch(() => ({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })),
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
  }, [user, historyPage]);

  const fetchStats = useCallback(() => {
    if (!user) return;
    const sid = user.studentId ?? user.id;
    sessionsApi.stats(sid).then(r => setStats(r.data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats, user]);

  useEffect(() => {
    if (!activeSession || activeSession.categoryId !== null) return;
    categoriesApi.list('active').then(r => setCategories(r.data)).catch(() => {});
  }, [activeSession]);

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') return;
    const tick = () => setActiveDuration(Math.round((Date.now() - new Date(activeSession.entryTime).getTime()) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  async function handleSelectCategory(categoryId: number) {
    if (!activeSession) return;
    setCategoryLoading(true);
    try {
      await sessionsApi.updateCategory(activeSession.id, categoryId);
      setActiveSession(null);
      fetchData();
    } catch {
      setError('Failed to set category');
    } finally {
      setCategoryLoading(false);
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--ink-soft)' }}>Loading your dashboard...</div>;
  }

  if (error) {
    return <div style={{ padding: '16px', background: 'var(--red-tint)', borderRadius: 'var(--radius-md)', color: 'var(--red)' }}>{error}</div>;
  }

  const isActive = activeSession?.status === 'active';
  const isAwaiting = activeSession?.status === 'awaiting_summary';

  return (
    <div>
      {/* Greeting */}
      <div className="hive-greeting">
        <div className="hello">{getGreeting()}</div>
        <h2>{user?.name?.split(' ')[0] || 'Student'}</h2>
      </div>

      {/* Active Session Card */}
      {activeSession ? (
        <>
          <div className="hive-section-title" style={{ marginTop: 20 }}>Today's session</div>
          <div className="hive-active-card">
            <div className="hive-active-top">
              <div className="hive-active-cat">
                <div className="hive-cat-hex" style={{ background: catColor(activeSession.categoryName) }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 8 4 12.5 9 17" /><polyline points="15 8 20 12.5 15 17" />
                  </svg>
                </div>
                <div>
                  <div className="hive-active-label">Category</div>
                  <div className="hive-active-cat-name">
                    {activeSession.categoryName || (
                      <select
                        value=""
                        disabled={categoryLoading}
                        onChange={(e) => { const val = parseInt(e.target.value, 10); if (val) handleSelectCategory(val); }}
                        style={{ fontSize: '14px', padding: '4px 8px', borderRadius: '8px', border: '1.5px solid var(--line)', background: 'var(--surface-alt)', fontFamily: 'inherit', fontWeight: 700 }}
                      >
                        <option value="">Select...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
              <span className={`hive-badge ${isActive ? 'hive-badge-active' : 'hive-badge-ended'}`}>
                {isActive ? 'Active' : isAwaiting ? 'Awaiting' : 'Ended'}
              </span>
            </div>
            <div className="hive-active-bottom">
              <div>
                <div className="hive-active-label">Entry time</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15 }}>{formatTime(activeSession.entryTime)}</div>
              </div>
              {isActive && <SessionRing seconds={activeDuration} />}
              {!isActive && activeSession.exitTime && (
                <div style={{ textAlign: 'right' }}>
                  <div className="hive-active-label">Exit time</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15 }}>{formatTime(activeSession.exitTime)}</div>
                </div>
              )}
            </div>
            <button className="hive-view-details" onClick={() => navigate(`/sessions/${activeSession.id}`)}>
              View details
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
            </button>
          </div>
        </>
      ) : null}

      {/* Stats Grid */}
      {stats && (
        <>
          <div className="hive-section-title">Your stats</div>
          <div className="hive-stat-grid">
            <div className="hive-stat-tile">
              <div className="hive-stat-icon hive-ic-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
              </div>
              <div className="hive-stat-label">Avg session</div>
              <div className="hive-stat-value">{formatDuration(stats.averageDurationSeconds)}</div>
            </div>
            <div className="hive-stat-tile">
              <div className="hive-stat-icon hive-ic-amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-1.3.5-2.2 1.2-3.2.4.9 1.1 1.4 1.8 1.4-.3-3 1-4.7 2-6.2 0 2 1 2.7 1 4 .6-.6 1-1.6 1-3.2 1 1.5 3 3.3 3 7.2" /></svg>
              </div>
              <div className="hive-stat-label">Current streak</div>
              <div className="hive-stat-value">{stats.currentStreak} Day{stats.currentStreak !== 1 ? 's' : ''}</div>
            </div>
            <div className="hive-stat-tile">
              <div className="hive-stat-icon hive-ic-teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>
              </div>
              <div className="hive-stat-label">Total sessions</div>
              <div className="hive-stat-value">{stats.totalSessions}</div>
            </div>
            <div className="hive-stat-tile">
              <div className="hive-stat-icon hive-ic-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="8.5 12.5 11 15 15.5 9.5" /></svg>
              </div>
              <div className="hive-stat-label">Total time</div>
              <div className="hive-stat-value">{formatDuration(stats.totalDurationSeconds)}</div>
            </div>
          </div>
        </>
      )}

      {/* Pending Summaries */}
      {pendingSummaries.length > 0 && (
        <>
          <div className="hive-section-title">Pending summaries</div>
          <div className="hive-card" style={{ padding: '6px 14px' }}>
            {pendingSummaries.map((s) => (
              <div key={s.id} className="hive-att-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/sessions/${s.id}`)}>
                <span className="hive-att-date">{formatDate(s.entryTime)}</span>
                <span className="hive-att-cat">{s.categoryName || 'Session'}</span>
                <span style={{ color: 'var(--amber)', fontWeight: 700, fontSize: 12.5 }}>Pending</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <>
          <div className="hive-section-title">My attendance</div>
          <div className="hive-card" style={{ padding: '6px 14px' }}>
            {recentSessions.map((s) => (
              <div key={s.id} className="hive-att-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/sessions/${s.id}`)}>
                <span className="hive-att-date">{formatDate(s.entryTime)}</span>
                <span className="hive-att-cat">{s.categoryName || 'Session'}</span>
                <span className={`hive-status-pill ${s.status === 'active' ? 'hive-status-active' : s.status === 'completed' ? 'hive-status-active' : 'hive-status-ended'}`}>
                  {STATUS_LABELS[s.status] || s.status}
                </span>
              </div>
            ))}
          </div>
          {historyTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
              <button disabled={historyPage <= 1} onClick={() => setHistoryPage(historyPage - 1)} style={{ padding: '6px 12px', border: '1.5px solid var(--line)', borderRadius: '8px', background: 'var(--surface)', cursor: historyPage <= 1 ? 'default' : 'pointer', opacity: historyPage <= 1 ? 0.5 : 1, fontWeight: 600, fontSize: 13 }}>
                Prev
              </button>
              <span style={{ padding: '6px 12px', fontSize: 14, color: 'var(--ink-soft)' }}>{historyPage} / {historyTotalPages}</span>
              <button disabled={historyPage >= historyTotalPages} onClick={() => setHistoryPage(historyPage + 1)} style={{ padding: '6px 12px', border: '1.5px solid var(--line)', borderRadius: '8px', background: 'var(--surface)', cursor: historyPage >= historyTotalPages ? 'default' : 'pointer', opacity: historyPage >= historyTotalPages ? 0.5 : 1, fontWeight: 600, fontSize: 13 }}>
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <>
          <div className="hive-section-title">Recent notifications</div>
          <div className="hive-card" style={{ padding: '4px 14px' }}>
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} className="hive-notif-row">
                <div className="hive-notif-ic" style={{ background: n.isRead ? 'var(--surface-alt)' : 'var(--primary-tint)', color: n.isRead ? 'var(--ink-faint)' : 'var(--primary)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
                  </svg>
                </div>
                <div className="hive-notif-body">
                  <p className="hive-notif-title">{n.type.replace(/_/g, ' ')}</p>
                  <p className="hive-notif-text">{n.message}</p>
                  <span className="hive-notif-time">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="hive-more-btn" onClick={() => navigate('/notifications')}>
            View more
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
          </button>
        </>
      )}
    </div>
  );
}

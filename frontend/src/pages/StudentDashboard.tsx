import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sessionsApi, categoriesApi } from '../services/apiService';
import type { SessionWithDetails } from '../services/apiService';
import type { Category } from '@workspace/shared';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning,';
  if (h < 17) return 'Good Afternoon,';
  return 'Good Evening,';
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDuration, setActiveDuration] = useState(0);

  const fetchData = useCallback(() => {
    if (!user) return;
    const sid = user.studentId ?? user.id;
    setError('');

    sessionsApi.getActive(sid)
      .then((res) => setActiveSession(res.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchData();
  }, [fetchData, user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, user]);

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
    return <div className="hive-loading">Loading your dashboard...</div>;
  }

  if (error) {
    return <div className="hive-alert-error">{error}</div>;
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

      {/* Today's Session — always visible */}
      <div className="hive-section-title" style={{ marginTop: 20 }}>Today's session</div>
      {activeSession ? (
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
                      className="hive-select"
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
      ) : (
        <div className="hive-active-card" style={{ textAlign: 'center', padding: '24px 18px' }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink-faint)' }}>No current active session</div>
          <button className="hive-view-details" style={{ justifyContent: 'center', marginTop: 8 }} onClick={() => navigate('/stats/history')}>
            View attendance history
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}

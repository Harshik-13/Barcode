import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { sessionsApi, categoriesApi } from '../services/apiService';
import type { SessionWithDetails } from '../services/apiService';
import type { Category } from '@workspace/shared';
import { STATUS_LABELS } from '../utils/sessionStatus';

const CAT_COLORS: Record<string, string> = {
  coding: 'linear-gradient(150deg,#6E52E8,#4B33B8)',
  ai: 'linear-gradient(150deg,#3AA0C4,#217691)',
  startup: 'linear-gradient(150deg,#EFAE4E,#C6811F)',
  research: 'linear-gradient(150deg,#42B583,#268057)',
};

function catColor(name?: string | null) {
  if (!name) return 'linear-gradient(150deg,#6E52E8,#4B33B8)';
  return CAT_COLORS[name.toLowerCase()] || 'linear-gradient(150deg,#6E52E8,#4B33B8)';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDuration(entry: string, exit?: string | null) {
  const start = new Date(entry).getTime();
  const end = exit ? new Date(exit).getTime() : Date.now();
  const diff = Math.max(0, Math.round((end - start) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return h > 0 ? `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m` : `${String(m).padStart(2, '0')}m`;
}

export default function SessionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [activeDuration, setActiveDuration] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      sessionsApi.get(parseInt(id, 10)),
      categoriesApi.list('active'),
    ])
      .then(([sessionRes, catRes]) => {
        setSession(sessionRes.data);
        setSummary(sessionRes.data.summary || '');
        setCategories(catRes.data);
        if (sessionRes.data.categoryId) setSelectedCategory(sessionRes.data.categoryId);
      })
      .catch(() => setError('Session not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!session || session.status !== 'active') return;
    const tick = () => setActiveDuration(Math.round((Date.now() - new Date(session.entryTime).getTime()) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

  function handleSubmitSummary() {
    if (!session || !summary.trim()) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    const categoryId = selectedCategory !== '' ? (selectedCategory as number) : undefined;
    sessionsApi.complete(session.id, summary.trim(), categoryId)
      .then((res) => {
        setSession(res.data);
        setSuccess('Summary submitted successfully');
      })
      .catch(() => setError('Failed to submit summary'))
      .finally(() => setSubmitting(false));
  }

  async function handleEndSession() {
    if (!session) return;
    const ok = window.confirm('End today\'s session?');
    if (!ok) return;
    setEndingSession(true);
    try {
      const categoryId = selectedCategory !== '' ? (selectedCategory as number) : undefined;
      await sessionsApi.complete(session.id, summary.trim() || 'Session ended', categoryId);
      setSession((prev) => prev ? { ...prev, status: 'completed' } : prev);
    } catch {
      setError('Failed to end session');
    } finally {
      setEndingSession(false);
    }
  }

  if (loading) {
    return <div className="hive-loading">Loading session...</div>;
  }

  if (!session) {
    return <div className="hive-alert-error">{error || 'Session not found'}</div>;
  }

  const isActive = session.status === 'active';
  const isAwaiting = session.status === 'awaiting_summary';
  const canSubmit = (user?.role === 'student' && session.studentId === (user?.studentId ?? user?.id) || user?.role === 'faculty' || user?.role === 'admin') && session.status === 'awaiting_summary';

  return (
    <div>
      <div className="hive-card">
        <div className="hive-active-top" style={{ marginBottom: 4 }}>
          <div className="hive-active-cat">
            <div className="hive-cat-hex" style={{ background: catColor(session.categoryName) }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 8 4 12.5 9 17" /><polyline points="15 8 20 12.5 15 17" />
              </svg>
            </div>
            <div className="hive-active-cat-name">{session.categoryName || 'Session'}</div>
          </div>
          <span className={`hive-badge ${isActive ? 'hive-badge-active' : 'hive-badge-ended'}`}>
            {isActive ? 'Active' : isAwaiting ? 'Awaiting' : 'Ended'}
          </span>
        </div>
        <div className="hive-kv-grid">
          <div className="hive-kv">
            <div className="k">Started at</div>
            <div className="v">{formatDate(session.entryTime)}, {formatTime(session.entryTime)}</div>
          </div>
          <div className="hive-kv">
            <div className="k">Duration</div>
            <div className="v mono">{formatDuration(session.entryTime, session.exitTime)}</div>
          </div>
          {session.hostel && (
            <div className="hive-kv">
              <div className="k">Hostel</div>
              <div className="v">{session.hostel}</div>
            </div>
          )}
          {session.machineName && (
            <div className="hive-kv">
              <div className="k">Machine</div>
              <div className="v mono">{session.machineName}</div>
            </div>
          )}
          <div className="hive-kv">
            <div className="k">Status</div>
            <div className={`v ${isActive ? 'hive-status-live' : ''}`}>
              {isActive && <span className="blip"></span>}
              {STATUS_LABELS[session.status] || session.status}
            </div>
          </div>
        </div>
      </div>

      {/* Work Summary Section */}
      {canSubmit && (
        <>
          <div className="hive-section-title">Work summary</div>
          <div className="hive-card">
            <p className="hive-muted-note" style={{ marginTop: 0 }}>Add a short note before you end the session — what you worked on.</p>
            {!session.categoryId && categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value, 10) : '')}
                className="hive-select"
                style={{ width: '100%', marginTop: 8, boxSizing: 'border-box' }}
              >
                <option value="">Select a category...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <textarea
              className="hive-textarea"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Refactored the auth middleware, fixed 3 bugs..."
            />
            <button
              className="hive-primary-btn"
              onClick={handleSubmitSummary}
              disabled={submitting || !summary.trim()}
            >
              {submitting ? 'Adding...' : 'Add summary'}
            </button>
          </div>
        </>
      )}

      {/* End Session Button */}
      {isActive && (
        <button
          className="hive-danger-btn"
          onClick={handleEndSession}
          disabled={endingSession}
        >
          {endingSession ? 'Ending...' : 'End session'}
        </button>
      )}

      {/* Existing Summary Display */}
      {session.summary && !canSubmit && (
        <>
          <div className="hive-section-title">Work summary</div>
          <div className="hive-card">
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{session.summary}</p>
          </div>
        </>
      )}

      {/* Error / Success */}
      {error && (
        <div className="hive-alert-error" style={{ marginTop: 12 }}>{error}</div>
      )}
      {success && (
        <div className="hive-alert-success" style={{ marginTop: 12 }}>{success}</div>
      )}
    </div>
  );
}

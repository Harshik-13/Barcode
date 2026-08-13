import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sessionsApi } from '../services/apiService';
import type { SessionWithDetails } from '../services/apiService';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTimeRange(entry: string, exit?: string | null) {
  const e = new Date(entry).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (!exit) return `${e} –`;
  const x = new Date(exit).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${e} – ${x}`;
}

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
] as const;

export default function AttendanceHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(() => {
    if (!user) return;
    const sid = user.studentId ?? user.id;
    setLoading(true);
    sessionsApi.list({ studentId: sid, limit: 20, page })
      .then((res) => {
        setSessions(res.data);
        setTotalPages(res.pagination.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = sessions.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'present') return s.status === 'completed' || s.status === 'active';
    if (filter === 'absent') return s.status === 'archived' || s.status === 'created';
    return true;
  });

  return (
    <div>
      <div className="hive-back-row">
        <button className="hive-icon-btn ghost" onClick={() => navigate(-1)} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
            <polyline points="15 6 9 12 15 18" />
          </svg>
        </button>
        <h1>Attendance History</h1>
      </div>

      <div style={{ paddingBottom: '28px' }}>
        <div className="hive-chip-row">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`hive-chip${filter === f.value ? ' active' : ''}`}
              onClick={() => { setFilter(f.value); setPage(1); }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="hive-loading" style={{ padding: 20 }}>Loading...</div>
        ) : (
          <div className="hive-card" style={{ padding: '6px 14px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-faint)', fontSize: 14 }}>No sessions found</div>
            ) : (
              filtered.map((s) => (
                <div key={s.id} className="hive-att-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/sessions/${s.id}`)}>
                  <span className="hive-att-date">{formatDate(s.entryTime)}</span>
                  <div style={{ flex: 1 }}>
                    <span className="hive-att-cat">{s.categoryName || 'Session'}</span>
                    <span className="hive-att-time">{formatTimeRange(s.entryTime, s.exitTime)}</span>
                  </div>
                  <span className={`hive-status-pill ${s.status === 'active' ? 'hive-status-active' : s.status === 'completed' ? 'hive-status-active' : 'hive-status-ended'}`}>
                    {s.status === 'completed' ? 'Present' : s.status === 'active' ? 'Active' : 'Absent'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '6px 12px', border: '1.5px solid var(--line)', borderRadius: '8px', background: 'var(--surface)', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.5 : 1, fontWeight: 600, fontSize: 13 }}>
              Prev
            </button>
            <span style={{ padding: '6px 12px', fontSize: 14, color: 'var(--ink-soft)' }}>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '6px 12px', border: '1.5px solid var(--line)', borderRadius: '8px', background: 'var(--surface)', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.5 : 1, fontWeight: 600, fontSize: 13 }}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

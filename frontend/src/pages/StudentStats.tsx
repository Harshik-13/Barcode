import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { sessionsApi } from '../services/apiService';
import type { SessionWithDetails, SessionStats } from '../services/apiService';
import { formatDuration } from '../utils/sessionStatus';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTimeRange(entry: string, exit?: string | null) {
  const e = new Date(entry).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (!exit) return `${e} –`;
  const x = new Date(exit).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${e} – ${x}`;
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

function HiveRing({ percent, totalSessions }: { percent: number; totalSessions: number }) {
  const count = 22;
  const filled = Math.round(count * (percent / 100));
  const cx = 100, cy = 100, orbit = 76, cellR = 12;

  return (
    <div className="hive-hive-ring-card">
      <svg viewBox="0 0 200 200" width="196" height="196">
        <defs>
          <linearGradient id="hexGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EFAE4E" />
            <stop offset="100%" stopColor="#C6811F" />
          </linearGradient>
        </defs>
        {Array.from({ length: count }).map((_, i) => {
          const a = (Math.PI * 2 * i) / count - Math.PI / 2;
          const x = cx + orbit * Math.cos(a);
          const y = cy + orbit * Math.sin(a);
          const isFilled = i < filled;
          return (
            <polygon
              key={i}
              points={hexPoints(x, y, cellR)}
              fill={isFilled ? 'url(#hexGrad)' : 'transparent'}
              stroke={isFilled ? 'none' : '#E7E3F5'}
              strokeWidth="1.6"
              style={{ opacity: 1, transition: `opacity .35s ease ${i * 18}ms` }}
            />
          );
        })}
        <foreignObject x="38" y="70" width="124" height="60">
          <div style={{ textAlign: 'center' }}>
            <div className="hive-ring-center-num">{percent}%</div>
            <div className="hive-ring-center-lbl">Consistency</div>
          </div>
        </foreignObject>
      </svg>
      <div className="hive-hive-ring-caption">Built from {totalSessions} tracked sessions</div>
    </div>
  );
}

const TYPEFilters = [
  { label: 'All', value: 'all' },
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
] as const;

export default function StudentStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(() => {
    if (!user) return;
    const sid = user.studentId ?? user.id;
    setLoading(true);

    Promise.all([
      sessionsApi.stats(sid).catch(() => ({ data: null })),
      sessionsApi.list({ studentId: sid, limit: 20, page }).catch(() => ({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })),
    ])
      .then(([statsRes, listRes]) => {
        setStats(statsRes.data);
        setSessions(listRes.data);
        setTotalPages(listRes.pagination.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--ink-soft)' }}>Loading stats...</div>;
  }

  const totalSessions = stats?.totalSessions || 0;
  const presentDays = totalSessions;
  const consistencyPercent = totalSessions > 0 ? Math.min(Math.round((presentDays / Math.max(totalSessions, 1)) * 100), 100) : 0;

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'present') return s.status === 'completed' || s.status === 'active';
    if (filter === 'absent') return s.status === 'archived' || s.status === 'created';
    return true;
  });

  return (
    <div>
      <div className="hive-hive-ring-card">
        <svg viewBox="0 0 200 200" width="196" height="196">
          <defs>
            <linearGradient id="hexGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EFAE4E" />
              <stop offset="100%" stopColor="#C6811F" />
            </linearGradient>
          </defs>
          {Array.from({ length: 22 }).map((_, i) => {
            const a = (Math.PI * 2 * i) / 22 - Math.PI / 2;
            const x = 100 + 76 * Math.cos(a);
            const y = 100 + 76 * Math.sin(a);
            const isFilled = i < Math.round(22 * (consistencyPercent / 100));
            return (
              <polygon
                key={i}
                points={hexPoints(x, y, 12)}
                fill={isFilled ? 'url(#hexGrad)' : 'transparent'}
                stroke={isFilled ? 'none' : '#E7E3F5'}
                strokeWidth="1.6"
              />
            );
          })}
          <foreignObject x="38" y="70" width="124" height="60">
            <div style={{ textAlign: 'center' }}>
              <div className="hive-ring-center-num">{consistencyPercent}%</div>
              <div className="hive-ring-center-lbl">Consistency</div>
            </div>
          </foreignObject>
        </svg>
        <div className="hive-hive-ring-caption">Built from {totalSessions} tracked sessions</div>
      </div>

      {stats && (
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
      )}

      <div className="hive-section-title">Attendance history</div>
      <div className="hive-chip-row">
        {TYPEFilters.map((f) => (
          <button
            key={f.value}
            className={`hive-chip${filter === f.value ? ' active' : ''}`}
            onClick={() => { setFilter(f.value); setPage(1); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="hive-card" style={{ padding: '6px 14px' }}>
        {filteredSessions.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-faint)', fontSize: 14 }}>No sessions found</div>
        ) : (
          filteredSessions.map((s) => (
            <div key={s.id} className="hive-att-row">
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
  );
}

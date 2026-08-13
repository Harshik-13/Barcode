import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sessionsApi } from '../services/apiService';
import type { SessionStats } from '../services/apiService';
import { formatDuration } from '../utils/sessionStatus';

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

export default function StudentStats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);
  const ringRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!user) return;
    const sid = user.studentId ?? user.id;
    sessionsApi.stats(sid).then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (loading || animated) return;
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, [loading, animated]);

  if (loading) {
    return <div className="hive-loading">Loading stats...</div>;
  }

  const totalSessions = stats?.totalSessions || 0;
  const streakPercent = totalSessions > 0 ? Math.min(Math.round((Math.min(stats?.currentStreak || 0, 30) / 30) * 100), 100) : 0;

  return (
    <div>
      <div className="hive-hive-ring-card">
        <svg ref={ringRef} viewBox="0 0 200 200" width="196" height="196">
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
            const isFilled = i < Math.round(22 * (streakPercent / 100));
            return (
              <polygon
                key={i}
                points={hexPoints(x, y, 12)}
                fill={isFilled ? 'url(#hexGrad)' : 'transparent'}
                stroke={isFilled ? 'none' : '#E7E3F5'}
                strokeWidth="1.6"
                style={{
                  opacity: animated ? 1 : 0,
                  transition: `opacity .35s ease ${i * 18}ms`,
                }}
              />
            );
          })}
          <foreignObject x="38" y="70" width="124" height="60">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700 }}>{stats?.currentStreak || 0}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Day streak</div>
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
            <div className="hive-stat-label">This week</div>
            <div className="hive-stat-value">{stats.thisWeek}</div>
          </div>
        </div>
      )}

      <button className="hive-primary-btn" onClick={() => navigate('/stats/history')}>
        View attendance history
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><polyline points="9 6 15 12 9 18" /></svg>
      </button>
    </div>
  );
}

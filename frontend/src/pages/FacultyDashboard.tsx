import { useState, useEffect, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { sessionsApi, sessionsStatsApi, studentsApi } from '../services/apiService';
import type { SessionWithDetails } from '../services/apiService';
import { STATUS_LABELS, statusChipStyle, formatDuration } from '../utils/sessionStatus';

function rowKeyHandler(e: React.KeyboardEvent, action: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatShortDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning,';
  if (h < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

const AVATAR_COLORS = ['#6E52E8', '#3AA0C4', '#EFAE4E', '#42B583', '#D0483F', '#8A5FD8'];

function avatarBg(i: number) {
  return AVATAR_COLORS[i % AVATAR_COLORS.length];
}

export default function FacultyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSessions, setActiveSessions] = useState<SessionWithDetails[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const [liveStudents, setLiveStudents] = useState<Array<{ id: number; studentId: number; studentName: string; studentRoll: string; entryTime: string }>>([]);
  const [todaySessions, setTodaySessions] = useState<SessionWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: number; name: string; roll: string; status: string }>>([]);
  const [selectedStudent, setSelectedStudent] = useState<{ id: number; name: string; roll: string; status: string } | null>(null);
  const [studentHistory, setStudentHistory] = useState<SessionWithDetails[]>([]);
  const [studentHistoryPage, setStudentHistoryPage] = useState(1);
  const [studentHistoryTotalPages, setStudentHistoryTotalPages] = useState(1);
  const [studentHistoryTotal, setStudentHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [ledgerDate, setLedgerDate] = useState(() => toDateString(new Date()));
  const [ledgerSessions, setLedgerSessions] = useState<SessionWithDetails[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    setError('');

    const today = toDateString(new Date());

    Promise.all([
      sessionsApi.list({ status: 'created', limit: 20 }).then(r => r.data).catch(() => [] as SessionWithDetails[]),
      sessionsApi.list({ status: 'active', limit: 20 }).then(r => r.data).catch(() => [] as SessionWithDetails[]),
      sessionsApi.list({ status: 'awaiting_summary', limit: 20 }).then(r => r.data).catch(() => [] as SessionWithDetails[]),
      sessionsApi.list({ dateFrom: today, limit: 50 }).then(r => r.data).catch(() => [] as SessionWithDetails[]),
      sessionsStatsApi.live().then(r => r.data).catch(() => ({ count: 0, students: [] })),
    ])
      .then(([created, active, awaiting, todaySess, live]) => {
        setActiveSessions([...created, ...active, ...awaiting]);
        setTodaySessions(todaySess);
        setLiveCount(live.count);
        setLiveStudents(live.students);
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData, user]);

  const fetchLedger = useCallback((day: string) => {
    setLedgerLoading(true);
    setLedgerError('');
    sessionsApi.list({ dateFrom: day, dateTo: day, limit: 200 })
      .then((res) => setLedgerSessions(res.data))
      .catch(() => setLedgerError('Failed to load the day ledger'))
      .finally(() => setLedgerLoading(false));
  }, []);

  useEffect(() => {
    fetchLedger(ledgerDate);
  }, [ledgerDate, fetchLedger]);

  const shiftLedgerDay = useCallback((dir: 1 | -1) => {
    const d = new Date(`${ledgerDate}T12:00:00`);
    d.setDate(d.getDate() + dir);
    setLedgerDate(toDateString(d));
  }, [ledgerDate]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await studentsApi.search(q);
      setSearchResults(res.data);
    } catch { setSearchResults([]); }
  };

  const handleSelectStudent = async (student: { id: number; name: string; roll: string; status: string }) => {
    setSelectedStudent(student);
    setSearchQuery('');
    setSearchResults([]);
    setStudentHistoryPage(1);
    try {
      const res = await studentsApi.getHistory(student.id, 1, 10);
      setStudentHistory(res.data);
      setStudentHistoryTotal(res.pagination.total);
      setStudentHistoryTotalPages(res.pagination.totalPages);
    } catch {
      setStudentHistory([]);
      setStudentHistoryTotal(0);
      setStudentHistoryTotalPages(0);
    }
  };

  const handleStudentHistoryPage = async (pageNum: number) => {
    if (!selectedStudent) return;
    setStudentHistoryPage(pageNum);
    try {
      const res = await studentsApi.getHistory(selectedStudent.id, pageNum, 10);
      setStudentHistory(res.data);
      setStudentHistoryTotalPages(res.pagination.totalPages);
    } catch { /* ignore */ }
  };

  if (loading && activeSessions.length === 0) {
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--ink-soft)' }}>Loading dashboard...</div>;
  }

  if (error && activeSessions.length === 0) {
    return <div style={{ padding: '16px', background: 'var(--red-tint)', borderRadius: 'var(--radius-md)', color: 'var(--red)' }}>{error}</div>;
  }

  const ledgerTotalSeconds = ledgerSessions.reduce((sum, s) => {
    if (s.durationSeconds != null) return sum + s.durationSeconds;
    if (s.exitTime) return sum + Math.max(0, Math.round((new Date(s.exitTime).getTime() - new Date(s.entryTime).getTime()) / 1000));
    return sum;
  }, 0);
  const ledgerStudents = new Set(ledgerSessions.map(s => s.studentId)).size;

  return (
    <div>
      {/* Greeting */}
      <div className="hive-greeting">
        <div className="hello">{getGreeting()}</div>
        <h2>{user?.name?.split(' ')[0] || 'Faculty'}</h2>
      </div>

      {/* Today's Attendance Grid */}
      <div className="hive-section-title" style={{ marginTop: 0 }}>Today's Attendance</div>
      <div className="hive-attendance-grid">
        <div className="hive-attendance-block">
          <div className="lbl">Students Inside</div>
          <div className="val">{liveCount}</div>
          <span className="badge hive-badge hive-badge-active">Live</span>
        </div>
        <div className="hive-attendance-block">
          <div className="lbl">Date</div>
          <div className="val" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            {formatShortDate(new Date().toISOString())}
            <svg width="18" height="18" style={{ color: 'var(--ink-soft)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </div>
        </div>
      </div>

      {/* List of Present Students */}
      <div className="hive-section-title">
        List of Present Students
        <button className="hive-link-btn" onClick={() => navigate('/sessions')}>View All</button>
      </div>
      <div className="hive-card" style={{ padding: '6px 14px 2px' }}>
        {/* Header row */}
        <div className="list-head" style={{ display: 'flex', alignItems: 'center', padding: '0 2px 8px', fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
          <span style={{ flex: 1 }}>Name</span>
          <span style={{ width: 64 }}>Section</span>
          <span style={{ width: 64 }}>Status</span>
          <span style={{ width: 20 }}></span>
        </div>

        {liveStudents.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 14 }}>No students currently inside</div>
        ) : (
          liveStudents.map((s, i) => (
            <div
              key={s.id}
              className="stu-row"
              style={{ display: 'flex', alignItems: 'center', padding: '12px 2px', borderBottom: '1px solid var(--line)', cursor: 'pointer', gap: 0 }}
              onClick={() => handleSelectStudent({ id: s.studentId, name: s.studentName, roll: s.studentRoll, status: 'enrolled' })}
              onKeyDown={(e) => rowKeyHandler(e, () => handleSelectStudent({ id: s.studentId, name: s.studentName, roll: s.studentRoll, status: 'enrolled' }))}
              tabIndex={0}
              role="button"
            >
              <div className="c-name" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div className="letter-avatar" style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 14, background: avatarBg(i) }}>
                  {s.studentName.charAt(0).toUpperCase()}
                </div>
                <span className="nm" style={{ fontWeight: 700, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.studentName}</span>
              </div>
              <span className="c-section" style={{ width: 64, fontSize: 13, color: 'var(--ink-soft)', fontWeight: 500 }}>{s.studentRoll}</span>
              <span className="c-status" style={{ width: 64, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }}></span>
                Active
              </span>
              <span className="c-arrow" style={{ width: 20, display: 'flex', justifyContent: 'flex-end', color: 'var(--ink-faint)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
              </span>
            </div>
          ))
        )}
      </div>

      {/* Student Search */}
      <div className="hive-section-title">Student Search</div>
      <div className="hive-search-box">
        <input
          type="text"
          className="hive-search-input"
          placeholder="Search student by name or roll"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          aria-label="Search students"
        />
      </div>
      {searchResults.length > 0 && (
        <div className="hive-card" style={{ padding: '2px 14px', marginBottom: 16 }}>
          {searchResults.map((s, i) => (
            <div
              key={s.id}
              className="directory-row"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 2px', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
              onClick={() => handleSelectStudent(s)}
              onKeyDown={(e) => rowKeyHandler(e, () => handleSelectStudent(s))}
              tabIndex={0}
              role="button"
            >
              <div className="letter-avatar" style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 14, background: avatarBg(i) }}>
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div className="dir-body" style={{ flex: 1, minWidth: 0 }}>
                <div className="dir-name" style={{ fontWeight: 700, fontSize: 14.5 }}>{s.name}</div>
                <div className="dir-sub" style={{ fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{s.roll}</div>
              </div>
              <div className="dir-right" style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="dir-status" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green)' }}>{s.status === 'enrolled' ? 'Enrolled' : s.status}</div>
              </div>
              <svg className="hive-chevron" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-faint)' }}><polyline points="9 6 15 12 9 18" /></svg>
            </div>
          ))}
        </div>
      )}

      {/* Selected Student History */}
      {selectedStudent && (
        <div className="hive-card" style={{ padding: '18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>{selectedStudent.name} ({selectedStudent.roll})</h2>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{studentHistoryTotal} session(s)</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => navigate(`/sessions?studentId=${selectedStudent.id}`)} className="hive-primary-btn" style={{ width: 'auto', padding: '8px 16px', fontSize: 12, marginTop: 0 }}>View All Sessions</button>
            <button onClick={() => setSelectedStudent(null)} className="hive-ghost-btn" style={{ width: 'auto', padding: '8px 16px', fontSize: 12, marginTop: 0 }}>Close</button>
          </div>
          {studentHistory.length === 0 ? (
            <p style={{ color: 'var(--ink-faint)', fontSize: 13 }}>No session history</p>
          ) : (
            <>
              <div className="resp-table-wrap compact">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px', color: 'var(--ink-soft)', fontWeight: 500 }}>Entry</th>
                      <th style={{ padding: '6px 8px', color: 'var(--ink-soft)', fontWeight: 500 }}>Exit</th>
                      <th style={{ padding: '6px 8px', color: 'var(--ink-soft)', fontWeight: 500 }}>Duration</th>
                      <th style={{ padding: '6px 8px', color: 'var(--ink-soft)', fontWeight: 500 }}>Category</th>
                      <th style={{ padding: '6px 8px', color: 'var(--ink-soft)', fontWeight: 500 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentHistory.map(s => (
                      <tr key={s.id} tabIndex={0} style={{ borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
                        onClick={() => navigate(`/sessions/${s.id}`)}
                        onKeyDown={(e) => rowKeyHandler(e, () => navigate(`/sessions/${s.id}`))}>
                        <td style={{ padding: '6px 8px', fontSize: 12 }}>{new Date(s.entryTime).toLocaleString()}</td>
                        <td style={{ padding: '6px 8px', fontSize: 12, color: 'var(--ink-soft)' }}>{s.exitTime ? new Date(s.exitTime).toLocaleString() : '-'}</td>
                        <td style={{ padding: '6px 8px', fontSize: 12 }}>{formatDuration(s.durationSeconds)}</td>
                        <td style={{ padding: '6px 8px', color: 'var(--ink-soft)' }}>{s.categoryName || '-'}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 500, ...statusChipStyle(s.status) }}>
                            {STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] || s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {studentHistoryTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                  <button disabled={studentHistoryPage <= 1} onClick={() => handleStudentHistoryPage(studentHistoryPage - 1)}
                    style={{ padding: '6px 12px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', cursor: studentHistoryPage <= 1 ? 'default' : 'pointer', opacity: studentHistoryPage <= 1 ? 0.5 : 1, fontWeight: 600, fontSize: 13 }}>
                    Prev
                  </button>
                  <span style={{ padding: '6px 12px', fontSize: 14, color: 'var(--ink-soft)' }}>{studentHistoryPage} / {studentHistoryTotalPages}</span>
                  <button disabled={studentHistoryPage >= studentHistoryTotalPages} onClick={() => handleStudentHistoryPage(studentHistoryPage + 1)}
                    style={{ padding: '6px 12px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', cursor: studentHistoryPage >= studentHistoryTotalPages ? 'default' : 'pointer', opacity: studentHistoryPage >= studentHistoryTotalPages ? 0.5 : 1, fontWeight: 600, fontSize: 13 }}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Day Ledger */}
      <div className="hive-section-title">Day Ledger</div>
      <div className="hive-card" style={{ padding: '18px' }}>
        <div className="hive-date-nav">
          <button className="hive-icon-btn" onClick={() => shiftLedgerDay(-1)} aria-label="Previous day" style={{ width: 36, height: 36 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 6 9 12 15 18" /></svg>
          </button>
          <span className="date-label">{formatShortDate(`${ledgerDate}T12:00:00`)}</span>
          <button className="hive-icon-btn" onClick={() => shiftLedgerDay(1)} aria-label="Next day" style={{ width: 36, height: 36 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
          </button>
        </div>

        {ledgerError && (
          <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{ledgerError}</p>
        )}
        {ledgerLoading ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Loading ledger...</p>
        ) : ledgerSessions.length === 0 ? (
          <p style={{ color: 'var(--ink-faint)', fontSize: 14 }}>No sessions recorded on {formatShortDate(`${ledgerDate}T12:00:00`)}</p>
        ) : (
          <>
            <div className="resp-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Student</th>
                    <th style={{ padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Roll</th>
                    <th style={{ padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Entry</th>
                    <th style={{ padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Exit</th>
                    <th style={{ padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Duration</th>
                    <th style={{ padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Category</th>
                    <th style={{ padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerSessions.map((s) => (
                    <Fragment key={s.id}>
                      <tr tabIndex={0} style={{ borderBottom: s.summary ? 'none' : '1px solid var(--line)', cursor: 'pointer' }}
                        onClick={() => navigate(`/sessions/${s.id}`)}
                        onKeyDown={(e) => rowKeyHandler(e, () => navigate(`/sessions/${s.id}`))}>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{s.studentName || `Student #${s.studentId}`}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--ink-soft)' }}>{s.studentRoll || '-'}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12 }}>{new Date(s.entryTime).toLocaleTimeString()}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12 }}>{s.exitTime ? new Date(s.exitTime).toLocaleTimeString() : '-'}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12 }}>{formatDuration(s.durationSeconds)}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--ink-soft)' }}>{s.categoryName || '-'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, ...statusChipStyle(s.status) }}>
                            {STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] || s.status}
                          </span>
                        </td>
                      </tr>
                      {s.summary && (
                        <tr>
                          <td colSpan={7} style={{ padding: '2px 12px 8px', fontSize: 12, color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)' }}>
                            <em>{s.summary}</em>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, color: 'var(--ink-soft)' }}>
              <span><strong>{ledgerSessions.length}</strong> sessions</span>
              <span><strong>{formatDuration(ledgerTotalSeconds)}</strong> total time</span>
              <span><strong>{ledgerStudents}</strong> student(s)</span>
            </div>
          </>
        )}
      </div>

      {/* Active & Pending Sessions */}
      {activeSessions.length > 0 && (
        <>
          <div className="hive-section-title">Active & Pending Sessions</div>
          <div className="hive-card" style={{ padding: '4px 14px' }}>
            <div className="resp-table-wrap compact">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Student</th>
                    <th style={{ padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Roll</th>
                    <th style={{ padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Entry Time</th>
                    <th style={{ padding: '8px 12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSessions.map((s) => (
                    <tr key={s.id} tabIndex={0} style={{ borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
                      onClick={() => navigate(`/sessions/${s.id}`)}
                      onKeyDown={(e) => rowKeyHandler(e, () => navigate(`/sessions/${s.id}`))}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{s.studentName || `Student #${s.studentId}`}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--ink-soft)' }}>{s.studentRoll || '-'}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12 }}>{new Date(s.entryTime).toLocaleString()}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, ...statusChipStyle(s.status) }}>
                          {STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] || s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

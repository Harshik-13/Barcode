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
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>Loading dashboard...</div>;
  }

  if (error && activeSessions.length === 0) {
    return <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: 'var(--color-error)' }}>{error}</div>;
  }

  const ledgerTotalSeconds = ledgerSessions.reduce((sum, s) => {
    if (s.durationSeconds != null) return sum + s.durationSeconds;
    if (s.exitTime) return sum + Math.max(0, Math.round((new Date(s.exitTime).getTime() - new Date(s.entryTime).getTime()) / 1000));
    return sum;
  }, 0);
  const ledgerStudents = new Set(ledgerSessions.map(s => s.studentId)).size;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Faculty Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Welcome, {user?.name}</p>
        </div>
        <button onClick={() => navigate('/scanner')} style={{ padding: '12px 24px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
          Open Scanner
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Students Inside" value={liveCount} />
        <StatCard label="Active Sessions" value={activeSessions.filter(s => s.status === 'active').length} />
        <StatCard label="Awaiting Summary" value={activeSessions.filter(s => s.status === 'awaiting_summary').length} />
        <StatCard label="Today's Sessions" value={todaySessions.length} />
      </div>

      <div className="resp-grid-two-col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>Students Inside</h2>
          {liveStudents.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>No students currently inside</p>
          ) : (
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              <div className="resp-table-wrap compact"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Student</th>
                  <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Roll</th>
                  <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Since</th>
                </tr></thead>
                <tbody>
                  {liveStudents.map(s => (
                    <tr key={s.id} tabIndex={0} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', outlineOffset: '-2px' }}
                      onClick={() => handleSelectStudent({ id: s.studentId, name: s.studentName, roll: s.studentRoll, status: 'enrolled' })}
                      onKeyDown={(e) => rowKeyHandler(e, () => handleSelectStudent({ id: s.studentId, name: s.studentName, roll: s.studentRoll, status: 'enrolled' }))}>
                      <td style={{ padding: '6px 8px', fontWeight: 500 }}>{s.studentName}</td>
                      <td style={{ padding: '6px 8px', color: 'var(--color-text-secondary)' }}>{s.studentRoll}</td>
                      <td style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>{new Date(s.entryTime).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          )}
        </div>

        <div style={{ padding: '20px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>Student Search</h2>

          <label htmlFor="faculty-student-search" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            Search students
          </label>
          <input
            id="faculty-student-search"
            placeholder="Search by name, roll, or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          />
          {searchResults.length > 0 && (
            <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
              {searchResults.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectStudent(s)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', cursor: 'pointer', border: 'none', borderBottom: '1px solid #f3f4f6', background: 'transparent', fontSize: '13px', fontFamily: 'inherit' }}
                >
                  <strong>{s.name}</strong> <span style={{ color: 'var(--color-text-secondary)' }}>{s.roll}</span>
                  <span style={{ float: 'right', fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: s.status === 'enrolled' ? '#d1fae5' : '#fef3c7', color: s.status === 'enrolled' ? '#065f46' : '#92400e' }}>
                    {s.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected student history */}
      {selectedStudent && (
        <div style={{ padding: '20px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', margin: 0 }}>{selectedStudent.name} ({selectedStudent.roll})</h2>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{studentHistoryTotal} session(s)</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => navigate(`/sessions?studentId=${selectedStudent.id}`)} style={{ padding: '6px 14px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>View All Sessions</button>
              <button onClick={() => navigate('/scanner')} style={{ padding: '6px 14px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Scan Entry/Exit</button>
              <button onClick={() => setSelectedStudent(null)} style={{ padding: '6px 14px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
          <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Session History</h3>
          {studentHistory.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '13px' }}>No session history</p>
          ) : (
            <>
              <div className="resp-table-wrap compact"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Entry</th>
                  <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Exit</th>
                  <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Duration</th>
                  <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Category</th>
                  <th style={{ padding: '6px 8px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Status</th>
                </tr></thead>
                <tbody>
                  {studentHistory.map(s => (
                    <tr key={s.id} tabIndex={0} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', outlineOffset: '-2px' }}
                      onClick={() => navigate(`/sessions/${s.id}`)}
                      onKeyDown={(e) => rowKeyHandler(e, () => navigate(`/sessions/${s.id}`))}>
                      <td style={{ padding: '6px 8px', fontSize: '12px' }}>{new Date(s.entryTime).toLocaleString()}</td>
                      <td style={{ padding: '6px 8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{s.exitTime ? new Date(s.exitTime).toLocaleString() : '-'}</td>
                      <td style={{ padding: '6px 8px', fontSize: '12px' }}>{formatDuration(s.durationSeconds)}</td>
                      <td style={{ padding: '6px 8px', color: 'var(--color-text-secondary)' }}>{s.categoryName || '-'}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, ...statusChipStyle(s.status) }}>
                          {STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] || s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
              {studentHistoryTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                  <button disabled={studentHistoryPage <= 1} onClick={() => handleStudentHistoryPage(studentHistoryPage - 1)}
                    style={{ padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', background: '#fff', cursor: studentHistoryPage <= 1 ? 'default' : 'pointer', opacity: studentHistoryPage <= 1 ? 0.5 : 1 }}>
                    Prev
                  </button>
                  <span style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{studentHistoryPage} / {studentHistoryTotalPages}</span>
                  <button disabled={studentHistoryPage >= studentHistoryTotalPages} onClick={() => handleStudentHistoryPage(studentHistoryPage + 1)}
                    style={{ padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', background: '#fff', cursor: studentHistoryPage >= studentHistoryTotalPages ? 'default' : 'pointer', opacity: studentHistoryPage >= studentHistoryTotalPages ? 0.5 : 1 }}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Active & Pending Sessions */}
      <div style={{ padding: '20px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 16px' }}>Active & Pending Sessions</h2>
        {activeSessions.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No active sessions</p>
        ) : (
          <div className="resp-table-wrap compact"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Student</th>
                <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Roll</th>
                <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Entry Time</th>
                <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map((s) => (
                <tr key={s.id} tabIndex={0} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', outlineOffset: '-2px' }}
                  onClick={() => navigate(`/sessions/${s.id}`)}
                  onKeyDown={(e) => rowKeyHandler(e, () => navigate(`/sessions/${s.id}`))}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{s.studentName || `Student #${s.studentId}`}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{s.studentRoll || '-'}</td>
                  <td style={{ padding: '8px 12px', fontSize: '12px' }}>{new Date(s.entryTime).toLocaleString()}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, ...statusChipStyle(s.status) }}>
                      {STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] || s.status}
                    </span>
                  </td>
                </tr>
              ))}
              </tbody>
          </table></div>
        )}
      </div>

      {/* Day Ledger */}
      <div style={{ padding: '20px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', margin: 0 }}>Day Ledger</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => shiftLedgerDay(-1)} aria-label="Previous day" style={{ padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>&larr;</button>
            <label htmlFor="ledger-date" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Ledger date</label>
            <input id="ledger-date" type="date" value={ledgerDate} onChange={(e) => e.target.value && setLedgerDate(e.target.value)}
              style={{ padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '13px' }} />
            <button onClick={() => shiftLedgerDay(1)} aria-label="Next day" style={{ padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>&rarr;</button>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{ledgerSessions.length} session(s)</span>
          </div>
        </div>

        {ledgerError && (
          <p style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '12px' }}>{ledgerError}</p>
        )}
        {ledgerLoading ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading ledger...</p>
        ) : ledgerSessions.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No sessions recorded on {new Date(`${ledgerDate}T12:00:00`).toLocaleDateString()}</p>
        ) : (
          <>
            <div className="resp-table-wrap"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Student</th>
                  <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Roll</th>
                  <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Entry</th>
                  <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Exit</th>
                  <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Duration</th>
                  <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Category</th>
                  <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {ledgerSessions.map((s) => (
                  <Fragment key={s.id}>
                    <tr key={s.id} tabIndex={0} style={{ borderBottom: s.summary ? 'none' : '1px solid #f3f4f6', cursor: 'pointer', outlineOffset: '-2px' }}
                      onClick={() => navigate(`/sessions/${s.id}`)}
                      onKeyDown={(e) => rowKeyHandler(e, () => navigate(`/sessions/${s.id}`))}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{s.studentName || `Student #${s.studentId}`}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{s.studentRoll || '-'}</td>
                      <td style={{ padding: '8px 12px', fontSize: '12px' }}>{new Date(s.entryTime).toLocaleTimeString()}</td>
                      <td style={{ padding: '8px 12px', fontSize: '12px' }}>{s.exitTime ? new Date(s.exitTime).toLocaleTimeString() : '-'}</td>
                      <td style={{ padding: '8px 12px', fontSize: '12px' }}>{formatDuration(s.durationSeconds)}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{s.categoryName || '-'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, ...statusChipStyle(s.status) }}>
                          {STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] || s.status}
                        </span>
                      </td>
                    </tr>
                    {s.summary && (
                      <tr key={`${s.id}-summary`}>
                        <td colSpan={7} style={{ padding: '2px 12px 8px', fontSize: '12px', color: 'var(--color-text-secondary)', borderBottom: '1px solid #f3f4f6' }}>
                          <em>{s.summary}</em>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table></div>

            <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f9fafb', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              <span><strong>{ledgerSessions.length}</strong> sessions</span>
              <span><strong>{formatDuration(ledgerTotalSeconds)}</strong> total time</span>
              <span><strong>{ledgerStudents}</strong> student(s)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: '16px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{value}</p>
    </div>
  );
}

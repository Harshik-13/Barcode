import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { sessionsApi, sessionsStatsApi, studentsApi, categoriesApi } from '../services/apiService';
import type { SessionWithDetails, Category } from '../services/apiService';

const STATUS_LABELS: Record<string, string> = {
  created: 'Created',
  active: 'Active',
  awaiting_summary: 'Awaiting Summary',
  completed: 'Completed',
  archived: 'Archived',
};

const STATUS_COLORS: Record<string, string> = {
  created: '#f59e0b',
  active: '#10b981',
  awaiting_summary: '#f97316',
  completed: '#6b7280',
  archived: '#9ca3af',
};

const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds && seconds !== 0) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
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

  // Filter state for main session list
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithDetails[]>([]);
  const [filterPage, setFilterPage] = useState(1);
  const [filterTotalPages, setFilterTotalPages] = useState(1);
  const [filterTotal, setFilterTotal] = useState(0);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError('');

    const today = new Date().toISOString().slice(0, 10);

    Promise.all([
      sessionsApi.list({ status: 'created', limit: 20 }).then(r => r.data).catch(() => [] as SessionWithDetails[]),
      sessionsApi.list({ status: 'active', limit: 20 }).then(r => r.data).catch(() => [] as SessionWithDetails[]),
      sessionsApi.list({ status: 'awaiting_summary', limit: 20 }).then(r => r.data).catch(() => [] as SessionWithDetails[]),
      sessionsApi.list({ dateFrom: today, limit: 50 }).then(r => r.data).catch(() => [] as SessionWithDetails[]),
      sessionsStatsApi.live().then(r => r.data).catch(() => ({ count: 0, students: [] })),
      categoriesApi.list('active').then(r => r.data).catch(() => [] as Category[]),
    ])
      .then(([created, active, awaiting, todaySess, live, cats]) => {
        setActiveSessions([...created, ...active, ...awaiting]);
        setTodaySessions(todaySess);
        setLiveCount(live.count);
        setLiveStudents(live.students);
        setCategories(cats);
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, user]);

  const fetchFilteredSessions = useCallback(async (pageNum: number) => {
    const params: Record<string, string | number | undefined> = { page: pageNum, limit: 20 };
    if (filterStatus) params.status = filterStatus;
    if (filterDateFrom) params.dateFrom = filterDateFrom;
    if (filterDateTo) params.dateTo = filterDateTo;
    try {
      const res = await sessionsApi.list(params);
      setFilteredSessions(res.data);
      setFilterTotal(res.pagination.total);
      setFilterTotalPages(res.pagination.totalPages);
    } catch {
      setFilteredSessions([]);
    }
  }, [filterStatus, filterDateFrom, filterDateTo]);

  useEffect(() => {
    fetchFilteredSessions(filterPage);
  }, [filterPage, fetchFilteredSessions]);

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
    return <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading dashboard...</div>;
  }

  if (error && activeSessions.length === 0) {
    return <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>{error}</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Faculty Dashboard</h1>
          <p style={{ color: '#6b7280' }}>Welcome, {user?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/scanner')} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            Open Scanner
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Students Inside" value={liveCount} color="#10b981" />
        <StatCard label="Active Sessions" value={activeSessions.filter(s => s.status === 'active').length} color="#3b82f6" />
        <StatCard label="Awaiting Summary" value={activeSessions.filter(s => s.status === 'awaiting_summary').length} color="#f97316" />
        <StatCard label="Today's Sessions" value={todaySessions.length} color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>Students Inside</h2>
          {liveStudents.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>No students currently inside</p>
          ) : (
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 500 }}>Student</th>
                  <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 500 }}>Roll</th>
                  <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 500 }}>Since</th>
                </tr></thead>
                <tbody>
                  {liveStudents.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => handleSelectStudent({ id: s.studentId, name: s.studentName, roll: s.studentRoll, status: 'enrolled' })}>
                      <td style={{ padding: '6px 8px', fontWeight: 500 }}>{s.studentName}</td>
                      <td style={{ padding: '6px 8px', color: '#6b7280' }}>{s.studentRoll}</td>
                      <td style={{ padding: '6px 8px', color: '#6b7280', fontSize: '12px' }}>{new Date(s.entryTime).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>Student Search</h2>
          <input
            placeholder="Search by name, roll, or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          />
          {searchResults.length > 0 && (
            <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
              {searchResults.map(s => (
                <div key={s.id} onClick={() => handleSelectStudent(s)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <strong>{s.name}</strong> <span style={{ color: '#6b7280' }}>{s.roll}</span>
                  <span style={{ float: 'right', fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: s.status === 'enrolled' ? '#d1fae5' : '#fef3c7', color: s.status === 'enrolled' ? '#065f46' : '#92400e' }}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected student history */}
      {selectedStudent && (
        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', margin: 0 }}>{selectedStudent.name} ({selectedStudent.roll})</h2>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>{studentHistoryTotal} session(s)</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => navigate(`/sessions?studentId=${selectedStudent.id}`)} style={{ padding: '6px 14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>View All Sessions</button>
              <button onClick={() => navigate('/scanner')} style={{ padding: '6px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Scan Entry/Exit</button>
              <button onClick={() => setSelectedStudent(null)} style={{ padding: '6px 14px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
          <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Session History</h3>
          {studentHistory.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '13px' }}>No session history</p>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 500 }}>Entry</th>
                  <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 500 }}>Exit</th>
                  <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 500 }}>Duration</th>
                  <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 500 }}>Category</th>
                  <th style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 500 }}>Status</th>
                </tr></thead>
                <tbody>
                  {studentHistory.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => navigate(`/sessions/${s.id}`)}>
                      <td style={{ padding: '6px 8px', fontSize: '12px' }}>{new Date(s.entryTime).toLocaleString()}</td>
                      <td style={{ padding: '6px 8px', fontSize: '12px', color: '#6b7280' }}>{s.exitTime ? new Date(s.exitTime).toLocaleString() : '-'}</td>
                      <td style={{ padding: '6px 8px', fontSize: '12px' }}>{formatDuration(s.durationSeconds)}</td>
                      <td style={{ padding: '6px 8px', color: '#6b7280' }}>{s.categoryName || '-'}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, background: `${STATUS_COLORS[s.status]}20`, color: STATUS_COLORS[s.status] }}>
                          {STATUS_LABELS[s.status] || s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {studentHistoryTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                  <button disabled={studentHistoryPage <= 1} onClick={() => handleStudentHistoryPage(studentHistoryPage - 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: studentHistoryPage <= 1 ? 'default' : 'pointer', opacity: studentHistoryPage <= 1 ? 0.5 : 1 }}>
                    Prev
                  </button>
                  <span style={{ padding: '6px 12px', fontSize: '13px', color: '#6b7280' }}>{studentHistoryPage} / {studentHistoryTotalPages}</span>
                  <button disabled={studentHistoryPage >= studentHistoryTotalPages} onClick={() => handleStudentHistoryPage(studentHistoryPage + 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: studentHistoryPage >= studentHistoryTotalPages ? 'default' : 'pointer', opacity: studentHistoryPage >= studentHistoryTotalPages ? 0.5 : 1 }}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Historical sessions with filters */}
      <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', margin: 0 }}>Historical Sessions</h2>
          <button onClick={() => { setFilterPage(1); fetchFilteredSessions(1); }} style={{ padding: '6px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Refresh</button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Status</label>
            <select value={filterStatus || ''} onChange={(e) => { setFilterStatus(e.target.value || undefined); setFilterPage(1); }}
              style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '13px' }}>
              <option value="">All</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>From</label>
            <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setFilterPage(1); }}
              style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '13px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>To</label>
            <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setFilterPage(1); }}
              style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '13px' }} />
          </div>
          <span style={{ fontSize: '13px', color: '#6b7280', paddingBottom: '6px' }}>{filterTotal} session(s)</span>
        </div>

        {filteredSessions.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No sessions match the filters</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Student</th>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Roll</th>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Entry</th>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Exit</th>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Duration</th>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Category</th>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => navigate(`/sessions/${s.id}`)}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{s.studentName || `Student #${s.studentId}`}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{s.studentRoll || '-'}</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px' }}>{new Date(s.entryTime).toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px' }}>{s.exitTime ? new Date(s.exitTime).toLocaleString() : '-'}</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px' }}>{formatDuration(s.durationSeconds)}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{s.categoryName || '-'}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, background: `${STATUS_COLORS[s.status]}20`, color: STATUS_COLORS[s.status] }}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filterTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                <button disabled={filterPage <= 1} onClick={() => setFilterPage(filterPage - 1)}
                  style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: filterPage <= 1 ? 'default' : 'pointer', opacity: filterPage <= 1 ? 0.5 : 1 }}>
                  Prev
                </button>
                <span style={{ padding: '6px 12px', fontSize: '13px', color: '#6b7280' }}>{filterPage} / {filterTotalPages}</span>
                <button disabled={filterPage >= filterTotalPages} onClick={() => setFilterPage(filterPage + 1)}
                  style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: filterPage >= filterTotalPages ? 'default' : 'pointer', opacity: filterPage >= filterTotalPages ? 0.5 : 1 }}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Active & Pending Sessions */}
      <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', margin: 0 }}>Active & Pending Sessions</h2>
          <button onClick={fetchData} style={{ padding: '6px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Refresh</button>
        </div>
        {activeSessions.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No active sessions</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Student</th>
                <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Roll</th>
                <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Entry Time</th>
                <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => navigate(`/sessions/${s.id}`)}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{s.studentName || `Student #${s.studentId}`}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>{s.studentRoll || '-'}</td>
                  <td style={{ padding: '8px 12px', fontSize: '12px' }}>{new Date(s.entryTime).toLocaleString()}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, background: `${STATUS_COLORS[s.status]}20`, color: STATUS_COLORS[s.status] }}>
                      {STATUS_LABELS[s.status] || s.status}
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

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: 700, color: color || '#111827', margin: 0 }}>{value}</p>
    </div>
  );
}

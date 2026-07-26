import { useState, useEffect } from 'react';
import { sessionsApi } from '../services/apiService';
import type { SessionWithDetails } from '../services/apiService';
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

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [completingId, setCompletingId] = useState<number | null>(null);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    sessionsApi.list({ page, limit: 20, status: statusFilter })
      .then((res) => {
        setSessions(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      })
      .catch((err) => setError(err?.message || 'Failed to load sessions'))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const handleComplete = async (id: number) => {
    if (!summary.trim()) return;
    try {
      await sessionsApi.complete(id, summary.trim());
      setCompletingId(null);
      setSummary('');
      sessionsApi.list({ page, limit: 20, status: statusFilter }).then((res) => setSessions(res.data));
    } catch (err: unknown) {
      alert((err as { message?: string })?.message || 'Failed to complete session');
    }
  };

  const handleArchive = async (id: number) => {
    if (!confirm('Archive this session?')) return;
    try {
      await sessionsApi.archive(id);
      sessionsApi.list({ page, limit: 20, status: statusFilter }).then((res) => setSessions(res.data));
    } catch (err: unknown) {
      alert((err as { message?: string })?.message || 'Failed to archive session');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading sessions...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>Work Sessions</h1>

      {error && (
        <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div className="resp-stack@mobile" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '14px', color: '#6b7280', whiteSpace: 'nowrap' }}>Status Filter:</label>
        <select value={statusFilter || ''} onChange={(e) => { setStatusFilter(e.target.value || undefined); setPage(1); }} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}>
          <option value="">All</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>{total} session(s)</span>
      </div>

      <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div className="resp-table-wrap"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Student</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Roll</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Entry</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Exit</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Category</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Status</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No sessions found</td></tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{s.studentName || `Student #${s.studentId}`}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>{s.studentRoll || '-'}</td>
                  <td style={{ padding: '8px 12px', fontSize: '13px' }}>{new Date(s.entryTime).toLocaleString()}</td>
                  <td style={{ padding: '8px 12px', fontSize: '13px' }}>{s.exitTime ? new Date(s.exitTime).toLocaleString() : '-'}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>{s.categoryName || '-'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, background: `${STATUS_COLORS[s.status as SessionStatus]}20`, color: STATUS_COLORS[s.status as SessionStatus] }}>
                      {STATUS_LABELS[s.status as SessionStatus] || s.status}
                    </span>
                    {s.completionReason && s.completionReason !== 'normal' && (
                      <span style={{ marginLeft: '4px', fontSize: '11px', color: '#6b7280' }}>({s.completionReason})</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {s.status === 'awaiting_summary' && completingId !== s.id && (
                      <button onClick={() => setCompletingId(s.id)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>
                        Add Summary
                      </button>
                    )}
                    {(s.status === 'active' || s.status === 'awaiting_summary' || s.status === 'completed') && (
                      <button onClick={() => handleArchive(s.id)} style={{ background: 'none', border: '1px solid #9ca3af', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', marginLeft: '4px', color: '#6b7280' }}>
                        Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>
              Prev
            </button>
            <span style={{ padding: '6px 12px', fontSize: '14px', color: '#6b7280' }}>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>
              Next
            </button>
          </div>
        )}
      </div>

      {completingId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Complete Session</h3>
            <textarea
              placeholder="Enter work summary..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
              style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', resize: 'vertical', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setCompletingId(null); setSummary(''); }} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
              <button onClick={() => handleComplete(completingId)} disabled={!summary.trim()} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', opacity: summary.trim() ? 1 : 0.5 }}>
                Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

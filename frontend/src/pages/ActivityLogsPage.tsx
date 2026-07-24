import { useState, useEffect } from 'react';
import { activityLogsApi } from '../services/apiService';
import type { ActivityLog } from '@workspace/shared';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actorTypeFilter, setActorTypeFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    const params: Record<string, string | number | undefined> = { page, limit: 20 };
    if (actorTypeFilter) params.actorType = actorTypeFilter;

    activityLogsApi.list(params as any)
      .then((res) => {
        setLogs(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      })
      .catch((err) => setError(err?.message || 'Failed to load activity logs'))
      .finally(() => setLoading(false));
  }, [page, actorTypeFilter]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading activity logs...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>Activity Logs</h1>

      {error && (
        <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '14px', color: '#6b7280', marginRight: '8px' }}>Actor Type Filter:</label>
        <select value={actorTypeFilter || ''} onChange={(e) => { setActorTypeFilter(e.target.value || undefined); setPage(1); }} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}>
          <option value="">All</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
          <option value="system">System</option>
        </select>
        <span style={{ marginLeft: '12px', fontSize: '14px', color: '#6b7280' }}>{total} log(s)</span>
      </div>

      <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Time</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Actor</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Action</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Entity</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No activity logs found</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontSize: '13px', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, background: '#f3f4f6', color: '#374151' }}>
                      {log.actorType}
                    </span>
                    {log.actorId !== null && <span style={{ marginLeft: '4px', color: '#6b7280', fontSize: '13px' }}>#{log.actorId}</span>}
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '13px' }}>{log.action}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: '13px' }}>
                    {log.entityType}{log.entityId !== null ? ` #${log.entityId}` : ''}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

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
    </div>
  );
}

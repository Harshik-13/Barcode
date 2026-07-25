import { useState, useEffect } from 'react';
import { studentsApi } from '../services/apiService';
import type { Student } from '@workspace/shared';

const STATUS_COLORS: Record<string, string> = {
  invited: '#8b5cf6',
  enrolled: '#10b981',
  suspended: '#f59e0b',
  departed: '#ef4444',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createRoll, setCreateRoll] = useState('');
  const [createName, setCreateName] = useState('');
  const [createBranch, setCreateBranch] = useState('');
  const [createSection, setCreateSection] = useState('');
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    studentsApi.list(page, 20, statusFilter)
      .then((res) => {
        setStudents(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      })
      .catch((err) => setError(err?.message || 'Failed to load students'))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      await studentsApi.create(createRoll, createName, createBranch || undefined, createSection || undefined);
      setShowCreate(false);
      setCreateRoll('');
      setCreateName('');
      setCreateBranch('');
      setCreateSection('');
      studentsApi.list(page, 20, statusFilter).then((res) => setStudents(res.data));
    } catch (err: unknown) {
      setCreateError((err as { message?: string })?.message || 'Failed to create student');
    }
  };

  const handleSuspend = async (id: number) => {
    if (!confirm('Suspend this student?')) return;
    try {
      await studentsApi.suspend(id);
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'suspended' as const } : s)));
    } catch (err: unknown) {
      alert((err as { message?: string })?.message || 'Failed to suspend student');
    }
  };

  const handleDepart = async (id: number) => {
    if (!confirm('Mark this student as departed?')) return;
    try {
      await studentsApi.depart(id);
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'departed' as const } : s)));
    } catch (err: unknown) {
      alert((err as { message?: string })?.message || 'Failed to depart student');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading students...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>Students</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
        >
          {showCreate ? 'Cancel' : 'Add Student'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

          {showCreate && (
        <form onSubmit={handleCreate} style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>New Student</h3>
          {createError && (
            <div style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>
              {createError}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input placeholder="Roll Number" value={createRoll} onChange={(e) => setCreateRoll(e.target.value.toUpperCase())} required style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', flex: 1, minWidth: '150px' }} />
            <input placeholder="Full Name" value={createName} onChange={(e) => setCreateName(e.target.value)} required style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', flex: 1, minWidth: '200px' }} />
            <input placeholder="Branch (e.g. CSE)" value={createBranch} onChange={(e) => setCreateBranch(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', flex: 1, minWidth: '120px' }} />
            <input placeholder="Section (e.g. A)" value={createSection} onChange={(e) => setCreateSection(e.target.value.toUpperCase())} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', flex: 0, minWidth: '80px', maxWidth: '100px' }} />
            <button type="submit" style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
              Create
            </button>
          </div>
        </form>
      )}

      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '14px', color: '#6b7280', marginRight: '8px' }}>Status Filter:</label>
        <select value={statusFilter || ''} onChange={(e) => { setStatusFilter(e.target.value || undefined); setPage(1); }} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px' }}>
          <option value="">All</option>
          <option value="invited">Invited</option>
          <option value="enrolled">Enrolled</option>
          <option value="suspended">Suspended</option>
          <option value="departed">Departed</option>
        </select>
        <span style={{ marginLeft: '12px', fontSize: '14px', color: '#6b7280' }}>{total} student(s)</span>
      </div>

      <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Roll</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Name</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Branch</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Section</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Email</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Status</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Created</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No students found</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{s.roll}</td>
                  <td style={{ padding: '8px 12px' }}>{s.name}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>{s.branch || '-'}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>{s.section || '-'}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>{s.email || '-'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, background: `${STATUS_COLORS[s.status]}20`, color: STATUS_COLORS[s.status] }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: '13px' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '8px 12px' }}>
                    {s.status === 'enrolled' && (
                      <>
                        <button onClick={() => handleSuspend(s.id)} style={{ background: 'none', border: '1px solid #f59e0b', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', marginRight: '4px', color: '#f59e0b' }}>Suspend</button>
                        <button onClick={() => handleDepart(s.id)} style={{ background: 'none', border: '1px solid #ef4444', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', color: '#ef4444' }}>Depart</button>
                      </>
                    )}
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

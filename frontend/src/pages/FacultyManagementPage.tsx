import { useState, useEffect } from 'react';
import { facultyApi } from '../services/apiService';
import type { FacultyMember } from '../services/apiService';

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  invited: '#f59e0b',
  suspended: '#ef4444',
  deactivated: '#9ca3af',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  invited: 'Invited',
  suspended: 'Suspended',
  deactivated: 'Deactivated',
};

export default function FacultyManagementPage() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const fetchFaculty = () => {
    setLoading(true);
    setError('');
    facultyApi.list({ status: statusFilter || undefined, search: searchQuery || undefined })
      .then((r) => setFaculty(r.data))
      .catch(() => setError('Failed to load faculty'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFaculty(); }, [statusFilter, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg('');
    try {
      await facultyApi.create(formEmail, formName);
      setFormName('');
      setFormEmail('');
      setShowForm(false);
      setActionMsg('Faculty created successfully');
      fetchFaculty();
    } catch (err: unknown) {
      setActionMsg((err as { message?: string } | null)?.message || 'Failed to create faculty');
    }
  };

  const handleUpdate = async (id: number) => {
    setActionMsg('');
    try {
      await facultyApi.update(id, editName, editEmail);
      setEditingId(null);
      setActionMsg('Faculty updated');
      fetchFaculty();
    } catch (err: unknown) {
      setActionMsg((err as { message?: string } | null)?.message || 'Failed to update');
    }
  };

  const handleDeactivate = async (id: number) => {
    setActionMsg('');
    try {
      await facultyApi.deactivate(id);
      setActionMsg('Faculty deactivated');
      fetchFaculty();
    } catch (err: unknown) {
      setActionMsg((err as { message?: string } | null)?.message || 'Failed to deactivate');
    }
  };

  const handleActivate = async (id: number) => {
    setActionMsg('');
    try {
      await facultyApi.activate(id);
      setActionMsg('Faculty activated');
      fetchFaculty();
    } catch (err: unknown) {
      setActionMsg((err as { message?: string } | null)?.message || 'Failed to activate');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Faculty Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : 'Add Faculty'}
        </button>
      </div>

      {actionMsg && (
        <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534', marginBottom: '16px', fontSize: '14px' }}>
          {actionMsg}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            placeholder="Full name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
            style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
          />
          <input
            type="email"
            placeholder="Email address"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            required
            style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
          />
          <button type="submit" style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            Create Faculty
          </button>
        </form>
      )}

      <div className="resp-stack@mobile" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading...</div>
      ) : error ? (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>{error}</div>
      ) : faculty.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>No faculty found</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div className="resp-table-wrap"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '12px', color: '#6b7280', fontWeight: 500 }}>Name</th>
                <th style={{ padding: '12px', color: '#6b7280', fontWeight: 500 }}>Email</th>
                <th style={{ padding: '12px', color: '#6b7280', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '12px', color: '#6b7280', fontWeight: 500 }}>Created</th>
                <th style={{ padding: '12px', color: '#6b7280', fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculty.map((f) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {editingId === f.id ? (
                    <>
                      <td style={{ padding: '8px' }}>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px', width: '140px' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px', width: '200px' }} />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, background: `${STATUS_COLORS[f.status]}20`, color: STATUS_COLORS[f.status] }}>
                          {STATUS_LABELS[f.status] || f.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '8px', display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleUpdate(f.id)} style={{ padding: '4px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Save</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '4px 10px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{f.name}</td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>{f.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, background: `${STATUS_COLORS[f.status]}20`, color: STATUS_COLORS[f.status] }}>
                          {STATUS_LABELS[f.status] || f.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', display: 'flex', gap: '6px' }}>
                        <button onClick={() => { setEditingId(f.id); setEditName(f.name); setEditEmail(f.email); }} style={{ padding: '4px 10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
                        {f.status === 'active' && (
                          <button onClick={() => handleDeactivate(f.id)} style={{ padding: '4px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Deactivate</button>
                        )}
                        {f.status === 'deactivated' && (
                          <button onClick={() => handleActivate(f.id)} style={{ padding: '4px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Activate</button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}

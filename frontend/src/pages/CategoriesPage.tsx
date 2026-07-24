import { useState, useEffect } from 'react';
import { categoriesApi } from '../services/apiService';
import type { Category } from '@workspace/shared';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createError, setCreateError] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fetchCategories = () => {
    setLoading(true);
    setError('');
    categoriesApi.list()
      .then((res) => setCategories(res.data ?? []))
      .catch((err) => setError(err?.message || 'Failed to load categories'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      await categoriesApi.create(createName, createDesc || undefined);
      setShowCreate(false);
      setCreateName('');
      setCreateDesc('');
      fetchCategories();
    } catch (err: unknown) {
      setCreateError((err as { message?: string })?.message || 'Failed to create category');
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await categoriesApi.update(id, editName, editDesc || undefined);
      setEditingId(null);
      fetchCategories();
    } catch (err: unknown) {
      alert((err as { message?: string })?.message || 'Failed to update category');
    }
  };

  const handleArchive = async (id: number) => {
    if (!confirm('Archive this category?')) return;
    try {
      await categoriesApi.archive(id);
      fetchCategories();
    } catch (err: unknown) {
      alert((err as { message?: string })?.message || 'Failed to archive category');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading categories...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px' }}>Work Categories</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
        >
          {showCreate ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>New Category</h3>
          {createError && (
            <div style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>
              {createError}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input placeholder="Category Name" value={createName} onChange={(e) => setCreateName(e.target.value)} required style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', flex: 1, minWidth: '200px' }} />
            <input placeholder="Description (optional)" value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', flex: 1, minWidth: '250px' }} />
            <button type="submit" style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
              Create
            </button>
          </div>
        </form>
      )}

      <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Name</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Description</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Status</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Created</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No categories found</td></tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {editingId === c.id ? (
                    <>
                      <td style={{ padding: '8px 12px' }}>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', width: '100%' }} />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', width: '100%' }} />
                      </td>
                      <td style={{ padding: '8px 12px' }}>{c.status}</td>
                      <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: '13px' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <button onClick={() => handleUpdate(c.id)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', marginRight: '4px' }}>Save</button>
                        <button onClick={() => setEditingId(null)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{c.name}</td>
                      <td style={{ padding: '8px 12px', color: '#6b7280' }}>{c.description || '-'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, background: c.status === 'active' ? '#10b98120' : '#9ca3af20', color: c.status === 'active' ? '#10b981' : '#9ca3af' }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: '13px' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '8px 12px' }}>
                        {c.status === 'active' && (
                          <>
                            <button onClick={() => { setEditingId(c.id); setEditName(c.name); setEditDesc(c.description || ''); }} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', marginRight: '4px' }}>Edit</button>
                            <button onClick={() => handleArchive(c.id)} style={{ background: 'none', border: '1px solid #ef4444', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', color: '#ef4444' }}>Archive</button>
                          </>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../store/AuthContext';
import { profileApi } from '../services/apiService';
import { Loading } from '../components/common/Loading';
import type { ProfileData } from '@workspace/shared';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    branch: '',
    section: '',
  });

  useEffect(() => {
    profileApi.get()
      .then((res) => {
        setProfile(res.data);
        setForm({
          branch: res.data.branch || '',
          section: res.data.section || '',
        });
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const data: { branch?: string | null; section?: string | null } = {};
      const old = profile!;
      if (user?.role === 'student') {
        if (form.branch !== (old.branch || '')) data.branch = form.branch || null;
        if (form.section !== (old.section || '')) data.section = form.section || null;
      }
      if (Object.keys(data).length === 0) {
        setEditing(false);
        return;
      }
      const updated = await profileApi.update(data);
      setProfile(updated.data);
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    setForm({
      branch: profile.branch || '',
      section: profile.section || '',
    });
    setEditing(false);
    setError('');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await profileApi.uploadPicture(file);
      setProfile((prev) => prev ? { ...prev, profilePicture: '_updated_' } : prev);
      setSuccess('Profile picture updated');
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    setError('');
    try {
      await profileApi.removePicture();
      setProfile((prev) => prev ? { ...prev, profilePicture: null } : prev);
      setSuccess('Profile picture removed');
    } catch (err: any) {
      setError(err?.message || 'Failed to remove picture');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loading />;

  if (!profile) {
    return <p style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: 32 }}>Profile not found</p>;
  }

  const pictureUrl = profile.profilePicture
    ? profileApi.pictureUrl(profile.id)
    : null;

  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--line)',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'inherit',
    background: editing ? '#fff' : 'transparent',
    cursor: editing ? 'text' : 'default',
  };

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ink-soft)',
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Settings gear (faculty) */}
      {isFaculty && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button className="hive-icon-btn ghost" aria-label="Settings" style={{ width: 40, height: 40 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.8-1.4-2-3.4-2.1.6a7.7 7.7 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.3a7.7 7.7 0 0 0-2.6 1.5l-2.1-.6-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3L2.8 15l2 3.4 2.1-.6a7.7 7.7 0 0 0 2.6 1.5l.5 2.3h4l.5-2.3a7.7 7.7 0 0 0 2.6-1.5l2.1.6 2-3.4z" />
            </svg>
          </button>
        </div>
      )}

      {/* Profile Hero */}
      <div className="hive-faculty-hero">
        <div className="hive-faculty-photo" style={{ position: 'relative' }}>
          {pictureUrl ? (
            <img src={pictureUrl} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            profile.name?.charAt(0)?.toUpperCase() || '?'
          )}
          <label className="hive-cam-badge" style={{ cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Error / Success Messages */}
      {error && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--red-tint)', color: 'var(--red)', marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--green-tint)', color: 'var(--green)', marginBottom: 16, fontSize: 14 }}>
          {success}
        </div>
      )}

      {/* Faculty Details */}
      {isFaculty && (
        <>
          <div className="hive-section-title">Faculty Details</div>
          <div className="hive-card" style={{ padding: '4px 14px' }}>
            <div className="hive-faculty-info-row">
              <div className="hive-faculty-info-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>
              </div>
              <div>
                <div className="hive-info-label">Name</div>
                <div className="hive-info-value">{profile.name}</div>
              </div>
            </div>
            <div className="hive-faculty-info-row">
              <div className="hive-faculty-info-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              </div>
              <div>
                <div className="hive-info-label">Email</div>
                <div className="hive-info-value">{profile.email}</div>
              </div>
            </div>
            <div className="hive-faculty-info-row">
              <div className="hive-faculty-info-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><line x1="9" y1="22" x2="9" y2="22" /><line x1="15" y1="22" x2="15" y2="22" /><line x1="9" y1="6" x2="9" y2="6" /><line x1="15" y1="6" x2="15" y2="6" /><line x1="9" y1="10" x2="9" y2="10" /><line x1="15" y1="10" x2="15" y2="10" /><line x1="9" y1="14" x2="9" y2="14" /><line x1="15" y1="14" x2="15" y2="14" /></svg>
              </div>
              <div>
                <div className="hive-info-label">Department</div>
                <div className="hive-info-value">-</div>
              </div>
            </div>
            <div className="hive-faculty-info-row">
              <div className="hive-faculty-info-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <div>
                <div className="hive-info-label">Designation</div>
                <div className="hive-info-value">-</div>
              </div>
            </div>
            <div className="hive-faculty-info-row">
              <div className="hive-faculty-info-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
              </div>
              <div>
                <div className="hive-info-label">Status</div>
                <div className="hive-info-value" style={{ textTransform: 'capitalize' }}>{profile.status}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Student Profile (existing functionality preserved) */}
      {isStudent && (
        <div className="hive-card" style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={fieldStyle}>
              <span style={labelStyle}>Roll Number</span>
              <span style={{ fontSize: 14, color: 'var(--ink)' }}>{profile.roll || '-'}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Role</span>
              <span style={{ fontSize: 13, padding: '2px 8px', borderRadius: 4, background: 'var(--surface-alt)', color: 'var(--ink-soft)', display: 'inline-block', width: 'fit-content' }}>
                {profile.role}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={fieldStyle}>
              <span style={labelStyle}>Full Name</span>
              <span style={{ fontSize: 14, color: 'var(--ink)' }}>{profile.name}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>College Email</span>
              <span style={{ fontSize: 14, color: 'var(--ink)' }}>{profile.email}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Status</span>
              <span style={{
                fontSize: 13, padding: '2px 8px', borderRadius: 4,
                background: profile.status === 'active' ? 'var(--green-tint)' : 'var(--red-tint)',
                color: profile.status === 'active' ? 'var(--green)' : 'var(--red)',
                display: 'inline-block', width: 'fit-content', textTransform: 'capitalize',
              }}>
                {profile.status}
              </span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Branch</span>
              {editing ? (
                <input style={inputStyle} value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} maxLength={100} aria-label="Branch" />
              ) : (
                <span style={{ fontSize: 14, color: 'var(--ink)' }}>{profile.branch || '-'}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Section</span>
              {editing ? (
                <input style={inputStyle} value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} maxLength={20} aria-label="Section" />
              ) : (
                <span style={{ fontSize: 14, color: 'var(--ink)' }}>{profile.section || '-'}</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
            {editing ? (
              <>
                <button className="hive-ghost-btn" style={{ width: 'auto', padding: '10px 20px', marginTop: 0 }} onClick={handleCancel} disabled={saving}>Cancel</button>
                <button className="hive-primary-btn" style={{ width: 'auto', padding: '10px 20px', marginTop: 0, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button className="hive-ghost-btn" style={{ width: 'auto', padding: '10px 20px', marginTop: 0 }} onClick={() => setEditing(true)}>Edit Profile</button>
            )}
          </div>
        </div>
      )}

      {/* Student Settings Section */}
      {isStudent && (
        <>
          <div className="hive-section-title" style={{ marginTop: 24 }}>Settings</div>
          <div className="hive-card" style={{ padding: '4px 14px' }}>
            <div className="hive-settings-row">
              <div className="hive-settings-left">
                <div className="hive-faculty-info-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Push notifications</div>
                  <div className="hive-settings-sub">Alerts for session start and end</div>
                </div>
              </div>
              <label className="hive-switch">
                <input type="checkbox" defaultChecked />
                <span className="track"><span className="thumb"></span></span>
              </label>
            </div>
            <div className="hive-settings-row">
              <div className="hive-settings-left">
                <div className="hive-faculty-info-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Session reminders</div>
                  <div className="hive-settings-sub">Nudge if a summary is pending</div>
                </div>
              </div>
              <label className="hive-switch">
                <input type="checkbox" defaultChecked />
                <span className="track"><span className="thumb"></span></span>
              </label>
            </div>
            <div className="hive-settings-row">
              <div className="hive-settings-left">
                <div className="hive-faculty-info-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Dark mode</div>
                  <div className="hive-settings-sub">Easier on the eyes at night</div>
                </div>
              </div>
              <label className="hive-switch">
                <input type="checkbox" />
                <span className="track"><span className="thumb"></span></span>
              </label>
            </div>
          </div>
        </>
      )}

      {/* Photo management (both roles) */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
        {profile.profilePicture && (
          <button
            onClick={handleRemove}
            disabled={uploading}
            style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--red-tint)', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--red)', background: 'var(--surface)' }}
          >
            Remove Photo
          </button>
        )}
      </div>

      {/* Give Feedback (faculty) */}
      {isFaculty && (
        <>
          <button className="hive-ghost-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            Give Feedback
          </button>
        </>
      )}

      {/* Logout */}
      <button className="hive-danger-btn" onClick={logout} style={{ marginTop: 16 }}>
        Logout
      </button>
    </div>
  );
}

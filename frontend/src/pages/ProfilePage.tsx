import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../store/AuthContext';
import { profileApi } from '../services/apiService';
import { Loading } from '../components/common/Loading';
import type { ProfileData } from '@workspace/shared';

export default function ProfilePage() {
  const { user } = useAuth();
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
    return <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '32px' }}>Profile not found</p>;
  }

  const pictureUrl = profile.profilePicture
    ? profileApi.pictureUrl(profile.id)
    : null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    background: editing ? '#fff' : 'transparent',
    cursor: editing ? 'text' : 'default',
  };

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>Profile</h1>

      {error && (
        <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: '#fef2f2', color: 'var(--color-error)', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: '#f0fdf4', color: 'var(--color-success)', marginBottom: '16px', fontSize: '14px' }}>
          {success}
        </div>
      )}

      <div style={{
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: pictureUrl ? `url(${pictureUrl}) center/cover` : 'var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '40px',
            color: 'var(--color-text-secondary)',
            fontWeight: 600,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {!pictureUrl && (profile.name?.charAt(0)?.toUpperCase() || '?')}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <label className="touch-target" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              background: '#fff',
            }}>
              {uploading ? 'Uploading...' : profile.profilePicture ? 'Change Photo' : 'Upload Photo'}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </label>
            {profile.profilePicture && (
              <button
                className="touch-target"
                onClick={handleRemove}
                disabled={uploading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #fca5a5',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#b91c1c',
                  background: '#fff',
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {user?.role === 'student' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={fieldStyle}>
              <span style={labelStyle}>Roll Number</span>
              <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{profile.roll || '-'}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Role</span>
              <span style={{
                fontSize: '13px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#f3f4f6',
                color: 'var(--color-text-secondary)',
                display: 'inline-block',
                width: 'fit-content',
              }}>
                {profile.role}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Full Name</span>
            <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{profile.name}</span>
          </div>

          <div style={fieldStyle}>
            <span style={labelStyle}>College Email</span>
            <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{profile.email}</span>
          </div>

          <div style={fieldStyle}>
            <span style={labelStyle}>Status</span>
            <span style={{
              fontSize: '13px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: profile.status === 'active' ? '#f0fdf4' : '#fef2f2',
              color: profile.status === 'active' ? '#15803d' : '#b91c1c',
              display: 'inline-block',
              width: 'fit-content',
              textTransform: 'capitalize',
            }}>
              {profile.status}
            </span>
          </div>

          {user?.role === 'student' && (
            <>
              <div style={fieldStyle}>
                <span style={labelStyle}>Branch</span>
                {editing ? (
                  <input
                    style={inputStyle}
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    maxLength={100}
                    aria-label="Branch"
                  />
                ) : (
                  <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{profile.branch || '-'}</span>
                )}
              </div>

              <div style={fieldStyle}>
                <span style={labelStyle}>Section</span>
                {editing ? (
                  <input
                    style={inputStyle}
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    maxLength={20}
                    aria-label="Section"
                  />
                ) : (
                  <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{profile.section || '-'}</span>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
          {editing ? (
            <>
              <button
                className="touch-target"
                onClick={handleCancel}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: '#fff',
                  color: 'var(--color-text-primary)',
                }}
              >
                Cancel
              </button>
              <button
                className="touch-target"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: 'var(--color-primary)',
                  color: '#fff',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              className="touch-target"
              onClick={() => setEditing(true)}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                background: '#fff',
                color: 'var(--color-text-primary)',
              }}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

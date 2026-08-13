import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../services/apiService';
import { Loading } from '../components/common/Loading';
import type { ProfileData } from '@workspace/shared';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    profileApi.get()
      .then((res) => setProfile(res.data))
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await profileApi.uploadPicture(file);
      setProfile((prev) => prev ? { ...prev, profilePicture: '_updated_' } : prev);
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
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

  return (
    <div>
      {/* Profile Hero */}
      <div className="hive-profile-hero">
        <div className="hive-profile-photo">
          {pictureUrl ? (
            <img src={pictureUrl} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : null}
          <label className="hive-cam-badge" style={{ cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
              <circle cx="12" cy="13.5" r="3.4" />
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
        {isStudent && (
          <div className="hive-profile-sub">{profile.roll || ''}</div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="hive-alert-error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {/* Student Profile Card */}
      {isStudent && (
        <div className="hive-card" style={{ marginTop: 18, padding: '4px 14px' }}>
          <div className="hive-info-row">
            <div className="hive-info-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c1.3-3.8 4.3-6 7.5-6s6.2 2.2 7.5 6" /></svg>
            </div>
            <div>
              <div className="hive-info-label">Name</div>
              <div className="hive-info-value">{profile.name}</div>
            </div>
          </div>
          <div className="hive-info-row">
            <div className="hive-info-ic">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8.5 5v10L12 22l-8.5-5V7z" /></svg>
            </div>
            <div>
              <div className="hive-info-label">Roll number</div>
              <div className="hive-info-value">{profile.roll || '-'}</div>
            </div>
          </div>
          <div className="hive-info-row">
            <div className="hive-info-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><polyline points="9 12 11.2 14.2 15.5 9.8" /></svg>
            </div>
            <div>
              <div className="hive-info-label">Branch</div>
              <div className="hive-info-value">{profile.branch || '-'}</div>
            </div>
          </div>
          <div className="hive-info-row">
            <div className="hive-info-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="2" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M19.5 4.5l-1.8 1.8M6.3 17.7l-1.8 1.8" /></svg>
            </div>
            <div>
              <div className="hive-info-label">Section</div>
              <div className="hive-info-value">{profile.section || '-'}</div>
            </div>
          </div>
          <div className="hive-info-row">
            <div className="hive-info-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9.5a1 1 0 0 0 1 1h3.5V15h3v5.5H17a1 1 0 0 0 1-1V10" /></svg>
            </div>
            <div>
              <div className="hive-info-label">Hostel</div>
              <div className="hive-info-value">{profile.hostel || '-'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Profile Card */}
      {isFaculty && (
        <div className="hive-card" style={{ marginTop: 18, padding: '4px 14px' }}>
          <div className="hive-info-row">
            <div className="hive-info-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c1.3-3.8 4.3-6 7.5-6s6.2 2.2 7.5 6" /></svg>
            </div>
            <div>
              <div className="hive-info-label">Name</div>
              <div className="hive-info-value">{profile.name}</div>
            </div>
          </div>
          <div className="hive-info-row">
            <div className="hive-info-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            </div>
            <div>
              <div className="hive-info-label">Email</div>
              <div className="hive-info-value">{profile.email}</div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Button (student) */}
      {isStudent && (
        <button className="hive-ghost-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={() => navigate('/profile/edit')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></svg>
          Edit profile
        </button>
      )}

      {/* Logout */}
      <button className="hive-danger-btn" onClick={logout} style={{ marginTop: 16 }}>
        Log out
      </button>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../services/apiService';
import type { ProfileData } from '@workspace/shared';

export default function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    profileApi.get()
      .then((res) => setProfile(res.data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="hive-section-title">Account</div>
      <div className="hive-card" style={{ padding: '2px 14px' }}>
        <div className="hive-settings-row">
          <div className="hive-settings-left">
            <div className="hive-info-ic">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8.5 5v10L12 22l-8.5-5V7z" /></svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Roll number</div>
              <div className="hive-settings-sub" style={{ fontFamily: 'var(--font-mono)' }}>{profile?.roll || '-'}</div>
            </div>
          </div>
        </div>
        <div className="hive-settings-row">
          <div className="hive-settings-left">
            <div className="hive-info-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><polyline points="9 12 11.2 14.2 15.5 9.8" /></svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Branch</div>
              <div className="hive-settings-sub">{profile?.branch || '-'}</div>
            </div>
          </div>
        </div>
        <div className="hive-settings-row">
          <div className="hive-settings-left">
            <div className="hive-info-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9.5a1 1 0 0 0 1 1h3.5V15h3v5.5H17a1 1 0 0 0 1-1V10" /></svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Hostel</div>
              <div className="hive-settings-sub">{profile?.hostel || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="hive-section-title">About</div>
      <div className="hive-card" style={{ padding: '2px 14px' }}>
        <div className="hive-settings-row">
          <div className="hive-settings-left">
            <div className="hive-info-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><line x1="12" y1="10.5" x2="12" y2="16" /><circle cx="12" cy="7.4" r="1" fill="currentColor" stroke="none" /></svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>App version</div>
              <div className="hive-settings-sub">Hive 1.0.0</div>
            </div>
          </div>
        </div>
      </div>

      <button className="hive-danger-btn" onClick={logout} style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
        Log out
      </button>
    </div>
  );
}

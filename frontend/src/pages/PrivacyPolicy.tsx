import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="hive-back-row">
        <button className="hive-icon-btn ghost" onClick={() => navigate(-1)} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
            <polyline points="15 6 9 12 15 18" />
          </svg>
        </button>
        <h1>Privacy Policy</h1>
      </div>
      <div style={{ padding: '4px 20px 28px' }}>
        <div style={{ background: 'var(--primary-tint)', color: 'var(--primary-dark)', fontSize: 12, fontWeight: 600, padding: '10px 12px', borderRadius: 'var(--radius-sm)', margin: '14px 0 6px', lineHeight: 1.5 }}>
          Placeholder content for the Hive prototype — not a binding legal document.
        </div>

        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, margin: '0 0 7px' }}>Overview</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>Hive helps you track study and coding sessions and confirms attendance with faculty. This page explains what information the app uses and why.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, margin: '0 0 7px' }}>Information we use</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>Your profile details (name, roll number, branch, section, hostel), your session activity (category, entry time, duration, work summaries), and your attendance history.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, margin: '0 0 7px' }}>How we use it</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>To show your stats and streaks, to let faculty confirm you attended a session, and to send the session alerts and reminders you've turned on in Settings.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, margin: '0 0 7px' }}>Data retention</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>Your session and attendance history stays on your account for as long as it's useful to you. You can ask to have it deleted at any time.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, margin: '0 0 7px' }}>Your choices</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>Control notification and reminder preferences from Settings, and keep your profile details up to date from Edit Profile whenever they change.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, margin: '0 0 7px' }}>Contact</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>For questions about how your data is used, reach out through your campus administrator.</p>
        </div>
      </div>
    </div>
  );
}

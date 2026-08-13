import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="hive-back-row">
        <button className="hive-icon-btn ghost" onClick={() => navigate(-1)} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
            <polyline points="15 6 9 12 15 18" />
          </svg>
        </button>
        <h1>Terms of Service</h1>
      </div>
      <div style={{ padding: '4px 20px 28px' }}>
        <div style={{ background: 'var(--primary-tint)', color: 'var(--primary-dark)', fontSize: 12, fontWeight: 600, padding: '10px 12px', borderRadius: 'var(--radius-sm)', margin: '14px 0 6px', lineHeight: 1.5 }}>
          Placeholder content for the Hive prototype — not a binding legal document.
        </div>

        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, margin: '0 0 7px' }}>Acceptance of terms</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>Using Hive means you agree to these terms, alongside your institution's own academic and attendance policies.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, margin: '0 0 7px' }}>Using Hive</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>Log your sessions honestly, keep your profile details accurate, and use the attendance features only for your own account.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, margin: '0 0 7px' }}>Account responsibilities</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>Keep your device and login secure. Activity logged under your account is treated as yours, so don't share access with anyone else.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, margin: '0 0 7px' }}>Acceptable use</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>Don't attempt to falsify attendance, mark sessions you didn't take, or interfere with another student's or faculty member's data.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, margin: '0 0 7px' }}>Availability</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>Hive is provided as-is during this preview. Features may change, and some may be temporarily unavailable, without notice.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, margin: '0 0 7px' }}>Changes to these terms</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>These terms may be updated as the app evolves. Continuing to use Hive after an update means you accept the current version.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, margin: '0 0 7px' }}>Contact</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>For questions about these terms, reach out through your campus administrator.</p>
        </div>
      </div>
    </div>
  );
}

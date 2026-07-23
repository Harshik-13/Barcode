import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <h1>403</h1>
      <p style={{ color: '#6b7280', marginTop: '8px' }}>
        You don't have permission to access this page.
      </p>
      <Link
        to="/dashboard"
        style={{
          display: 'inline-block',
          marginTop: '16px',
          color: '#2563eb',
          textDecoration: 'none',
        }}
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

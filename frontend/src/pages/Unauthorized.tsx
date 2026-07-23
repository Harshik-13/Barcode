import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <h1>401</h1>
      <p style={{ color: '#6b7280', marginTop: '8px' }}>
        You need to sign in to access this page.
      </p>
      <Link
        to="/login"
        style={{
          display: 'inline-block',
          marginTop: '16px',
          color: '#2563eb',
          textDecoration: 'none',
        }}
      >
        Sign in
      </Link>
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <h1>404</h1>
      <p style={{ color: '#6b7280', marginTop: '8px' }}>
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-block',
          marginTop: '16px',
          color: '#2563eb',
          textDecoration: 'none',
        }}
      >
        Go Home
      </Link>
    </div>
  );
}

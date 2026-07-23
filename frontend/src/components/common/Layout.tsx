import { Outlet } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {isAuthenticated && (
        <header
          style={{
            background: '#fff',
            borderBottom: '1px solid #e5e7eb',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <strong>8Hour Workspace</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              {user?.name}
            </span>
            <button
              onClick={logout}
              style={{
                background: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                padding: '4px 12px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Logout
            </button>
          </div>
        </header>
      )}
      <main style={{ flex: 1, padding: '24px' }}>
        <Outlet />
      </main>
    </div>
  );
}

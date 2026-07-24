import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';

const NAV_ITEMS: Record<string, Array<{ label: string; path: string }>> = {
  student: [
    { label: 'Dashboard', path: '/' },
  ],
  faculty: [
    { label: 'Dashboard', path: '/' },
    { label: 'Scanner', path: '/scanner' },
    { label: 'Sessions', path: '/sessions' },
  ],
  admin: [
    { label: 'Dashboard', path: '/' },
    { label: 'Students', path: '/students' },
    { label: 'Categories', path: '/categories' },
    { label: 'Sessions', path: '/sessions' },
    { label: 'Activity Logs', path: '/activity-logs' },
    { label: 'Scanner', path: '/scanner' },
  ],
};

const linkBase: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  textDecoration: 'none',
  color: '#6b7280',
  transition: 'background 0.15s, color 0.15s',
};

const linkActive: React.CSSProperties = {
  ...linkBase,
  background: '#eff6ff',
  color: '#2563eb',
};

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navItems = user ? NAV_ITEMS[user.role] || [] : [];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {isAuthenticated && (
        <header
          style={{
            background: '#fff',
            borderBottom: '1px solid #e5e7eb',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '56px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ marginRight: '16px' }}>8Hour Workspace</strong>
            <nav style={{ display: 'flex', gap: '4px' }}>
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  style={({ isActive }) => isActive ? linkActive : linkBase}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              {user?.name}
              <span style={{ marginLeft: '6px', padding: '2px 6px', borderRadius: '4px', background: '#f3f4f6', fontSize: '12px', color: '#6b7280' }}>
                {user?.role}
              </span>
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

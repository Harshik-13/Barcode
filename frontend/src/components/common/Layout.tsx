import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../../services/apiService';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const NAV_ITEMS: Record<string, Array<{ label: string; path: string }>> = {
  student: [
    { label: 'Dashboard', path: '/' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Profile', path: '/profile' },
  ],
  faculty: [
    { label: 'Dashboard', path: '/' },
    { label: 'Scanner', path: '/scanner' },
    { label: 'Sessions', path: '/sessions' },
    { label: 'Profile', path: '/profile' },
  ],
  admin: [
    { label: 'Dashboard', path: '/' },
    { label: 'Students', path: '/students' },
    { label: 'Faculty', path: '/faculty-management' },
    { label: 'Categories', path: '/categories' },
    { label: 'Sessions', path: '/sessions' },
    { label: 'Activity Logs', path: '/activity-logs' },
    { label: 'Scanner', path: '/scanner' },
    { label: 'Profile', path: '/profile' },
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
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = user ? NAV_ITEMS[user.role] || [] : [];
  const [unreadCount, setUnreadCount] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  const closeNav = useCallback(() => setNavOpen(false), []);

  useEffect(() => { closeNav(); }, [location.pathname, closeNav]);

  const { isSupported, permission, subscription, subscribe } = usePushNotifications();

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    if (!isSupported || permission === 'denied' || subscription) return;
    subscribe();
  }, [user, isSupported, permission, subscription, subscribe]);

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    const fetchCount = () => {
      notificationsApi.unreadCount()
        .then((res) => setUnreadCount(res.data.count))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {isAuthenticated && (
        <header
          style={{
            background: '#fff',
            borderBottom: '1px solid #e5e7eb',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '56px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ marginRight: '12px', fontSize: '15px', whiteSpace: 'nowrap' }}>8Hour</strong>
            <nav
              className={`resp-nav-links${navOpen ? ' open' : ''}`}
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={closeNav}
                  style={({ isActive }) => ({ ...linkBase, ...(isActive ? linkActive : {}) })}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              className="resp-hamburger"
              onClick={() => setNavOpen(!navOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', fontSize: '22px', color: '#6b7280', lineHeight: 1 }}
              aria-label="Toggle navigation"
            >
              {navOpen ? '\u2715' : '\u2630'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user?.role === 'student' && (
              <button
                onClick={() => navigate('/notifications')}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                style={{ position: 'relative', cursor: 'pointer', padding: '4px', background: 'none', border: 'none', fontSize: '18px', lineHeight: 1 }}
              >
                <span aria-hidden="true">&#128276;</span>
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-2px', right: '-4px', background: '#ef4444', color: '#fff', borderRadius: '999px', padding: '1px 6px', fontSize: '11px', fontWeight: 600, lineHeight: 1.4 }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}
            <span className="resp-hide@mobile" style={{ color: '#6b7280', fontSize: '14px' }}>
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
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Logout
            </button>
          </div>
        </header>
      )}
      <div className={`resp-nav-overlay${navOpen ? ' open' : ''}`} onClick={closeNav} />
      <main style={{ flex: 1, padding: '24px' }}>
        <Outlet />
      </main>
      <style>{`
        @media (max-width: 768px) {
          header { padding: 0 12px !important; }
          main { padding: 12px !important; }
        }
        @media (max-width: 480px) {
          .resp-nav-links a { padding: 10px 14px !important; font-size: 15px !important; }
        }
      `}</style>
    </div>
  );
}

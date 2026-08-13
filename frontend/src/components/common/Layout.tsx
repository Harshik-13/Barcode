import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../../services/apiService';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const STUDENT_NAV = [
  { label: 'Home', path: '/', icon: 'home' },
  { label: 'Alerts', path: '/notifications', icon: 'bell' },
  { label: 'Profile', path: '/profile', icon: 'user' },
];

const FACULTY_NAV = [
  { label: 'Home', path: '/', icon: 'home' },
  { label: 'Students', path: '/sessions', icon: 'users' },
  { label: 'Scanner', path: '/scanner', icon: 'scan' },
  { label: 'Profile', path: '/profile', icon: 'user' },
];

const ADMIN_NAV = [
  { label: 'Dashboard', path: '/' },
  { label: 'Students', path: '/students' },
  { label: 'Faculty', path: '/faculty-management' },
  { label: 'Categories', path: '/categories' },
  { label: 'Sessions', path: '/sessions' },
  { label: 'Activity Logs', path: '/activity-logs' },
  { label: 'Scanner', path: '/scanner' },
  { label: 'Profile', path: '/profile' },
];

const NAV_MAP: Record<string, Array<{ label: string; path: string }>> = {
  student: STUDENT_NAV,
  faculty: FACULTY_NAV,
  admin: ADMIN_NAV,
};

const linkBase: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  textDecoration: 'none',
  color: '#635E7A',
  transition: 'background 0.15s, color 0.15s',
};

const linkActive: React.CSSProperties = {
  ...linkBase,
  background: '#ECE7FC',
  color: '#5B3FE0',
};

function HiveLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 17, height: 17 }}>
      <path d="M12 3l7.5 4.3v9.4L12 21l-7.5-4.3V7.3z" />
    </svg>
  );
}

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9.5a1 1 0 0 0 1 1h3.5V15h3v5.5H17a1 1 0 0 0 1-1V10" /></svg>,
    bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>,
    user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c1.3-3.8 4.3-6 7.5-6s6.2 2.2 7.5 6" /></svg>,
    users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    scan: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="7" y1="12" x2="17" y2="12" /></svg>,
  };
  return icons[name] || null;
}

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';
  const navItems = user ? NAV_MAP[user.role] || [] : [];
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

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Outlet />
      </div>
    );
  }

  if (isStudent) {
    return (
      <div className="hive-app">
        <header className="hive-header">
          <div className="hive-brand">
            <div className="hive-hex"><HiveLogo /></div>
            <span className="hive-wordmark">Hive</span>
          </div>
          <div className="hive-header-actions">
            <button
              className="hive-icon-btn"
              onClick={() => navigate('/notifications')}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
              {unreadCount > 0 && <span className="dot" />}
            </button>
            <button
              className="hive-avatar"
              onClick={() => navigate('/profile')}
              aria-label="Profile"
            >
              {user?.name ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ) : null}
            </button>
          </div>
        </header>

        <div className="hive-scroll">
          <Outlet />
        </div>

        <nav className="hive-bottom-nav">
          {STUDENT_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `hive-nav-btn${isActive ? ' active' : ''}`}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    );
  }

  if (isFaculty) {
    return (
      <div className="hive-app">
        <header className="hive-header">
          <div className="hive-brand">
            <div className="hive-hex"><HiveLogo /></div>
            <span className="hive-wordmark">Hive</span>
          </div>
          <div className="hive-header-actions">
            <button
              className="hive-icon-btn ghost"
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
            </button>
            <button
              className="hive-avatar"
              onClick={() => navigate('/profile')}
              aria-label="Profile"
            >
              {user?.name ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ) : null}
            </button>
          </div>
        </header>

        <div className="hive-scroll">
          <Outlet />
        </div>

        <nav className="hive-bottom-nav">
          {FACULTY_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `hive-nav-btn${isActive ? ' active' : ''}`}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid var(--line)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong style={{ marginRight: '12px', fontSize: '15px', whiteSpace: 'nowrap' }}>Hive</strong>
          <nav className={`resp-nav-links${navOpen ? ' open' : ''}`}>
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
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', fontSize: '22px', color: '#635E7A', lineHeight: 1 }}
            aria-label="Toggle navigation"
          >
            {navOpen ? '\u2715' : '\u2630'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="resp-hide@mobile" style={{ color: '#635E7A', fontSize: '14px' }}>
            {user?.name}
            <span style={{ marginLeft: '6px', padding: '2px 6px', borderRadius: '4px', background: '#F6F4FC', fontSize: '12px', color: '#635E7A' }}>
              {user?.role}
            </span>
          </span>
          <button
            onClick={logout}
            style={{
              background: 'none',
              border: '1px solid var(--line)',
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

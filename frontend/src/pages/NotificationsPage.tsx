import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { notificationsApi } from '../services/apiService';
import type { NotificationItem } from '../services/apiService';

const NOTIF_ICONS: Record<string, { bg: string; color: string; svg: JSX.Element }> = {
  session_started: {
    bg: 'var(--green-tint)', color: 'var(--green)',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polygon points="10 8.5 16 12 10 15.5" fill="currentColor" stroke="none" /></svg>,
  },
  summary_pending: {
    bg: 'var(--amber-tint)', color: 'var(--amber)',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>,
  },
  session_completed: {
    bg: 'var(--primary-tint)', color: 'var(--primary)',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="8.5 12.5 11 15 15.5 9.5" /></svg>,
  },
  summary_approved: {
    bg: 'var(--teal-tint)', color: 'var(--teal)',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><polyline points="9 12 11.2 14.2 15.5 9.8" /></svg>,
  },
};

const NOTIF_LABELS: Record<string, string> = {
  session_started: 'Session Started',
  summary_pending: 'Summary Required',
  session_completed: 'Session Completed',
  summary_approved: 'Summary Approved',
};

function getNotifIcon(type: string) {
  return NOTIF_ICONS[type] || NOTIF_ICONS.session_started;
}

function getNotifLabel(type: string) {
  return NOTIF_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFaculty = user?.role === 'faculty';
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');

    if (isFaculty) {
      notificationsApi.facultyList(1, 50)
        .then((res) => setNotifications(res.data))
        .catch(() => setError('Failed to load notifications'))
        .finally(() => setLoading(false));
    } else {
      notificationsApi.list(1, 50)
        .then((res) => setNotifications(res.data))
        .catch(() => setError('Failed to load notifications'))
        .finally(() => setLoading(false));
    }
  }

  useEffect(() => { load(); }, [isFaculty]);

  function handleMarkAsRead(id: number) {
    if (isFaculty) {
      notificationsApi.facultyMarkAsRead(id).then(() => {
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      }).catch(() => {});
    } else {
      notificationsApi.markAsRead(id).then(() => {
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      }).catch(() => {});
    }
  }

  function handleMarkAllAsRead() {
    if (isFaculty) {
      const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
      Promise.all(unreadIds.map((id) => notificationsApi.facultyMarkAsRead(id)))
        .then(() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        })
        .catch(() => {});
    } else {
      notificationsApi.markAllAsRead().then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }).catch(() => {});
    }
  }

  if (loading) {
    return <div className="hive-loading">Loading notifications...</div>;
  }

  if (error) {
    return <div className="hive-alert-error">{error}</div>;
  }

  const unread = notifications.filter((n) => !n.isRead);

  return (
    <div>
      {unread.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            onClick={handleMarkAllAsRead}
            className="hive-ghost-btn"
            style={{ width: 'auto', padding: '8px 16px', marginTop: 0, fontSize: 13 }}
          >
            Mark all read
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--ink-faint)' }}>
          <p style={{ fontSize: 14, margin: 0 }}>No notifications yet</p>
        </div>
      ) : (
        <div>
          {notifications.map((n) => {
            const icon = getNotifIcon(n.type);
            return (
              <div key={n.id} className="hive-notif-row" style={{ cursor: n.sessionId ? 'pointer' : 'default' }} onClick={() => {
                handleMarkAsRead(n.id);
                if (n.sessionId) navigate(`/sessions/${n.sessionId}`);
              }}>
                <div className="hive-notif-ic" style={{ background: icon.bg, color: icon.color }}>
                  {icon.svg}
                </div>
                <div className="hive-notif-body">
                  <p className="hive-notif-title">{getNotifLabel(n.type)}</p>
                  <p className="hive-notif-text">{n.message}</p>
                  <span className="hive-notif-time">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

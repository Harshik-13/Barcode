import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../services/apiService';
import type { NotificationItem } from '../services/apiService';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');
    notificationsApi.list(1, 50)
      .then((res) => setNotifications(res.data))
      .catch(() => setError('Failed to load notifications'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleMarkAsRead(id: number) {
    notificationsApi.markAsRead(id).then(() => {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    }).catch(() => {});
  }

  function handleMarkAllAsRead() {
    notificationsApi.markAllAsRead().then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }).catch(() => {});
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading notifications...</div>;
  }

  if (error) {
    return <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>{error}</div>;
  }

  const unread = notifications.filter((n) => !n.isRead);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Notifications</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>{unread.length} unread</p>
        </div>
        {unread.length > 0 && (
          <button onClick={handleMarkAllAsRead} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No notifications yet</p>
          <p style={{ fontSize: '14px' }}>Notifications will appear here when you scan in or out of sessions.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map((n) => (
            <div key={n.id} style={{ padding: '16px', background: n.isRead ? '#fff' : '#eff6ff', borderRadius: '8px', border: n.isRead ? '1px solid #e5e7eb' : '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: n.isRead ? 400 : 500, marginBottom: '4px' }}>{n.message}</div>
                <div style={{ color: '#9ca3af', fontSize: '12px' }}>{new Date(n.createdAt).toLocaleString()}</div>
                {n.sessionId && (
                  <button onClick={() => navigate(`/sessions/${n.sessionId}`)} style={{ marginTop: '8px', padding: '4px 10px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#6b7280' }}>
                    View Session
                  </button>
                )}
              </div>
              {!n.isRead && (
                <button onClick={() => handleMarkAsRead(n.id)} style={{ padding: '4px 10px', background: 'none', border: '1px solid #bfdbfe', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#2563eb', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

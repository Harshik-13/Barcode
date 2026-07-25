import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { dashboardApi, sessionsStatsApi, facultyApi, categoriesApi, activityLogsApi } from '../services/apiService';
import type { DashboardStats, FacultyMember } from '../services/apiService';
import type { ActivityLog } from '@workspace/shared';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [liveCount, setLiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    Promise.all([
      dashboardApi.stats().then(r => r.data).catch(() => null),
      sessionsStatsApi.live().then(r => r.data.count).catch(() => 0),
    ])
      .then(([s, live]) => {
        setStats(s);
        setLiveCount(live);
      })
      .catch(() => setError('Failed to load statistics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>{error}</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Admin Dashboard</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>Welcome, {user?.name}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Total Students" value={stats?.totalStudents ?? 0} />
        <StatCard label="Enrolled" value={stats?.enrolledStudents ?? 0} color="#10b981" />
        <StatCard label="Invited" value={stats?.invitedStudents ?? 0} color="#f59e0b" />
        <StatCard label="Active Faculty" value={stats?.activeFaculty ?? 0} color="#3b82f6" />
        <StatCard label="Invited Faculty" value={stats?.invitedFaculty ?? 0} color="#f59e0b" />
        <StatCard label="Students Inside" value={liveCount} color="#10b981" />
        <StatCard label="Active Categories" value={stats?.activeCategories ?? 0} color="#8b5cf6" />
        <StatCard label="Awaiting Summary" value={stats?.awaitingSummary ?? 0} color="#f97316" />
        <StatCard label="Today's Sessions" value={stats?.todaySessions ?? 0} color="#14b8a6" />
        <StatCard label="Today's Activity" value={stats?.recentLogs ?? 0} color="#6366f1" />
        <StatCard label="Total Sessions" value={(stats?.activeSessions ?? 0) + (stats?.awaitingSummary ?? 0)} color="#111827" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        <QuickLink title="Manage Students" path="/students" navigate={navigate} />
        <QuickLink title="Manage Faculty" path="/faculty-management" navigate={navigate} />
        <QuickLink title="Manage Categories" path="/categories" navigate={navigate} />
        <QuickLink title="View Sessions" path="/sessions" navigate={navigate} />
        <QuickLink title="Activity Logs" path="/activity-logs" navigate={navigate} />
        <QuickLink title="Attendance Scanner" path="/scanner" navigate={navigate} />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '22px', fontWeight: 700, color: color || '#111827', margin: 0 }}>{value}</p>
    </div>
  );
}

function QuickLink({ title, path, navigate }: { title: string; path: string; navigate: (path: string) => void }) {
  return (
    <button
      onClick={() => navigate(path)}
      style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '14px', fontWeight: 500, textAlign: 'left', transition: 'border-color 0.15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
    >
      {title} →
    </button>
  );
}

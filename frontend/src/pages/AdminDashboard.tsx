import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { studentsApi, categoriesApi, sessionsApi, activityLogsApi } from '../services/apiService';

interface Stats {
  totalStudents: number;
  enrolledStudents: number;
  activeCategories: number;
  activeSessions: number;
  awaitingSummary: number;
  recentLogs: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    Promise.all([
      studentsApi.list(1, 1, 'enrolled').catch(() => null),
      studentsApi.list(1, 1).catch(() => null),
      categoriesApi.list('active').catch(() => null),
      sessionsApi.list({ status: 'active', limit: 1 }).catch(() => null),
      sessionsApi.list({ status: 'awaiting_summary', limit: 1 }).catch(() => null),
      activityLogsApi.recent(1).catch(() => null),
    ])
      .then(([enrolled, all, categories, active, awaiting, logs]) => {
        setStats({
          enrolledStudents: enrolled?.pagination?.total ?? 0,
          totalStudents: all?.pagination?.total ?? 0,
          activeCategories: categories?.data?.length ?? 0,
          activeSessions: active?.pagination?.total ?? 0,
          awaitingSummary: awaiting?.pagination?.total ?? 0,
          recentLogs: logs?.data?.length ?? 0,
        });
      })
      .catch(() => setError('Failed to load statistics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>Admin Dashboard</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>Welcome, {user?.name}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Total Students" value={stats?.totalStudents ?? 0} />
        <StatCard label="Enrolled" value={stats?.enrolledStudents ?? 0} color="#10b981" />
        <StatCard label="Active Categories" value={stats?.activeCategories ?? 0} color="#3b82f6" />
        <StatCard label="Active Sessions" value={stats?.activeSessions ?? 0} color="#f59e0b" />
        <StatCard label="Awaiting Summary" value={stats?.awaitingSummary ?? 0} color="#f97316" />
        <StatCard label="Recent Activity" value={stats?.recentLogs ?? 0} color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
        <QuickLink title="Manage Students" path="/students" navigate={navigate} />
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
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: 700, color: color || '#111827' }}>{value}</p>
    </div>
  );
}

function QuickLink({ title, path, navigate }: { title: string; path: string; navigate: (path: string) => void }) {
  return (
    <button
      onClick={() => navigate(path)}
      style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '15px', fontWeight: 500, textAlign: 'left', transition: 'border-color 0.15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
    >
      {title} →
    </button>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { dashboardApi, sessionsStatsApi } from '../services/apiService';
import type { DashboardStats } from '../services/apiService';

export default function AdminDashboard() {
  const { user } = useAuth();
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
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: 'var(--color-error)' }}>{error}</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Admin Dashboard</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Welcome, {user?.name}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
        <StatCard label="Total Students" value={stats?.totalStudents ?? 0} />
        <StatCard label="Students Inside" value={liveCount} />
        <StatCard label="Active Faculty" value={stats?.activeFaculty ?? 0} />
        <StatCard label="Active Categories" value={stats?.activeCategories ?? 0} />
        <StatCard label="Awaiting Summary" value={stats?.awaitingSummary ?? 0} />
        <StatCard label="Today's Sessions" value={stats?.todaySessions ?? 0} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: '16px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{value}</p>
    </div>
  );
}

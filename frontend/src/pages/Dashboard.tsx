import { useAuth } from '../store/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <p style={{ color: '#6b7280', marginTop: '8px' }}>
        Welcome, {user?.name}
      </p>
    </div>
  );
}

import { useState, useEffect } from 'react';

interface ScanRow {
  roll: string;
  mode: string;
  hostel_id: string;
  device_id: string;
  timestamp: number;
  status: string;
  metadata: {
    FirstName?: string;
    LastName?: string;
    hostelName?: string;
    foodType?: string;
    scanType?: string;
  };
}

interface StudentActivityProps {
  onClose: () => void;
}

export default function StudentActivity({ onClose }: StudentActivityProps) {
  const [loading, setLoading] = useState(false);
  const [reportRows, setReportRows] = useState<ScanRow[]>([]);
  const [foodTypeFilter, setFoodTypeFilter] = useState('');

  const fetchActivity = async () => {
    setLoading(true);
    try {
  const token = localStorage.getItem('app_token');
      if (!token) {
        alert('Not authenticated. Please login.');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (foodTypeFilter) params.append('foodType', foodTypeFilter);
      
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const url = `${apiBase}/api/student/activity?${params.toString()}`;
      
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      
      const data = await resp.json();
      setReportRows(data.rows || []);
    } catch (err) {
      console.error('[StudentActivity] fetch error', err);
      alert('Failed to fetch activity. Check console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-fetch on mount
    fetchActivity();
  }, []); // Only on mount

  const exportCSV = () => {
    if (reportRows.length === 0) {
      alert('No data to export');
      return;
    }
    
    const headers = ['Roll', 'Name', 'Mode', 'Hostel', 'Timestamp', 'Status', 'Food Type', 'Scan Type'];
    const csvRows = [headers.join(',')];
    
    reportRows.forEach(r => {
      const name = `${r.metadata?.FirstName || ''} ${r.metadata?.LastName || ''}`.trim();
      const hostel = r.metadata?.hostelName || r.hostel_id;
      const ts = new Date(r.timestamp).toLocaleString();
      const ft = r.metadata?.foodType || '';
      const st = r.metadata?.scanType || '';
      
      csvRows.push([
        r.roll,
        `"${name}"`,
        r.mode,
        hostel,
        `"${ts}"`,
        r.status,
        ft,
        st
      ].join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-activity-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute summary
  const totalScans = reportRows.length;
  const validScans = reportRows.filter(r => r.status === 'valid').length;
  
  const breakfastCount = reportRows.filter(r => (r.metadata?.foodType || '').toLowerCase() === 'breakfast').length;
  const lunchCount = reportRows.filter(r => (r.metadata?.foodType || '').toLowerCase() === 'lunch').length;
  const snacksCount = reportRows.filter(r => (r.metadata?.foodType || '').toLowerCase() === 'snacks').length;
  const dinnerCount = reportRows.filter(r => (r.metadata?.foodType || '').toLowerCase() === 'dinner').length;

  const statusIcon = (status: string) => {
    switch (status) {
      case 'valid': return '✅';
      case 'duplicate': return '🟡';
      case 'already-used': return '❌';
      case 'not-authorized': return '🔴';
      default: return '🚫';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'valid': return '#4ade80';
      case 'duplicate': return '#fbbf24';
      case 'already-used': return '#f87171';
      case 'not-authorized': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>My Activity</h2>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            color: '#fff',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Close
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', flex: 1 }}>
        {/* Filters */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>Filters</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                Food Type
              </label>
              <select
                value={foodTypeFilter}
                onChange={e => setFoodTypeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px'
                }}
              >
                <option value="">All</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="snacks">Snacks</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>
          </div>

          <button
            onClick={fetchActivity}
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              marginRight: '8px'
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>

          <button
            onClick={exportCSV}
            style={{
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>{totalScans}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Total Scans</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{validScans}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Valid</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>🍳 {breakfastCount}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Breakfast</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>🍛 {lunchCount}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Lunch</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>🍪 {snacksCount}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Snacks</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>🍝 {dinnerCount}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Dinner</div>
          </div>
        </div>

        {/* Data Table */}
        {reportRows.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280' }}>No activity data</div>
            <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>
              Your scan history will appear here once you start using your passport.
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            overflowX: 'auto'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
              Scan History ({reportRows.length} records)
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr 100px 120px 80px 160px',
              gap: '8px',
              fontSize: '13px'
            }}>
              {/* Header Row */}
              <div style={{ fontWeight: 'bold', color: '#6b7280', padding: '8px 4px', borderBottom: '2px solid #e5e7eb' }}>Status</div>
              <div style={{ fontWeight: 'bold', color: '#6b7280', padding: '8px 4px', borderBottom: '2px solid #e5e7eb' }}>Hostel</div>
              <div style={{ fontWeight: 'bold', color: '#6b7280', padding: '8px 4px', borderBottom: '2px solid #e5e7eb' }}>Mode</div>
              <div style={{ fontWeight: 'bold', color: '#6b7280', padding: '8px 4px', borderBottom: '2px solid #e5e7eb' }}>Food Type</div>
              <div style={{ fontWeight: 'bold', color: '#6b7280', padding: '8px 4px', borderBottom: '2px solid #e5e7eb' }}>Scan Type</div>
              <div style={{ fontWeight: 'bold', color: '#6b7280', padding: '8px 4px', borderBottom: '2px solid #e5e7eb' }}>Time</div>

              {/* Data Rows */}
              {reportRows.map((row, idx) => (
                <>
                  <div key={`status-${idx}`} style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{statusIcon(row.status)}</span>
                    <span style={{ color: statusColor(row.status), fontSize: '11px', fontWeight: '500' }}>
                      {row.status}
                    </span>
                  </div>
                  <div key={`hostel-${idx}`} style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                    {row.metadata?.hostelName || row.hostel_id}
                  </div>
                  <div key={`mode-${idx}`} style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                    {row.mode}
                  </div>
                  <div key={`food-${idx}`} style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                    {row.metadata?.foodType || '-'}
                  </div>
                  <div key={`scan-${idx}`} style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                    {row.metadata?.scanType || '-'}
                  </div>
                  <div key={`time-${idx}`} style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6', color: '#6b7280', fontSize: '12px' }}>
                    {new Date(row.timestamp).toLocaleString()}
                  </div>
                </>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

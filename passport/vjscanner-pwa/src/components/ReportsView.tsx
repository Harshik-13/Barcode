import { useState } from 'react'

type FoodType = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner'

interface ScanRecord {
  roll: string
  mode: string
  hostel_id: string
  device_id?: number
  timestamp: number
  status: string
  metadata: {
    foodType?: FoodType
    online?: boolean
    verify?: string
    value?: string
    scanType?: string
    [key: string]: any
  }
}

export default function ReportsView({ onClose }: { onClose: () => void }) {
  const [reportDay, setReportDay] = useState<string>('')
  const [reportBatch, setReportBatch] = useState<string>('')
  const [reportFood, setReportFood] = useState<'' | FoodType>('')
  const [reportRows, setReportRows] = useState<ScanRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchReports = async () => {
    setLoading(true)
    setError('')
    try {
      const q = new URLSearchParams()
      if (reportDay) q.set('day', reportDay)
      if (reportBatch) q.set('studentBatch', reportBatch)
      if (reportFood) q.set('foodType', reportFood)
      q.set('limit', '500')
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/scans?${q.toString()}`)
      const j = await res.json()
      
      if (j.ok) {
        setReportRows(j.rows || [])
      } else {
        setError('Failed to fetch data')
      }
    } catch (e) {
      console.error('fetch reports failed', e)
      setError('Network error or API unavailable')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!reportRows.length) return
    
    const headers = ['Roll', 'Name', 'Mode', 'Hostel', 'Timestamp', 'Status', 'Food Type', 'Scan Type']
    const rows = reportRows.map(r => [
      r.roll,
      '', // name not stored currently
      r.mode,
      r.hostel_id,
      new Date(r.timestamp).toLocaleString(),
      r.status,
      r.metadata?.foodType || '',
      r.metadata?.scanType || ''
    ])
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scan-report-${reportDay || 'all'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return '#28a745'
      case 'duplicate': return '#ffc107'
      case 'already-used': return '#dc3545'
      case 'invalid': return '#dc3545'
      case 'expired': return '#ffc107'
      case 'not-authorized': return '#0d6efd'
      default: return '#6c757d'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return '✅'
      case 'duplicate': return '🟡'
      case 'already-used': return '🔴'
      case 'invalid': return '❌'
      case 'expired': return '⚠️'
      case 'not-authorized': return '🚫'
      default: return '❓'
    }
  }

  // Group by food type for summary
  const summary = reportRows.reduce((acc, r) => {
    const ft = r.metadata?.foodType || 'Unknown'
    if (!acc[ft]) acc[ft] = { total: 0, valid: 0 }
    acc[ft].total++
    if (r.status === 'valid') acc[ft].valid++
    return acc
  }, {} as Record<string, { total: number, valid: number }>)

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: '#f5f5f5',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
          📊 Scan Reports
        </h1>
        <button 
          onClick={onClose}
          style={{ 
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            width: 36,
            height: 36,
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>
      </div>

      {/* Filters */}
      <div style={{ 
        background: 'white',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: 16
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#333' }}>🔍 Filters</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: '#666', marginBottom: 4, display: 'block' }}>
              📅 Day
            </label>
            <input 
              type="date"
              value={reportDay}
              onChange={(e) => setReportDay(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                fontSize: 14, 
                borderRadius: 6, 
                border: '1px solid #ddd',
                outline: 'none'
              }}
            />
          </div>
          
          <div>
            <label style={{ fontSize: 13, color: '#666', marginBottom: 4, display: 'block' }}>
              🎓 Student Batch
            </label>
            <input 
              type="text"
              placeholder="e.g., 2023 or 2023,2024"
              value={reportBatch}
              onChange={(e) => setReportBatch(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                fontSize: 14, 
                borderRadius: 6, 
                border: '1px solid #ddd',
                outline: 'none'
              }}
            />
          </div>
          
          <div>
            <label style={{ fontSize: 13, color: '#666', marginBottom: 4, display: 'block' }}>
              🍽️ Food Type
            </label>
            <select 
              value={reportFood}
              onChange={(e) => setReportFood(e.target.value as any)}
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                fontSize: 14, 
                borderRadius: 6, 
                border: '1px solid #ddd',
                outline: 'none',
                background: 'white'
              }}
            >
              <option value="">Any</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Snacks">Snacks</option>
              <option value="Dinner">Dinner</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button 
            onClick={fetchReports}
            disabled={loading}
            style={{ 
              padding: '12px 24px',
              background: loading ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {loading ? 'Loading...' : '🔍 Fetch Data'}
          </button>
          
          {reportRows.length > 0 && (
            <button 
              onClick={exportCSV}
              style={{ 
                padding: '12px 24px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              📥 Export CSV
            </button>
          )}
          
          <button 
            onClick={() => {
              setReportDay('')
              setReportBatch('')
              setReportFood('')
              setReportRows([])
              setError('')
            }}
            style={{ 
              padding: '12px 24px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            🔄 Clear
          </button>
        </div>

        {error && (
          <div style={{ 
            marginTop: 12, 
            padding: 12, 
            background: '#f8d7da', 
            color: '#721c24', 
            borderRadius: 6,
            fontSize: 14
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {reportRows.length > 0 && (
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <div style={{ 
              background: 'white', 
              padding: 16, 
              borderRadius: 8, 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#667eea' }}>
                {reportRows.length}
              </div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Total Scans</div>
            </div>

            {Object.entries(summary).map(([food, stats]) => (
              <div key={food} style={{ 
                background: 'white', 
                padding: 16, 
                borderRadius: 8, 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#28a745' }}>
                  {stats.valid} / {stats.total}
                </div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{food}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div style={{ flex: 1, padding: '0 20px 20px', overflowY: 'auto' }}>
        {reportRows.length === 0 && !loading && !error && (
          <div style={{ 
            background: 'white',
            padding: 60,
            borderRadius: 12,
            textAlign: 'center',
            color: '#999'
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>No data to display</div>
            <div style={{ fontSize: 14 }}>Select filters and click "Fetch Data" to view scan records</div>
          </div>
        )}

        {reportRows.length > 0 && (
          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {/* Table Header */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '100px 1fr 120px 100px 140px 100px',
              background: '#f8f9fa',
              padding: '12px 16px',
              fontWeight: 600,
              fontSize: 13,
              color: '#495057',
              borderBottom: '2px solid #dee2e6',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div>Roll</div>
              <div>Mode / Hostel</div>
              <div>Food Type</div>
              <div>Status</div>
              <div>Time</div>
              <div>Scan Type</div>
            </div>

            {/* Table Rows */}
            {reportRows.map((row, idx) => {
              const date = new Date(row.timestamp)
              return (
                <div 
                  key={idx}
                  style={{ 
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 120px 100px 140px 100px',
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: 14,
                    alignItems: 'center',
                    background: idx % 2 === 0 ? 'white' : '#f8f9fa'
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#495057' }}>
                    {row.roll}
                  </div>
                  
                  <div style={{ color: '#6c757d', fontSize: 13 }}>
                    <div>{row.mode}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{row.hostel_id}</div>
                  </div>
                  
                  <div style={{ 
                    fontSize: 13,
                    padding: '4px 8px',
                    background: '#e7f3ff',
                    color: '#0d6efd',
                    borderRadius: 4,
                    display: 'inline-block',
                    fontWeight: 600
                  }}>
                    {row.metadata?.foodType || '-'}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    color: getStatusColor(row.status),
                    fontWeight: 600,
                    fontSize: 13
                  }}>
                    <span style={{ fontSize: 16 }}>{getStatusIcon(row.status)}</span>
                    <span style={{ textTransform: 'uppercase' }}>{row.status}</span>
                  </div>
                  
                  <div style={{ fontSize: 12, color: '#6c757d' }}>
                    <div>{date.toLocaleDateString()}</div>
                    <div>{date.toLocaleTimeString()}</div>
                  </div>
                  
                  <div style={{ 
                    fontSize: 12,
                    color: '#6c757d',
                    textTransform: 'uppercase'
                  }}>
                    {row.metadata?.scanType === 'qr' ? '📱 QR' : row.metadata?.scanType === 'barcode' ? '📊 Bar' : '-'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

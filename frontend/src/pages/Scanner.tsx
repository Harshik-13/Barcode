import { useAuth } from '../store/AuthContext';
import CameraScanner from '../components/scanner/CameraScanner';
import { useScanner } from '../hooks/useScanner';

export default function Scanner() {
  const { user } = useAuth();
  const { lastResult, queueSize, isProcessing, handleScan, retryQueued, dismissResult } = useScanner();

  return (
    <div className="scanner-page">
      <div className="scanner-header">
        <h1>Attendance Scanner</h1>
        {user && <p className="faculty-info">Scanned by: {user.name} ({user.role})</p>}
      </div>

      <div className="scanner-body">
        <CameraScanner onScan={handleScan} onError={(msg) => console.error(msg)} enabled={!isProcessing} />

        {!navigator.onLine && (
          <div className="offline-banner">
            <span>You are offline. Scans will be queued.</span>
            {queueSize > 0 && <span> ({queueSize} pending)</span>}
          </div>
        )}

        {queueSize > 0 && navigator.onLine && (
          <div className="offline-banner retry">
            <span>{queueSize} scan(s) waiting to sync</span>
            <button onClick={retryQueued} disabled={isProcessing} className="retry-btn">
              {isProcessing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        )}

        {lastResult && (
          <div className={`scan-result ${lastResult.success ? 'success' : 'error'}`}>
            {lastResult.success ? (
              <>
                <div className="result-icon">{lastResult.data.code === 'SUCCESS_ENTRY' ? '✅' : '🚪'}</div>
                <p className="result-code">{lastResult.data.code === 'SUCCESS_ENTRY' ? 'Entry Recorded' : 'Exit Recorded'}</p>
                <p className="result-student">{lastResult.data.studentName} ({lastResult.data.studentRoll})</p>
                <p className="result-time">Entry: {new Date(lastResult.data.entryTime).toLocaleTimeString()}</p>
                {lastResult.data.exitTime && <p className="result-time">Exit: {new Date(lastResult.data.exitTime).toLocaleTimeString()}</p>}
              </>
            ) : (
              <>
                <div className="result-icon">❌</div>
                <p className="result-code">{lastResult.data.error}</p>
                <p className="result-message">{lastResult.data.message}</p>
              </>
            )}
            <button onClick={dismissResult} className="dismiss-btn">Dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}

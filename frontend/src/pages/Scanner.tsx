import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../store/AuthContext';
import CameraScanner from '../components/scanner/CameraScanner';
import { useScanner } from '../hooks/useScanner';

function playBeep(type: 'success' | 'error' | 'duplicate') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'error') {
      osc.frequency.value = 220;
      osc.type = 'square';
      gain.gain.value = 0.2;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.1);
      osc.type = 'sawtooth';
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {}
}

function vibrate(pattern: number | number[]) {
  try { navigator.vibrate(pattern); } catch {}
}

export default function Scanner() {
  const { user } = useAuth();
  const { lastResult, queueSize, isProcessing, handleScan, retryQueued, dismissResult, refreshQueueSize } = useScanner();
  const prevResultRef = useRef<string | null>(null);

  const handleScanWithFeedback = useCallback(async (barcode: string) => {
    await handleScan(barcode);
  }, [handleScan]);

  useEffect(() => {
    if (lastResult?.success) {
      playBeep('success');
      vibrate(100);
    } else if (lastResult && !lastResult.success) {
      const code = lastResult.data.error;
      if (code === 'DUPLICATE_SCAN') {
        playBeep('duplicate');
        vibrate([100, 50, 100]);
      } else {
        playBeep('error');
        vibrate(200);
      }
    }
  }, [lastResult]);

  return (
    <div className="scanner-page" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div className="scanner-header" style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', marginBottom: '4px' }}>Attendance Scanner</h1>
        {user && <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Scanned by: {user.name} ({user.role})</p>}
      </div>

      <div className="scanner-body">
        <CameraScanner onScan={handleScanWithFeedback} onError={(msg) => console.error(msg)} enabled={!isProcessing} />

        {!navigator.onLine && (
          <div style={{ padding: '12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', marginTop: '12px', fontSize: '13px', color: '#92400e' }}>
            <span>You are offline. Scans will be queued.</span>
            {queueSize > 0 && <strong> ({queueSize} pending)</strong>}
          </div>
        )}

        {queueSize > 0 && navigator.onLine && (
          <div style={{ padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', marginTop: '12px', fontSize: '13px', color: '#1e40af', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{queueSize} scan(s) waiting to sync</span>
            <button onClick={retryQueued} disabled={isProcessing} style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1 }}>
              {isProcessing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        )}

        {lastResult && (
          <div style={{
            marginTop: '16px',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid',
            borderColor: lastResult.success ? '#10b981' : '#ef4444',
            background: lastResult.success ? '#f0fdf4' : '#fef2f2',
            animation: 'fadeIn 0.3s ease',
            transition: 'all 0.3s ease',
          }}>
            {lastResult.success ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '4px' }}>{lastResult.data.code === 'SUCCESS_ENTRY' ? '✅' : '🚪'}</div>
                  <p style={{ fontSize: '18px', fontWeight: 600, color: '#065f46', margin: 0 }}>
                    {lastResult.data.code === 'SUCCESS_ENTRY' ? 'Entry Recorded' : 'Exit Recorded'}
                  </p>
                </div>
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <p style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 4px' }}>{lastResult.data.studentName}</p>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{lastResult.data.studentRoll}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '13px', color: '#374151' }}>
                  <div><strong>Entry:</strong> {new Date(lastResult.data.entryTime).toLocaleTimeString()}</div>
                  {lastResult.data.exitTime && <div><strong>Exit:</strong> {new Date(lastResult.data.exitTime).toLocaleTimeString()}</div>}
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '4px' }}>
                    {lastResult.data.error === 'DUPLICATE_SCAN' ? '⚠️' : '❌'}
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#991b1b', margin: 0 }}>
                    {lastResult.data.error === 'DUPLICATE_SCAN' ? 'Duplicate Scan' : lastResult.data.error === 'SUMMARY_REQUIRED' ? 'Summary Required' : 'Scan Failed'}
                  </p>
                </div>
                <p style={{ textAlign: 'center', fontSize: '14px', color: '#dc2626', margin: '0 0 12px' }}>
                  {lastResult.data.message}
                </p>
              </>
            )}
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button onClick={dismissResult} style={{
                padding: '8px 24px',
                background: lastResult.success ? '#10b981' : '#6b7280',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'transform 0.1s',
              }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

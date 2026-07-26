import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import CameraScanner from '../components/scanner/CameraScanner';
import { useScanner } from '../hooks/useScanner';
import { sessionsApi } from '../services/apiService';

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

  const [showForceExit, setShowForceExit] = useState(false);
  const [forceExitSessionId, setForceExitSessionId] = useState<number | null>(null);
  const [forceExitStudentName, setForceExitStudentName] = useState('');
  const [forceExitReason, setForceExitReason] = useState('');
  const [forceExitSubmitting, setForceExitSubmitting] = useState(false);

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

  const handleForceExitOpen = useCallback(() => {
    if (!lastResult || lastResult.success) return;
    const { details, message } = lastResult.data;
    const sessionId = (details?.sessionId as number) || 0;
    const studentName = message.includes('already been scanned') ? '' : '';
    if (!sessionId) return;
    setForceExitSessionId(sessionId);
    setForceExitStudentName(studentName);
    setForceExitReason('');
    setShowForceExit(true);
  }, [lastResult]);

  const handleForceExitSubmit = useCallback(async () => {
    if (!forceExitSessionId || !forceExitReason.trim()) return;
    setForceExitSubmitting(true);
    try {
      await sessionsApi.manualExit(forceExitSessionId, forceExitReason.trim());
      setShowForceExit(false);
      dismissResult();
    } catch (err: unknown) {
      alert((err as { message?: string })?.message || 'Failed to terminate session');
    } finally {
      setForceExitSubmitting(false);
    }
  }, [forceExitSessionId, forceExitReason, dismissResult]);

  return (
    <div className="scanner-page" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div className="scanner-header" style={{ marginBottom: '12px' }}>
        <h1 style={{ fontSize: '20px', marginBottom: '4px' }}>Attendance Scanner</h1>
        {user && <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Scanned by: {user.name} ({user.role})</p>}
      </div>

      <div className="scanner-body">
        <CameraScanner onScan={handleScanWithFeedback} onError={(msg) => console.error(msg)} enabled={!isProcessing && !showForceExit} />

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
            marginTop: '12px',
            padding: '16px',
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
                {(lastResult.data.error === 'SUMMARY_REQUIRED' || lastResult.data.error === 'DUPLICATE_SCAN') && lastResult.data.details?.sessionId && (
                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <button onClick={handleForceExitOpen} style={{
                      padding: '8px 20px',
                      background: '#dc2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}>
                      Force Exit Session
                    </button>
                  </div>
                )}
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

      {/* Force Exit Dialog */}
      {showForceExit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ fontSize: '18px', margin: '0 0 4px' }}>Force Exit Session</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px' }}>
              This will manually exit the student's current session requiring a summary later.
            </p>
            <textarea
              placeholder="Reason for force exit..."
              value={forceExitReason}
              onChange={(e) => setForceExitReason(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForceExit(false)} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
              <button onClick={handleForceExitSubmit} disabled={forceExitSubmitting || !forceExitReason.trim()}
                style={{ padding: '8px 16px', background: forceExitSubmitting || !forceExitReason.trim() ? '#9ca3af' : '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: forceExitSubmitting || !forceExitReason.trim() ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
                {forceExitSubmitting ? 'Processing...' : 'Force Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

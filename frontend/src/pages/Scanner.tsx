import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import CameraScanner from '../components/scanner/CameraScanner';
import { useScanner } from '../hooks/useScanner';
import { sessionsApi } from '../services/apiService';
import type { SessionWithDetails } from '../services/apiService';

function playBeep(type: 'success' | 'error' | 'duplicate' | 'queued') {
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
    } else if (type === 'queued') {
      osc.frequency.value = 660;
      osc.type = 'sine';
      gain.gain.value = 0.2;
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
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
  const { lastResult, queueSize, isProcessing, handleScan, retryQueued, dismissResult } = useScanner();

  const [showForceExit, setShowForceExit] = useState(false);
  const [forceExitSessionId, setForceExitSessionId] = useState<number | null>(null);
  const [forceExitInfo, setForceExitInfo] = useState<SessionWithDetails | null>(null);
  const [forceExitLoading, setForceExitLoading] = useState(false);
  const [forceExitReason, setForceExitReason] = useState('');
  const [forceExitSubmitting, setForceExitSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleScanWithFeedback = useCallback(async (barcode: string) => {
    await handleScan(barcode);
  }, [handleScan]);

  useEffect(() => {
    if (lastResult?.success) {
      playBeep('success');
      vibrate(100);
    } else if (lastResult && !lastResult.success) {
      const code = lastResult.data.error;
      if (code === 'QUEUED_FOR_SYNC') {
        playBeep('queued');
        vibrate(50);
      } else if (code === 'DUPLICATE_SCAN') {
        playBeep('duplicate');
        vibrate([100, 50, 100]);
      } else {
        playBeep('error');
        vibrate(200);
      }
    }
  }, [lastResult]);

  useEffect(() => {
    if (!showForceExit) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowForceExit(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showForceExit]);

  const handleForceExitOpen = useCallback(async () => {
    if (!lastResult || lastResult.success) return;
    const sessionId = lastResult.data.details?.sessionId as number | undefined;
    if (!sessionId) return;
    setForceExitSessionId(sessionId);
    setForceExitInfo(null);
    setForceExitLoading(true);
    setForceExitReason('');
    setShowForceExit(true);
    try {
      const res = await sessionsApi.get(sessionId);
      setForceExitInfo(res.data);
    } catch {
      setForceExitInfo(null);
    } finally {
      setForceExitLoading(false);
    }
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

  const isQueued = lastResult?.success === false && lastResult.data.error === 'QUEUED_FOR_SYNC';
  const isError = lastResult?.success === false && !isQueued;
  const isDuplicate = lastResult?.success === false && lastResult.data.error === 'DUPLICATE_SCAN';

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      {/* Scanner Viewport */}
      <div className="hive-scanner-viewport" style={{ border: '2px dashed #D9D0F7', cursor: 'pointer', transition: 'transform .15s ease, border-color .15s ease' }}>
        <div className="hive-scan-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8" />
            <path d="M20 8V5.5A1.5 1.5 0 0 0 18.5 4H16" />
            <path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20H8" />
            <path d="M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16" />
          </svg>
        </div>
        <h3>Tap to Scan</h3>
        <p>Scan student ID to mark<br />Entry or Exit</p>
      </div>

      <div className="scanner-body">
        <CameraScanner onScan={handleScanWithFeedback} enabled={!isProcessing && !showForceExit} />

        {!navigator.onLine && (
          <div style={{ padding: 12, background: 'var(--amber-tint)', border: '1px solid var(--amber)', borderRadius: 'var(--radius-sm)', marginTop: 12, fontSize: 13, color: 'var(--amber)' }}>
            <span>You are offline. Scans will be queued.</span>
            {queueSize > 0 && <strong> ({queueSize} pending)</strong>}
          </div>
        )}

        {queueSize > 0 && navigator.onLine && (
          <div style={{ padding: 12, background: 'var(--primary-tint)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', marginTop: 12, fontSize: 13, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{queueSize} scan(s) waiting to sync</span>
            <button onClick={retryQueued} disabled={isProcessing} style={{ padding: '6px 14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1, fontWeight: 600 }}>
              {isProcessing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        )}

        {/* Scanning Result */}
        <div className="hive-section-title" style={{ marginTop: 0 }}>Scanning Result</div>
        <div className="hive-card" style={{ padding: 20 }}>
          {lastResult ? (
            <div role="status" aria-live="polite" style={{ animation: 'fadeIn 0.3s ease' }}>
              {lastResult.success ? (
                <>
                  <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: 'var(--green)', textAlign: 'center' }}>
                    {lastResult.data.code === 'SUCCESS_ENTRY' ? 'Entry Recorded' : 'Exit Recorded'}
                  </h4>
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <p style={{ fontSize: 16, fontWeight: 500, margin: '0 0 4px' }}>{lastResult.data.studentName}</p>
                    <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>{lastResult.data.studentRoll}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 24, fontSize: 13, color: 'var(--ink)' }}>
                    <div><strong>Entry:</strong> {new Date(lastResult.data.entryTime).toLocaleTimeString()}</div>
                    {lastResult.data.exitTime && <div><strong>Exit:</strong> {new Date(lastResult.data.exitTime).toLocaleTimeString()}</div>}
                  </div>
                </>
              ) : isQueued ? (
                <>
                  <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: 'var(--amber)', textAlign: 'center' }}>Queued</h4>
                  <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--amber)', margin: '0 0 8px' }}>
                    {lastResult.data.message}. {queueSize > 0 ? `(${queueSize} pending)` : ''}
                  </p>
                </>
              ) : (
                <>
                  <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: 'var(--red)', textAlign: 'center' }}>
                    {isDuplicate ? 'Duplicate Scan' : lastResult.data.error === 'SUMMARY_REQUIRED' ? 'Summary Required' : 'Scan Failed'}
                  </h4>
                  <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--red)', margin: '0 0 12px' }}>
                    {lastResult.data.message}
                  </p>
                  {(lastResult.data.error === 'SUMMARY_REQUIRED' || isDuplicate) && lastResult.data.details?.sessionId && (
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                      <button onClick={handleForceExitOpen} style={{
                        padding: '8px 20px',
                        background: 'var(--red)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}>
                        Force Exit Session
                      </button>
                    </div>
                  )}
                </>
              )}
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button onClick={dismissResult} className="hive-primary-btn" style={{ width: 'auto', padding: '8px 24px', marginTop: 0 }}>
                  Dismiss
                </button>
              </div>
            </div>
          ) : (
            <>
              <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700 }}>Message Box</h4>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.4 }}>Student details and scan status<br />will appear here</p>
            </>
          )}
        </div>
      </div>

      {/* Force Exit Dialog */}
      {showForceExit && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="force-exit-title"
          tabIndex={-1}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
          onKeyDown={(e) => {
            if (e.key !== 'Tab' || !dialogRef.current) return;
            const focusables = dialogRef.current.querySelectorAll<HTMLElement>('button, textarea, [href], input, select');
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }}
        >
          <div className="hive-card" style={{ padding: 20, width: '100%', maxWidth: 400 }}>
            <h3 id="force-exit-title" style={{ fontSize: 18, margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>Force Exit Session</h3>
            {forceExitLoading ? (
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '12px 0' }}>Loading session details...</p>
            ) : (
              <>
                <p style={{ fontSize: 14, margin: '0 0 8px' }}>
                  {forceExitInfo
                    ? <strong>Force exit for {forceExitInfo.studentName || `Student #${forceExitInfo.studentId}`} ({forceExitInfo.studentRoll || '-'})</strong>
                    : <strong>Force exit for this student&apos;s session</strong>}
                </p>
                {forceExitInfo?.entryTime && (
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 12px' }}>
                    Entered at {new Date(forceExitInfo.entryTime).toLocaleTimeString()}
                  </p>
                )}
                <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 16px' }}>
                  This ends the student&apos;s current session. They will be asked to submit a work summary.
                </p>
              </>
            )}
            <textarea
              autoFocus
              aria-label="Reason for force exit"
              placeholder="Reason for force exit..."
              value={forceExitReason}
              onChange={(e) => setForceExitReason(e.target.value)}
              rows={3}
              className="hive-textarea"
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForceExit(false)} className="hive-ghost-btn" style={{ width: 'auto', padding: '8px 16px', marginTop: 0 }}>
                Cancel
              </button>
              <button onClick={handleForceExitSubmit} disabled={forceExitSubmitting || !forceExitReason.trim() || forceExitLoading}
                style={{ padding: '8px 16px', background: forceExitSubmitting || !forceExitReason.trim() || forceExitLoading ? 'var(--ink-faint)' : 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: forceExitSubmitting || !forceExitReason.trim() || forceExitLoading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
                {forceExitSubmitting ? 'Processing...' : 'Force Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from 'react';

interface CameraScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  enabled: boolean;
}

export default function CameraScanner({ onScan, onError, enabled }: CameraScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'scanning' | 'permission-denied' | 'no-camera' | 'unsupported' | 'paused'>('loading');
  const scannerInstanceRef = useRef<{ stop: () => Promise<void>; pause: () => void; resume: () => void } | null>(null);
  const lastScanRef = useRef<string>('');
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;

  const stop = useCallback(async () => {
    if (scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.stop();
      } catch { /* ignore */ }
      scannerInstanceRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (!enabled || !scannerInstanceRef.current) return;
      if (document.hidden) {
        scannerInstanceRef.current.pause();
      } else {
        try { scannerInstanceRef.current.resume(); } catch { /* may already be running */ }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      stop();
      setStatus('paused');
      return;
    }

    let cancelled = false;

    const startScanner = async () => {
      if (!scannerRef.current || !mountedRef.current) return;

      setStatus('loading');

      const { Html5Qrcode } = await import('html5-qrcode');

      if (!mountedRef.current || cancelled || !enabled) return;

      const scannerId = scannerRef.current.id || 'qr-reader';
      if (!scannerRef.current.id) scannerRef.current.id = scannerId;

      const scanner = new Html5Qrcode(scannerId);

      const qrCodeSuccessCallback = (decodedText: string) => {
        if (decodedText === lastScanRef.current) return;
        lastScanRef.current = decodedText;
        onScanRef.current(decodedText);

        scanner.pause();
        setStatus('paused');

        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => {
          lastScanRef.current = '';
          scanner.resume();
          if (mountedRef.current) setStatus('scanning');
        }, 2000);
      };

      const config = {
        fps: 30,
        qrbox: { width: 400, height: 200 },
        formatsToSupport: [
          0,  // QR_CODE
          1,  // CODE_128
          2,  // CODE_39
          3,  // EAN_13
          4,  // EAN_8
          5,  // UPC_A
          6,  // UPC_E
        ],
      };

      try {
        await scanner.start({ facingMode: 'environment' }, config, qrCodeSuccessCallback, () => { });
        if (!mountedRef.current || cancelled) {
          await scanner.stop().catch(() => {});
          return;
        }
        scannerInstanceRef.current = scanner;
        setStatus('scanning');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.toString() : String(err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          if (mountedRef.current) setStatus('permission-denied');
          onErrorRef.current?.('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (msg.includes('NotFoundError')) {
          if (mountedRef.current) setStatus('no-camera');
          onErrorRef.current?.('No camera found on this device.');
        } else {
          if (mountedRef.current) setStatus('unsupported');
          onErrorRef.current?.('Camera is not supported on this browser or device.');
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      stop();
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, [enabled, stop]);

  const resume = useCallback(() => {
    if (scannerInstanceRef.current) {
      scannerInstanceRef.current.resume();
      setStatus('scanning');
    }
  }, []);

  return (
    <div className="camera-scanner">
      <div ref={scannerRef} style={{ width: '100%', minHeight: '300px' }} />
      {status === 'loading' && <p className="scanner-status">Initializing camera...</p>}
      {status === 'permission-denied' && <p className="scanner-status error">Camera permission denied. Please update your browser settings.</p>}
      {status === 'no-camera' && <p className="scanner-status error">No camera detected on this device.</p>}
      {status === 'unsupported' && <p className="scanner-status error">Camera scanner is not supported on this browser.</p>}
      {status === 'paused' && (
        <div className="scanner-paused">
          <p>Scan paused</p>
          <button onClick={resume} className="resume-btn">Resume Scanning</button>
        </div>
      )}
    </div>
  );
}

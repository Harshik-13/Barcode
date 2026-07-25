import { useEffect, useRef, useCallback, useState } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';

interface CameraScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  enabled: boolean;
}

export default function CameraScanner({ onScan, onError, enabled }: CameraScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'scanning' | 'permission-denied' | 'no-camera' | 'unsupported' | 'paused'>('loading');
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const lastScanRef = useRef<string>('');
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (html5QrCode) {
      try {
        html5QrCode.stop();
      } catch { }
    }
  }, [html5QrCode]);

  const start = useCallback(async () => {
    if (!enabled) return;

    const { Html5Qrcode } = await import('html5-qrcode');

    if (!scannerRef.current) return;

    const scannerId = scannerRef.current.id || 'qr-reader';
    if (!scannerRef.current.id) scannerRef.current.id = scannerId;

    const scanner = new Html5Qrcode(scannerId);

    const qrCodeSuccessCallback = (decodedText: string) => {
      if (decodedText === lastScanRef.current) return;
      lastScanRef.current = decodedText;
      onScan(decodedText);

      scanner.pause();
      setStatus('paused');

      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = setTimeout(() => {
        lastScanRef.current = '';
        scanner.resume();
        setStatus('scanning');
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
      setHtml5QrCode(scanner);
      setStatus('scanning');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.toString() : String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setStatus('permission-denied');
        onError?.('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (msg.includes('NotFoundError')) {
        setStatus('no-camera');
        onError?.('No camera found on this device.');
      } else {
        setStatus('unsupported');
        onError?.('Camera is not supported on this browser or device.');
      }
    }
  }, [enabled, onScan, onError]);

  const resume = useCallback(() => {
    if (html5QrCode) {
      html5QrCode.resume();
      setStatus('scanning');
    }
  }, [html5QrCode]);

  useEffect(() => {
    start();
    return () => {
      stop();
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, [enabled]);

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

import { useState, useCallback, useRef, useEffect } from 'react';
import { submitScan, enqueueScan, processQueue, getQueueSize, type ScanResult, type ScanSuccessData, type ScanRejectData } from '../services';

export interface ScannerState {
  lastResult: ScanResult | null;
  queueSize: number;
  isProcessing: boolean;
}

export function useScanner() {
  const [state, setState] = useState<ScannerState>({ lastResult: null, queueSize: 0, isProcessing: false });
  const processingRef = useRef(false);

  const handleScan = useCallback(async (barcode: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setState(s => ({ ...s, isProcessing: true }));

    if (!navigator.onLine) {
      await enqueueScan(barcode);
      const size = await getQueueSize();
      setState({ lastResult: { success: false, data: { error: 'QUEUED_FOR_SYNC', message: 'Scan queued — will sync automatically when you are back online' } }, queueSize: size, isProcessing: false });
      processingRef.current = false;
      return;
    }

    const result = await submitScan(barcode);
    setState(s => ({ ...s, lastResult: result, isProcessing: false }));
    processingRef.current = false;
  }, []);

  const retryQueued = useCallback(async () => {
    setState(s => ({ ...s, isProcessing: true }));
    await processQueue((result) => {
      setState(s => ({ ...s, lastResult: result }));
    });
    const size = await getQueueSize();
    setState(s => ({ ...s, queueSize: size, isProcessing: false }));
  }, []);

  const dismissResult = useCallback(() => {
    setState(s => ({ ...s, lastResult: null }));
  }, []);

  const refreshQueueSize = useCallback(async () => {
    const size = await getQueueSize();
    setState(s => ({ ...s, queueSize: size }));
  }, []);

  useEffect(() => {
    const handleOnline = () => { refreshQueueSize(); };
    const handleOffline = () => { refreshQueueSize(); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    refreshQueueSize();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { ...state, handleScan, retryQueued, dismissResult, refreshQueueSize };
}

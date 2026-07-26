import { api } from './api';

export type ScanResultCode =
  | 'SUCCESS_ENTRY'
  | 'SUCCESS_EXIT'
  | 'SUMMARY_REQUIRED'
  | 'INVALID_BARCODE'
  | 'STUDENT_NOT_FOUND'
  | 'ACCOUNT_INACTIVE'
  | 'DUPLICATE_SCAN'
  | 'INVALID_SESSION_STATE'
  | 'UNAUTHORIZED'
  | 'SERVER_ERROR';

export interface ScanSuccessData {
  code: 'SUCCESS_ENTRY' | 'SUCCESS_EXIT';
  message: string;
  sessionId: number;
  studentId: number;
  studentName: string;
  studentRoll: string;
  entryTime: string;
  exitTime: string | null;
  sessionStatus: string;
}

export interface ScanRejectData {
  error: Exclude<ScanResultCode, 'SUCCESS_ENTRY' | 'SUCCESS_EXIT'>;
  message: string;
  details?: Record<string, unknown>;
}

export type ScanResult = { success: true; data: ScanSuccessData } | { success: false; data: ScanRejectData };

export async function submitScan(barcode: string): Promise<ScanResult> {
  try {
    const response = await api<{ data: ScanSuccessData }>('/api/scan', {
      method: 'POST',
      body: { barcode },
    });
    return { success: true, data: response.data };
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'error' in err) {
      const apiErr = err as { error: string; message: string; details?: Record<string, unknown> };
      return {
        success: false,
        data: {
          error: (apiErr.error as ScanResultCode) || 'SERVER_ERROR',
          message: apiErr.message || 'Request failed',
          details: apiErr.details,
        },
      };
    }
    return { success: false, data: { error: 'SERVER_ERROR', message: 'Network error — request failed' } };
  }
}

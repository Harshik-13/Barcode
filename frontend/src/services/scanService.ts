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
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ barcode }),
    });

    if (res.status === 200) {
      const body = await res.json();
      return { success: true, data: body.data };
    }

    if (res.status >= 400 && res.status < 500) {
      const body = await res.json().catch(() => ({}));
      return {
        success: false,
        data: {
          error: body.error || 'SERVER_ERROR',
          message: body.message || 'Request failed',
          details: body.details,
        },
      };
    }

    if (res.status === 401 || res.status === 403) {
      return { success: false, data: { error: 'UNAUTHORIZED', message: 'Authentication required or insufficient permissions' } };
    }

    return { success: false, data: { error: 'SERVER_ERROR', message: 'Unexpected server error' } };
  } catch {
    return { success: false, data: { error: 'SERVER_ERROR', message: 'Network error — request failed' } };
  }
}

function getToken(): string {
  try {
    return localStorage.getItem('workspace_token') || '';
  } catch {
    return '';
  }
}

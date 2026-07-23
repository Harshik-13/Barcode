import { getDb } from '../db';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { logAudit } from './audit';
import { lookupStudent } from './student';
import { getActiveSessionForStudent } from './session';
import type { ScanResultCode } from '../../../shared';

interface ScanSuccessResponse {
  code: Extract<ScanResultCode, 'SUCCESS_ENTRY' | 'SUCCESS_EXIT'>;
  message: string;
  sessionId: number;
  studentId: number;
  studentName: string;
  studentRoll: string;
  entryTime: string;
  exitTime: string | null;
  sessionStatus: string;
}

interface ScanRejectResponse {
  code: Exclude<ScanResultCode, 'SUCCESS_ENTRY' | 'SUCCESS_EXIT'>;
  message: string;
  details?: Record<string, unknown>;
}

export type ScanResponse = ScanSuccessResponse | ScanRejectResponse;

function isValidBarcode(barcode: unknown): barcode is string {
  if (typeof barcode !== 'string') return false;
  if (barcode.length < 1 || barcode.length > 100) return false;
  return true;
}

function parseBarcode(barcode: string): { type: 'roll' | 'id'; value: string } {
  const cleaned = barcode.trim();
  const digits = cleaned.replace(/^0+/, '');
  if (/^\d+$/.test(digits) && digits.length > 0) {
    return { type: 'id', value: digits };
  }
  return { type: 'roll', value: cleaned };
}

export function processScan(barcode: unknown, recorderId: number, actorRole: string, ip?: string): ScanResponse {
  if (!isValidBarcode(barcode)) {
    logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: recorderId, action: 'SCAN_REJECTED', entityType: 'SCAN', entityId: null, details: { reason: 'invalid_barcode', barcode: String(barcode) }, ipAddress: ip });
    return { code: 'INVALID_BARCODE', message: 'The scanned barcode is not valid' };
  }

  let student: { id: number; name: string; roll: string; status: string };
  try {
    const parsed = parseBarcode(barcode);
    const found = lookupStudent(parsed.value);
    student = { id: found.id, name: found.name, roll: found.roll, status: found.status };
  } catch (err) {
    if (err instanceof NotFoundError) {
      logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: recorderId, action: 'SCAN_REJECTED', entityType: 'SCAN', entityId: null, details: { reason: 'student_not_found', barcode }, ipAddress: ip });
      return { code: 'STUDENT_NOT_FOUND', message: 'No student found for the scanned barcode' };
    }
    throw err;
  }

  if (student.status !== 'enrolled') {
    logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: recorderId, action: 'SCAN_REJECTED', entityType: 'STUDENT', entityId: student.id, details: { reason: 'account_inactive', status: student.status }, ipAddress: ip });
    return { code: 'ACCOUNT_INACTIVE', message: `Student account is ${student.status}` };
  }

  const existing = getActiveSessionForStudent(student.id);

  if (!existing) {
    const now = new Date().toISOString();
    const db = getDb();

    db.run('BEGIN TRANSACTION');
    try {
      const stmt = db.prepare("INSERT INTO workspace_sessions (student_id, entry_time, entry_recorder_id, status) VALUES (?, ?, ?, 'active')");
      stmt.run([student.id, now, recorderId]);
      stmt.free();

      const sessionId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;
      db.run('COMMIT');

      logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: recorderId, action: 'SCAN_ENTRY', entityType: 'SESSION', entityId: sessionId, details: { studentId: student.id, barcode }, ipAddress: ip });

      return {
        code: 'SUCCESS_ENTRY',
        message: 'Entry recorded successfully',
        sessionId,
        studentId: student.id,
        studentName: student.name,
        studentRoll: student.roll,
        entryTime: now,
        exitTime: null,
        sessionStatus: 'active',
      };
    } catch (err) {
      db.run('ROLLBACK');
      throw err;
    }
  }

  if (existing.status === 'awaiting_summary') {
    logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: recorderId, action: 'SCAN_REJECTED', entityType: 'SESSION', entityId: existing.id, details: { reason: 'summary_pending', studentId: student.id }, ipAddress: ip });
    return { code: 'SUMMARY_REQUIRED', message: 'Previous session requires summary before a new scan can be processed', details: { sessionId: existing.id } };
  }

  if (existing.status === 'completed' || existing.status === 'archived') {
    logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: recorderId, action: 'SCAN_REJECTED', entityType: 'SESSION', entityId: existing.id, details: { reason: 'duplicate_scan', studentId: student.id }, ipAddress: ip });
    return { code: 'DUPLICATE_SCAN', message: 'Student has already been scanned today', details: { sessionId: existing.id } };
  }

  if (existing.status === 'active' || existing.status === 'created') {
    const now = new Date().toISOString();
    const db = getDb();

    db.run('BEGIN TRANSACTION');
    try {
      const updateStmt = db.prepare("UPDATE workspace_sessions SET exit_time = ?, exit_recorder_id = ?, status = 'awaiting_summary' WHERE id = ?");
      updateStmt.run([now, recorderId, existing.id]);
      updateStmt.free();
      db.run('COMMIT');

      logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: recorderId, action: 'SCAN_EXIT', entityType: 'SESSION', entityId: existing.id, details: { studentId: student.id, barcode }, ipAddress: ip });

      return {
        code: 'SUCCESS_EXIT',
        message: 'Exit recorded successfully. Summary required.',
        sessionId: existing.id,
        studentId: student.id,
        studentName: student.name,
        studentRoll: student.roll,
        entryTime: existing.entryTime,
        exitTime: now,
        sessionStatus: 'awaiting_summary',
      };
    } catch (err) {
      db.run('ROLLBACK');
      throw err;
    }
  }

  logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: recorderId, action: 'SCAN_REJECTED', entityType: 'SESSION', entityId: existing.id, details: { reason: 'invalid_session_state', status: existing.status, studentId: student.id }, ipAddress: ip });
  return { code: 'INVALID_SESSION_STATE', message: `Session is in an unexpected state: ${existing.status}`, details: { sessionId: existing.id, currentStatus: existing.status } };
}

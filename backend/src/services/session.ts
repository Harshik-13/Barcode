import { getDb } from '../db';
import { NotFoundError, ConflictError } from '../utils/errors';
import { logAudit } from './audit';
import { getStudent } from './student';

interface SessionRow {
  id: number;
  student_id: number;
  entry_time: string;
  exit_time: string | null;
  entry_recorder_id: number;
  exit_recorder_id: number | null;
  category_id: number | null;
  status: string;
  completion_reason: string | null;
  summary: string | null;
  is_manual_exit: number;
  manual_exit_reason: string | null;
  override_reason: string | null;
  created_at: string;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  created: ['active', 'archived'],
  active: ['awaiting_summary', 'completed', 'archived'],
  awaiting_summary: ['completed', 'archived'],
  completed: ['archived'],
  archived: [],
};

function rowToSession(row: SessionRow) {
  return {
    id: row.id,
    studentId: row.student_id,
    entryTime: row.entry_time,
    exitTime: row.exit_time,
    entryRecorderId: row.entry_recorder_id,
    exitRecorderId: row.exit_recorder_id,
    categoryId: row.category_id,
    status: row.status,
    completionReason: row.completion_reason,
    summary: row.summary,
    isManualExit: !!row.is_manual_exit,
    manualExitReason: row.manual_exit_reason,
    overrideReason: row.override_reason,
    createdAt: row.created_at,
  };
}

function getSessionRow(db: ReturnType<typeof getDb>, id: number): SessionRow {
  const stmt = db.prepare('SELECT * FROM workspace_sessions WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) { stmt.free(); throw new NotFoundError('Session'); }
  const row = stmt.getAsObject() as unknown as SessionRow;
  stmt.free();
  return row;
}

function transition(sessionId: number, targetStatus: string, validFrom: string[], extra: Record<string, unknown> = {}, validate?: (db: ReturnType<typeof getDb>, session: SessionRow) => void) {
  const db = getDb();

  db.run('BEGIN TRANSACTION');
  let rolledBack = false;
  try {
    const session = getSessionRow(db, sessionId);

    if (!validFrom.includes(session.status)) {
      db.run('ROLLBACK');
      rolledBack = true;
      throw new ConflictError('INVALID_TRANSITION', `Cannot transition session from '${session.status}' to '${targetStatus}'`);
    }

    if (validate) validate(db, session);

    const setClauses: string[] = [`status = '${targetStatus}'`];
    const updateParams: Array<string | number | null> = [];

    for (const [key, value] of Object.entries(extra)) {
      if (value !== undefined) {
        if (key === 'exit_recorder_id') { setClauses.push('exit_recorder_id = ?'); updateParams.push(value as number); }
        else if (key === 'category_id') { setClauses.push('category_id = ?'); updateParams.push(value as number); }
        else if (key === 'exit_time') { setClauses.push('exit_time = ?'); updateParams.push(value as string); }
        else if (key === 'completion_reason') { setClauses.push('completion_reason = ?'); updateParams.push(value as string); }
        else if (key === 'summary') { setClauses.push('summary = ?'); updateParams.push(value as string); }
        else if (key === 'is_manual_exit') { setClauses.push('is_manual_exit = ?'); updateParams.push(value ? 1 : 0); }
        else if (key === 'manual_exit_reason') { setClauses.push('manual_exit_reason = ?'); updateParams.push(value as string); }
        else if (key === 'override_reason') { setClauses.push('override_reason = ?'); updateParams.push(value as string); }
      }
    }

    updateParams.push(sessionId);
    const updateSql = `UPDATE workspace_sessions SET ${setClauses.join(', ')} WHERE id = ?`;
    db.run(updateSql, updateParams);

    db.run('COMMIT');
    return getSessionById(sessionId);
  } catch (err) {
    if (!rolledBack) {
      try { db.run('ROLLBACK'); } catch { /* ignore */ }
    }
    throw err;
  }
}

export function getSessionById(id: number) {
  const db = getDb();
  const row = getSessionRow(db, id);
  return rowToSession(row);
}

export function listSessions(page = 1, limit = 20, filters?: { studentId?: number; status?: string; dateFrom?: string; dateTo?: string }) {
  const db = getDb();
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (filters?.studentId) { conditions.push('ws.student_id = ?'); params.push(filters.studentId); }
  if (filters?.status) { conditions.push('ws.status = ?'); params.push(filters.status); }
  if (filters?.dateFrom) { conditions.push('ws.entry_time >= ?'); params.push(filters.dateFrom); }
  if (filters?.dateTo) { conditions.push('ws.entry_time <= ?'); params.push(filters.dateTo); }

  const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM workspace_sessions ws${whereClause}`);
  if (params.length > 0) countStmt.bind(params);
  countStmt.step();
  const total = (countStmt.getAsObject() as unknown as { total: number }).total;
  countStmt.free();

  const sql = `SELECT ws.*, s.roll as student_roll, s.name as student_name FROM workspace_sessions ws JOIN students s ON ws.student_id = s.id${whereClause} ORDER BY ws.entry_time DESC LIMIT ? OFFSET ?`;
  const stmt = db.prepare(sql);
  stmt.bind([...params, limit, offset]);
  const rows: Array<Record<string, unknown>> = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as Record<string, unknown>);
  }
  stmt.free();

  return { sessions: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export function getActiveSessionForStudent(studentId: number) {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM workspace_sessions WHERE student_id = ? AND status IN ('created', 'active', 'awaiting_summary')");
  stmt.bind([studentId]);
  if (!stmt.step()) { stmt.free(); return null; }
  const row = stmt.getAsObject() as unknown as SessionRow;
  stmt.free();
  return rowToSession(row);
}

export function createSession(studentId: number, entryRecorderId: number, actorRole: string, ip?: string) {
  const db = getDb();
  getStudent(studentId);

  const existing = getActiveSessionForStudent(studentId);
  if (existing) {
    throw new ConflictError('ACTIVE_SESSION_EXISTS', 'Student already has an active session');
  }

  const now = new Date().toISOString();

  db.run('BEGIN TRANSACTION');
  try {
    const stmt = db.prepare("INSERT INTO workspace_sessions (student_id, entry_time, entry_recorder_id, status) VALUES (?, ?, ?, 'created')");
    stmt.run([studentId, now, entryRecorderId]);
    stmt.free();

    const id = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;
    db.run('COMMIT');

    logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: entryRecorderId, action: 'SESSION_CREATED', entityType: 'SESSION', entityId: id, details: { studentId, entryTime: now }, ipAddress: ip });

    return getSessionById(id);
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

export function startSession(id: number, recorderId: number, actorRole: string, ip?: string) {
  const session = transition(id, 'active', ['created'], { entry_recorder_id: recorderId });
  logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: recorderId, action: 'SESSION_STARTED', entityType: 'SESSION', entityId: id, details: {}, ipAddress: ip });
  return session;
}

export function exitSession(id: number, exitRecorderId: number, categoryId: number | undefined, actorRole: string, ip?: string) {
  const now = new Date().toISOString();

  const session = transition(id, 'awaiting_summary', ['active', 'created'], {
    exit_recorder_id: exitRecorderId,
    exit_time: now,
    category_id: categoryId,
  });

  logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: exitRecorderId, action: 'SESSION_EXITED', entityType: 'SESSION', entityId: id, details: { exitTime: now, categoryId }, ipAddress: ip });
  return session;
}

export function manualExitSession(id: number, exitRecorderId: number, categoryId: number | undefined, reason: string, actorRole: string, ip?: string) {
  const now = new Date().toISOString();

  const session = transition(id, 'awaiting_summary', ['active', 'created'], {
    exit_recorder_id: exitRecorderId,
    exit_time: now,
    category_id: categoryId,
    is_manual_exit: 1,
    manual_exit_reason: reason,
    completion_reason: 'manual_exit',
  });

  logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: exitRecorderId, action: 'SESSION_MANUAL_EXIT', entityType: 'SESSION', entityId: id, details: { reason, categoryId }, ipAddress: ip });
  return session;
}

export function completeSession(id: number, recorderId: number, summary: string, actorRole: string, ip?: string) {
  const session = transition(id, 'completed', ['awaiting_summary', 'active'], {
    summary,
    completion_reason: 'normal',
  });

  logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: recorderId, action: 'SESSION_COMPLETED', entityType: 'SESSION', entityId: id, details: { summary }, ipAddress: ip });
  return session;
}

export function archiveSession(id: number, recorderId: number, reason: string | undefined, actorRole: string, ip?: string) {
  const session = transition(id, 'archived', ['created', 'active', 'awaiting_summary', 'completed'], {
    override_reason: reason || null,
  });

  logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: recorderId, action: 'SESSION_ARCHIVED', entityType: 'SESSION', entityId: id, details: { reason }, ipAddress: ip });
  return session;
}

export function autoCompleteSessions() {
  const db = getDb();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const countStmt = db.prepare("SELECT COUNT(*) as total FROM workspace_sessions WHERE status IN ('active', 'awaiting_summary') AND entry_time < ?");
  countStmt.bind([cutoff]);
  countStmt.step();
  const total = (countStmt.getAsObject() as unknown as { total: number }).total;
  countStmt.free();

  if (total > 0) {
    const stmt = db.prepare("UPDATE workspace_sessions SET status = 'completed', completion_reason = 'auto_completed' WHERE status IN ('active', 'awaiting_summary') AND entry_time < ?");
    stmt.run([cutoff]);
    stmt.free();
  }

  return { autoCompleted: total };
}

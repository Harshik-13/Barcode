import { getDb } from '../db';
import { NotFoundError, ConflictError, BusinessRuleError } from '../utils/errors';
import { logAudit } from './audit';
import { getStudent } from './student';
import { createNotification, notifyFacultyNewCompletion } from './notification';

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

function computeDurationSeconds(entryTime: string, exitTime: string | null): number | null {
  if (!exitTime) return null;
  return Math.round((new Date(exitTime).getTime() - new Date(entryTime).getTime()) / 1000);
}

function rowToSession(row: SessionRow) {
  return {
    id: row.id,
    studentId: row.student_id,
    entryTime: row.entry_time,
    exitTime: row.exit_time,
    durationSeconds: computeDurationSeconds(row.entry_time, row.exit_time),
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

async function getSessionRow(db: ReturnType<typeof getDb>, id: number): Promise<SessionRow> {
  const result = await db.query('SELECT * FROM workspace_sessions WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new NotFoundError('Session');
  return result.rows[0] as SessionRow;
}

async function transition(sessionId: number, targetStatus: string, validFrom: string[], extra: Record<string, unknown> = {}, validate?: (db: ReturnType<typeof getDb>, session: SessionRow) => void) {
  const db = getDb();

  await db.query('BEGIN');
  let rolledBack = false;
  try {
    const lockResult = await db.query('SELECT * FROM workspace_sessions WHERE id = $1 FOR UPDATE', [sessionId]);
    if (lockResult.rows.length === 0) { await db.query('ROLLBACK'); rolledBack = true; throw new NotFoundError('Session'); }
    const session = lockResult.rows[0] as SessionRow;

    if (!validFrom.includes(session.status)) {
      await db.query('ROLLBACK');
      rolledBack = true;
      throw new ConflictError('INVALID_TRANSITION', `Cannot transition session from '${session.status}' to '${targetStatus}'`);
    }

    if (validate) validate(db, session);

    const setClauses: string[] = [`status = '${targetStatus}'`];
    const updateParams: Array<string | number | null> = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(extra)) {
      if (value !== undefined) {
        if (key === 'exit_recorder_id') { setClauses.push(`exit_recorder_id = $${paramIndex}`); updateParams.push(value as number); paramIndex++; }
        else if (key === 'category_id') { setClauses.push(`category_id = $${paramIndex}`); updateParams.push(value as number); paramIndex++; }
        else if (key === 'exit_time') { setClauses.push(`exit_time = $${paramIndex}`); updateParams.push(value as string); paramIndex++; }
        else if (key === 'completion_reason') { setClauses.push(`completion_reason = $${paramIndex}`); updateParams.push(value as string); paramIndex++; }
        else if (key === 'summary') { setClauses.push(`summary = $${paramIndex}`); updateParams.push(value as string); paramIndex++; }
        else if (key === 'is_manual_exit') { setClauses.push(`is_manual_exit = $${paramIndex}`); updateParams.push(value ? 1 : 0); paramIndex++; }
        else if (key === 'manual_exit_reason') { setClauses.push(`manual_exit_reason = $${paramIndex}`); updateParams.push(value as string); paramIndex++; }
        else if (key === 'override_reason') { setClauses.push(`override_reason = $${paramIndex}`); updateParams.push(value as string); paramIndex++; }
      }
    }

    updateParams.push(sessionId);
    const updateSql = `UPDATE workspace_sessions SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;
    const updateResult = await db.query(updateSql, updateParams);
    if ((updateResult as any).rowCount === 0) {
      await db.query('ROLLBACK');
      rolledBack = true;
      throw new ConflictError('RACE_CONDITION', 'Session was modified concurrently — please retry');
    }

    await db.query('COMMIT');
    return await getSessionById(sessionId);
  } catch (err) {
    if (!rolledBack) {
      try { await db.query('ROLLBACK'); } catch { /* ignore */ }
    }
    throw err;
  }
}

export async function getSessionById(id: number) {
  const db = getDb();
  const row = await getSessionRow(db, id);
  return rowToSession(row);
}

function rowToSessionDetails(row: Record<string, unknown>) {
  return {
    id: row.id,
    studentId: row.student_id,
    entryTime: row.entry_time,
    exitTime: row.exit_time,
    durationSeconds: computeDurationSeconds(row.entry_time as string, row.exit_time as string | null),
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
    studentRoll: row.student_roll,
    studentName: row.student_name,
    categoryName: row.category_name,
  };
}

export async function listSessions(page = 1, limit = 20, filters?: { studentId?: number; status?: string; dateFrom?: string; dateTo?: string }) {
  const db = getDb();
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (filters?.studentId) { conditions.push(`ws.student_id = $${params.length + 1}`); params.push(filters.studentId); }
  if (filters?.status) { conditions.push(`ws.status = $${params.length + 1}`); params.push(filters.status); }
  if (filters?.dateFrom) { conditions.push(`ws.entry_time >= $${params.length + 1}`); params.push(filters.dateFrom); }
  if (filters?.dateTo) { conditions.push(`ws.entry_time <= $${params.length + 1}`); params.push(filters.dateTo); }

  const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(`SELECT COUNT(*) as total FROM workspace_sessions ws${whereClause}`, params);
  const total = parseInt(countResult.rows[0].total, 10);

  const sql = `SELECT ws.*, s.roll as student_roll, s.name as student_name FROM workspace_sessions ws JOIN students s ON ws.student_id = s.id${whereClause} ORDER BY ws.entry_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const result = await db.query(sql, [...params, limit, offset]);
  const rows: Array<Record<string, unknown>> = result.rows as Array<Record<string, unknown>>;

  const sessions = rows.map(rowToSessionDetails);
  return { sessions, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getActiveSessionForStudent(studentId: number) {
  const db = getDb();
  const result = await db.query("SELECT * FROM workspace_sessions WHERE student_id = $1 AND status IN ('created', 'active', 'awaiting_summary')", [studentId]);
  if (result.rows.length === 0) return null;
  return rowToSession(result.rows[0] as SessionRow);
}

export async function createSession(studentId: number, entryRecorderId: number, actorRole: string, ip?: string) {
  const db = getDb();
  await getStudent(studentId);

  const existing = await getActiveSessionForStudent(studentId);
  if (existing) {
    throw new ConflictError('ACTIVE_SESSION_EXISTS', 'Student already has an active session');
  }

  const now = new Date().toISOString();

  await db.query('BEGIN');
  try {
    const insertResult = await db.query("INSERT INTO workspace_sessions (student_id, entry_time, entry_recorder_id, status) VALUES ($1, $2, $3, 'created') RETURNING id", [studentId, now, entryRecorderId]);
    const id = insertResult.rows[0].id as number;
    await db.query('COMMIT');

    logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: entryRecorderId, action: 'SESSION_CREATED', entityType: 'SESSION', entityId: id, details: { studentId, entryTime: now }, ipAddress: ip });

    return await getSessionById(id);
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}

export async function startSession(id: number, recorderId: number, actorRole: string, ip?: string) {
  const session = await transition(id, 'active', ['created'], { entry_recorder_id: recorderId });
  logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: recorderId, action: 'SESSION_STARTED', entityType: 'SESSION', entityId: id, details: {}, ipAddress: ip });
  const startedSession = await getSessionById(id);
  createNotification(startedSession.studentId, id, 'entry', 'Your work session has started');
  return session;
}

export async function exitSession(id: number, exitRecorderId: number, categoryId: number | undefined, actorRole: string, ip?: string) {
  const now = new Date().toISOString();

  const session = await transition(id, 'awaiting_summary', ['active', 'created'], {
    exit_recorder_id: exitRecorderId,
    exit_time: now,
    category_id: categoryId,
  });

  logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: exitRecorderId, action: 'SESSION_EXITED', entityType: 'SESSION', entityId: id, details: { exitTime: now, categoryId }, ipAddress: ip });
  const exitedSession = await getSessionById(id);
  createNotification(exitedSession.studentId, id, 'exit', 'Your work session has been exited — please submit your summary');
  return session;
}

export async function manualExitSession(id: number, exitRecorderId: number, categoryId: number | undefined, reason: string, actorRole: string, ip?: string) {
  const now = new Date().toISOString();

  const session = await transition(id, 'awaiting_summary', ['active', 'created'], {
    exit_recorder_id: exitRecorderId,
    exit_time: now,
    category_id: categoryId,
    is_manual_exit: 1,
    manual_exit_reason: reason,
    completion_reason: 'manual_exit',
  });

  logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: exitRecorderId, action: 'SESSION_MANUAL_EXIT', entityType: 'SESSION', entityId: id, details: { reason, categoryId }, ipAddress: ip });
  const exitedSession = await getSessionById(id);
  createNotification(exitedSession.studentId, id, 'exit', `Your session was exited manually: ${reason}`);
  return session;
}

export async function completeSession(id: number, recorderId: number, summary: string, actorRole: string, ip?: string) {
  const session = await transition(id, 'completed', ['awaiting_summary', 'active'], {
    summary,
    completion_reason: 'normal',
  });

  logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: recorderId, action: 'SESSION_COMPLETED', entityType: 'SESSION', entityId: id, details: { summary }, ipAddress: ip });

  const completedSession = await getSessionById(id);
  createNotification(completedSession.studentId, id, 'completed', 'Your work session has been completed');
  const student = await getStudent(completedSession.studentId);
  notifyFacultyNewCompletion(id, student.name, summary);

  return session;
}

export async function archiveSession(id: number, recorderId: number, reason: string | undefined, actorRole: string, ip?: string) {
  const session = await transition(id, 'archived', ['created', 'active', 'awaiting_summary', 'completed'], {
    override_reason: reason || null,
  });

  logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: recorderId, action: 'SESSION_ARCHIVED', entityType: 'SESSION', entityId: id, details: { reason }, ipAddress: ip });

  const archivedSession = await getSessionById(id);
  createNotification(archivedSession.studentId, id, 'reminder', reason ? `Your work session has been archived: ${reason}` : 'Your work session has been archived');

  return session;
}

export async function getLiveSessionCount(): Promise<number> {
  const db = getDb();
  const result = await db.query("SELECT COUNT(*) as count FROM workspace_sessions WHERE status IN ('created', 'active')");
  return parseInt(result.rows[0].count, 10);
}

export async function getLiveStudents(): Promise<Array<{ id: number; studentId: number; studentRoll: string; studentName: string; entryTime: string; status: string }>> {
  const db = getDb();
  const result = await db.query("SELECT ws.id, ws.student_id, s.roll as student_roll, s.name as student_name, ws.entry_time, ws.status FROM workspace_sessions ws JOIN students s ON ws.student_id = s.id WHERE ws.status IN ('created', 'active') ORDER BY ws.entry_time DESC");
  const rows = result.rows as Array<{ id: number; student_id: number; student_roll: string; student_name: string; entry_time: string; status: string }>;
  return rows.map(r => ({ id: r.id, studentId: r.student_id, studentRoll: r.student_roll, studentName: r.student_name, entryTime: r.entry_time, status: r.status }));
}

export async function overrideSession(id: number, actorId: number, role: string, ip: string | undefined, overrides: { status?: string; categoryId?: number; summary?: string; reason: string }) {
  const db = getDb();
  const before = await getSessionById(id);

  await db.query('BEGIN');
  try {
    const setClauses: string[] = [];
    const params: Array<string | number | null> = [];
    let paramIndex = 1;

    if (overrides.status) { setClauses.push(`status = $${paramIndex}`); params.push(overrides.status); paramIndex++; }
    if (overrides.categoryId !== undefined) { setClauses.push(`category_id = $${paramIndex}`); params.push(overrides.categoryId); paramIndex++; }
    if (overrides.summary !== undefined) { setClauses.push(`summary = $${paramIndex}`); params.push(overrides.summary); paramIndex++; }
    if (overrides.reason) { setClauses.push(`override_reason = $${paramIndex}`); params.push(overrides.reason); paramIndex++; }

    if (setClauses.length > 0) {
      params.push(id);
      await db.query(`UPDATE workspace_sessions SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, params);
    }
    await db.query('COMMIT');

    logAudit({
      actorType: role as 'admin' | 'faculty',
      actorId,
      action: 'SESSION_OVERRIDE',
      entityType: 'SESSION',
      entityId: id,
      details: { before, after: { ...before, ...overrides }, reason: overrides.reason },
      ipAddress: ip,
    });

    const updated = await getSessionById(id);
    if (overrides.status) {
      createNotification(updated.studentId, id, 'status_change', overrides.reason ? `Session status changed to ${overrides.status}: ${overrides.reason}` : `Session status changed to ${overrides.status}`);
    }

    return updated;
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}

export async function reviewSession(id: number, reviewerId: number, status: 'approved' | 'rejected', feedback: string | undefined, actorRole: string, ip?: string) {
  const db = getDb();
  const session = await getSessionRow(db, id);

  if (session.status !== 'completed') {
    throw new ConflictError('INVALID_TRANSITION', `Cannot review session in status '${session.status}'`);
  }

  logAudit({ actorType: actorRole as 'admin' | 'faculty', actorId: reviewerId, action: status === 'approved' ? 'SESSION_REVIEW_APPROVED' : 'SESSION_REVIEW_REJECTED', entityType: 'SESSION', entityId: id, details: { feedback }, ipAddress: ip });
  createNotification(session.student_id, id, status === 'approved' ? 'completed' : 'reminder', status === 'approved' ? 'Your work summary has been reviewed and approved' : `Your work summary needs revision: ${feedback || 'No feedback provided'}`);

  return await getSessionById(id);
}

export async function updateSessionCategory(sessionId: number, categoryId: number, userId: number): Promise<ReturnType<typeof rowToSession>> {
  const db = getDb();

  const catResult = await db.query('SELECT id, status FROM categories WHERE id = $1', [categoryId]);
  if (catResult.rows.length === 0) throw new NotFoundError('Category');
  if ((catResult.rows[0] as { status: string }).status !== 'active') {
    throw new BusinessRuleError('CATEGORY_NOT_ACTIVE', 'Selected category is not active');
  }

  const lockResult = await db.query('SELECT * FROM workspace_sessions WHERE id = $1 FOR UPDATE', [sessionId]);
  if (lockResult.rows.length === 0) throw new NotFoundError('Session');
  const session = lockResult.rows[0] as SessionRow;

  if (session.status !== 'active') {
    throw new BusinessRuleError('INVALID_STATE', `Cannot set category on session in status '${session.status}'`);
  }

  if (session.category_id !== null) {
    throw new BusinessRuleError('CATEGORY_ALREADY_SET', 'Category is already set for this session and cannot be changed');
  }

  await db.query('BEGIN');
  try {
    await db.query('UPDATE workspace_sessions SET category_id = $1 WHERE id = $2', [categoryId, sessionId]);
    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  logAudit({ actorType: 'student', actorId: userId, action: 'SESSION_CATEGORY_SET', entityType: 'SESSION', entityId: sessionId, details: { categoryId }, ipAddress: undefined });

  return await getSessionById(sessionId);
}

export async function autoCompleteSessions() {
  const db = getDb();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const selectResult = await db.query("SELECT id, student_id FROM workspace_sessions WHERE status IN ('active', 'awaiting_summary') AND entry_time < $1", [cutoff]);
  const rows: Array<{ id: number; student_id: number }> = selectResult.rows as Array<{ id: number; student_id: number }>;

  if (rows.length > 0) {
    await db.query("UPDATE workspace_sessions SET status = 'completed', completion_reason = 'auto_completed' WHERE status IN ('active', 'awaiting_summary') AND entry_time < $1", [cutoff]);

    for (const row of rows) {
      createNotification(row.student_id, row.id, 'auto_completed', 'Your work session has been auto-completed');
    }
  }

  return { autoCompleted: rows.length };
}

export async function getStudentStats(studentId: number) {
  const db = getDb();

  const totalResult = await db.query("SELECT COUNT(*) as total FROM workspace_sessions WHERE student_id = $1 AND status IN ('completed', 'archived')", [studentId]);
  const totalSessions = parseInt(totalResult.rows[0].total, 10);

  const durationResult = await db.query("SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (exit_time - entry_time))), 0) as total_duration FROM workspace_sessions WHERE student_id = $1 AND exit_time IS NOT NULL AND status IN ('completed', 'archived')", [studentId]);
  const totalDurationSeconds = parseInt(durationResult.rows[0].total_duration, 10);

  const categoryResult = await db.query("SELECT c.name, c.id, COUNT(*) as count FROM workspace_sessions ws LEFT JOIN categories c ON ws.category_id = c.id WHERE ws.student_id = $1 AND ws.status IN ('completed', 'archived') GROUP BY c.id, c.name ORDER BY count DESC", [studentId]);
  const sessionsByCategory: Array<{ categoryId: number | null; categoryName: string | null; count: number }> = (categoryResult.rows as Array<{ id: number | null; name: string | null; count: number }>).map(r => ({ categoryId: r.id, categoryName: r.name, count: parseInt(String(r.count), 10) }));

  const monthlyResult = await db.query("SELECT TO_CHAR(entry_time, 'YYYY-MM') as month, COUNT(*) as count FROM workspace_sessions WHERE student_id = $1 AND status IN ('completed', 'archived') AND entry_time >= NOW() - INTERVAL '6 months' GROUP BY month ORDER BY month ASC", [studentId]);
  const sessionsByMonth: Array<{ month: string; count: number }> = (monthlyResult.rows as Array<{ month: string; count: number }>).map(r => ({ month: r.month, count: parseInt(String(r.count), 10) }));

  const streakResult = await db.query("SELECT DISTINCT DATE(entry_time) as session_date FROM workspace_sessions WHERE student_id = $1 AND status IN ('completed', 'archived') ORDER BY session_date DESC", [studentId]);
  const sessionDates: string[] = (streakResult.rows as Array<{ session_date: string }>).map(r => r.session_date);

  let currentStreak = 0;
  if (sessionDates.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = new Date(today);
    for (const dateStr of sessionDates) {
      const sessionDate = new Date(dateStr);
      sessionDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((checkDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) { currentStreak++; checkDate = new Date(sessionDate.getTime() - 24 * 60 * 60 * 1000); }
      else if (diffDays === 1) { currentStreak++; checkDate = sessionDate; }
      else break;
    }
  }

  return {
    totalSessions,
    totalDurationSeconds,
    averageDurationSeconds: totalSessions > 0 ? Math.round(totalDurationSeconds / totalSessions) : 0,
    sessionsByCategory,
    sessionsByMonth,
    currentStreak,
  };
}

export async function getStudentHistory(studentId: number, page = 1, limit = 20) {
  const db = getDb();
  const offset = (page - 1) * limit;

  const countResult = await db.query('SELECT COUNT(*) as total FROM workspace_sessions WHERE student_id = $1', [studentId]);
  const total = parseInt(countResult.rows[0].total, 10);

  const result = await db.query('SELECT ws.*, c.name as category_name FROM workspace_sessions ws LEFT JOIN categories c ON ws.category_id = c.id WHERE ws.student_id = $1 ORDER BY ws.entry_time DESC LIMIT $2 OFFSET $3', [studentId, limit, offset]);
  const rows = result.rows as Array<Record<string, unknown>>;

  const sessions = rows.map(rowToSessionDetails);

  return { sessions, total, page, limit, totalPages: Math.ceil(total / limit) };
}

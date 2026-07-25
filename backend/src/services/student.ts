import { getDb } from '../db';
import { NotFoundError, ConflictError } from '../utils/errors';
import { logAudit } from './audit';
import { createNotification } from './notification';
import { config } from '../config';

interface StudentRow {
  id: number;
  roll: string;
  name: string;
  email: string | null;
  branch: string | null;
  section: string | null;
  status: string;
  created_at: string;
}

function rowToStudent(row: StudentRow) {
  return { id: row.id, roll: row.roll, name: row.name, email: row.email, branch: row.branch, section: row.section, status: row.status, createdAt: row.created_at };
}

export async function listStudents(page: number, limit: number, status?: string) {
  const db = getDb();
  const offset = (page - 1) * limit;

  let whereClause = '';
  const params: Array<string | number> = [];

  if (status === 'invited') {
    whereClause = ' WHERE status = $1';
    params.push('invited');
  } else if (status === 'enrolled') {
    whereClause = ' WHERE status = $1';
    params.push('enrolled');
  } else if (status === 'suspended') {
    whereClause = ' WHERE status = $1';
    params.push('suspended');
  } else if (status === 'departed') {
    whereClause = ' WHERE status = $1';
    params.push('departed');
  }

  const countResult = await db.query(`SELECT COUNT(*) as total FROM students${whereClause}`, params);
  const total = parseInt(countResult.rows[0].total, 10);

  const result = await db.query(`SELECT * FROM students${whereClause} ORDER BY roll ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
  const rows: StudentRow[] = result.rows as StudentRow[];

  return { students: rows.map(rowToStudent), total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getStudent(id: number) {
  const db = getDb();
  const result = await db.query('SELECT * FROM students WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new NotFoundError('Student');
  return rowToStudent(result.rows[0] as StudentRow);
}

export async function lookupStudent(query: string) {
  const db = getDb();
  const byId = parseInt(query, 10);
  if (!isNaN(byId)) {
    try { return await getStudent(byId); } catch { /* not found by id, continue */ }
  }
  const result = await db.query('SELECT * FROM students WHERE roll = $1 OR email = $2', [query, query]);
  if (result.rows.length === 0) throw new NotFoundError('Student');
  return rowToStudent(result.rows[0] as StudentRow);
}

export async function searchStudents(searchTerm: string) {
  const db = getDb();
  const pattern = `%${searchTerm}%`;
  const result = await db.query('SELECT * FROM students WHERE name ILIKE $1 OR roll ILIKE $2 OR email ILIKE $3', [pattern, pattern, pattern]);
  return (result.rows as StudentRow[]).map(rowToStudent);
}

export async function createStudent(roll: string, name: string, actorId: number, ip?: string, branch?: string, section?: string) {
  const db = getDb();
  const email = `${roll.toLowerCase()}${config.activation.studentEmailDomain}`;

  await db.query('BEGIN');
  let rolledBack = false;
  try {
    const dupResult = await db.query('SELECT id FROM students WHERE roll = $1', [roll]);
    if (dupResult.rows.length > 0) { await db.query('ROLLBACK'); rolledBack = true; throw new ConflictError('DUPLICATE_ROLL', `Student with roll '${roll}' already exists`); }

    const dupEmailResult = await db.query('SELECT id FROM students WHERE email = $1', [email]);
    if (dupEmailResult.rows.length > 0) { await db.query('ROLLBACK'); rolledBack = true; throw new ConflictError('DUPLICATE_EMAIL', `Student with email '${email}' already exists`); }

    const insertResult = await db.query("INSERT INTO students (roll, name, email, branch, section, status) VALUES ($1, $2, $3, $4, $5, 'invited') RETURNING id", [roll, name, email, branch || null, section || null]);
    const id = insertResult.rows[0].id as number;
    await db.query('COMMIT');

    logAudit({ actorType: 'admin', actorId, action: 'STUDENT_CREATED', entityType: 'STUDENT', entityId: id, details: { roll, name, email, branch, section }, ipAddress: ip });

    return await getStudent(id);
  } catch (err) {
    if (!rolledBack) { try { await db.query('ROLLBACK'); } catch { /* ignore */ } }
    throw err;
  }
}

export async function updateStudent(id: number, name: string, actorId: number, ip?: string, branch?: string, section?: string) {
  const db = getDb();
  const existing = await getStudent(id);

  const sets: string[] = ['name = $1'];
  const params: Array<string | number | null> = [name];
  let paramIndex = 2;
  if (branch !== undefined) { sets.push(`branch = $${paramIndex}`); params.push(branch || null); paramIndex++; }
  if (section !== undefined) { sets.push(`section = $${paramIndex}`); params.push(section || null); paramIndex++; }
  params.push(id);
  await db.query(`UPDATE students SET ${sets.join(', ')} WHERE id = $${paramIndex}`, params);

  logAudit({ actorType: 'admin', actorId, action: 'STUDENT_UPDATED', entityType: 'STUDENT', entityId: id, details: { before: { name: existing.name, branch: existing.branch, section: existing.section }, after: { name, branch, section } }, ipAddress: ip });

  return await getStudent(id);
}

export async function suspendStudent(id: number, actorId: number, ip?: string) {
  const db = getDb();
  const existing = await getStudent(id);
  if (existing.status !== 'enrolled') {
    throw new ConflictError('INVALID_STATUS', 'Only enrolled students can be suspended');
  }

  await db.query('BEGIN');
  let rolledBack = false;
  try {
    const activeResult = await db.query("SELECT id FROM workspace_sessions WHERE student_id = $1 AND status IN ('created', 'active', 'awaiting_summary')", [id]);
    if (activeResult.rows.length > 0) { await db.query('ROLLBACK'); rolledBack = true; throw new ConflictError('HAS_ACTIVE_SESSIONS', 'Cannot suspend student with active sessions'); }

    await db.query("UPDATE students SET status = 'suspended' WHERE id = $1", [id]);
    await db.query('COMMIT');

    logAudit({ actorType: 'admin', actorId, action: 'STUDENT_SUSPENDED', entityType: 'STUDENT', entityId: id, details: { previousStatus: existing.status }, ipAddress: ip });
    createNotification(id, null, 'status_change', 'Your account has been suspended. Please contact admin.');

    return await getStudent(id);
  } catch (err) {
    if (!rolledBack) { try { await db.query('ROLLBACK'); } catch { /* ignore */ } }
    throw err;
  }
}

export async function departStudent(id: number, actorId: number, ip?: string) {
  const db = getDb();
  const existing = await getStudent(id);
  if (existing.status === 'departed') {
    throw new ConflictError('ALREADY_DEPARTED', 'Student has already departed');
  }

  await db.query('BEGIN');
  let rolledBack = false;
  try {
    const activeResult = await db.query("SELECT id FROM workspace_sessions WHERE student_id = $1 AND status IN ('created', 'active', 'awaiting_summary')", [id]);
    if (activeResult.rows.length > 0) { await db.query('ROLLBACK'); rolledBack = true; throw new ConflictError('HAS_ACTIVE_SESSIONS', 'Cannot depart student with active sessions'); }

    await db.query("UPDATE students SET status = 'departed' WHERE id = $1", [id]);
    await db.query('COMMIT');

    logAudit({ actorType: 'admin', actorId, action: 'STUDENT_DEPARTED', entityType: 'STUDENT', entityId: id, details: { previousStatus: existing.status }, ipAddress: ip });
    createNotification(id, null, 'status_change', 'You have been marked as departed. Your account is no longer active.');

    return await getStudent(id);
  } catch (err) {
    if (!rolledBack) { try { await db.query('ROLLBACK'); } catch { /* ignore */ } }
    throw err;
  }
}

export async function getStudentHistory(studentId: number, page = 1, limit = 20) {
  const db = getDb();
  await getStudent(studentId);
  const offset = (page - 1) * limit;

  const countResult = await db.query('SELECT COUNT(*) as total FROM workspace_sessions WHERE student_id = $1', [studentId]);
  const total = parseInt(countResult.rows[0].total, 10);

  const result = await db.query('SELECT ws.*, c.name as category_name FROM workspace_sessions ws LEFT JOIN categories c ON ws.category_id = c.id WHERE ws.student_id = $1 ORDER BY ws.entry_time DESC LIMIT $2 OFFSET $3', [studentId, limit, offset]);
  const rows = result.rows as Array<Record<string, unknown>>;

  const sessions = rows.map(row => ({
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
    categoryName: row.category_name,
  }));

  return { sessions, total, page, limit, totalPages: Math.ceil(total / limit) };
}

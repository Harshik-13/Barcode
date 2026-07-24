import { getDb } from '../db';
import { NotFoundError, ConflictError } from '../utils/errors';
import { logAudit } from './audit';

interface StudentRow {
  id: number;
  roll: string;
  name: string;
  email: string | null;
  status: string;
  created_at: string;
}

function rowToStudent(row: StudentRow) {
  return { id: row.id, roll: row.roll, name: row.name, email: row.email, status: row.status, createdAt: row.created_at };
}

export function listStudents(page: number, limit: number, status?: string) {
  const db = getDb();
  const offset = (page - 1) * limit;

  let whereClause = '';
  const params: Array<string | number> = [];

  if (status === 'invited') {
    whereClause = ' WHERE status = ?';
    params.push('invited');
  } else if (status === 'enrolled') {
    whereClause = ' WHERE status = ?';
    params.push('enrolled');
  } else if (status === 'suspended') {
    whereClause = ' WHERE status = ?';
    params.push('suspended');
  } else if (status === 'departed') {
    whereClause = ' WHERE status = ?';
    params.push('departed');
  }

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM students${whereClause}`);
  if (params.length > 0) countStmt.bind(params);
  countStmt.step();
  const total = (countStmt.getAsObject() as unknown as { total: number }).total;
  countStmt.free();

  const stmt = db.prepare(`SELECT * FROM students${whereClause} ORDER BY roll ASC LIMIT ? OFFSET ?`);
  stmt.bind([...params, limit, offset]);
  const rows: StudentRow[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as StudentRow);
  }
  stmt.free();

  return { students: rows.map(rowToStudent), total, page, limit, totalPages: Math.ceil(total / limit) };
}

export function getStudent(id: number) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM students WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) { stmt.free(); throw new NotFoundError('Student'); }
  const row = stmt.getAsObject() as unknown as StudentRow;
  stmt.free();
  return rowToStudent(row);
}

export function lookupStudent(query: string) {
  const db = getDb();
  const byId = parseInt(query, 10);
  if (!isNaN(byId)) {
    try { return getStudent(byId); } catch { /* not found by id, continue */ }
  }
  const stmt = db.prepare('SELECT * FROM students WHERE roll = ? OR email = ?');
  stmt.bind([query, query]);
  if (!stmt.step()) { stmt.free(); throw new NotFoundError('Student'); }
  const row = stmt.getAsObject() as unknown as StudentRow;
  stmt.free();
  return rowToStudent(row);
}

export function searchStudents(searchTerm: string) {
  const db = getDb();
  const pattern = `%${searchTerm}%`;
  const stmt = db.prepare('SELECT * FROM students WHERE name LIKE ? OR roll LIKE ? OR email LIKE ?');
  stmt.bind([pattern, pattern, pattern]);
  const rows: StudentRow[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as StudentRow);
  }
  stmt.free();
  return rows.map(rowToStudent);
}

import { config } from '../config';

export function createStudent(roll: string, name: string, actorId: number, ip?: string) {
  const db = getDb();

  const dup = db.prepare('SELECT id FROM students WHERE roll = ?');
  dup.bind([roll]);
  if (dup.step()) { dup.free(); throw new ConflictError('DUPLICATE_ROLL', `Student with roll '${roll}' already exists`); }
  dup.free();

  const email = `${roll.toLowerCase()}${config.activation.studentEmailDomain}`;
  const dupEmail = db.prepare('SELECT id FROM students WHERE email = ?');
  dupEmail.bind([email]);
  if (dupEmail.step()) { dupEmail.free(); throw new ConflictError('DUPLICATE_EMAIL', `Student with email '${email}' already exists`); }
  dupEmail.free();

  const stmt = db.prepare("INSERT INTO students (roll, name, email, status) VALUES (?, ?, ?, 'invited')");
  stmt.run([roll, name, email]);
  stmt.free();

  const id = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;

  logAudit({ actorType: 'admin', actorId, action: 'STUDENT_CREATED', entityType: 'STUDENT', entityId: id, details: { roll, name, email }, ipAddress: ip });

  return getStudent(id);
}

export function updateStudent(id: number, name: string, actorId: number, ip?: string) {
  const db = getDb();
  const existing = getStudent(id);

  const stmt = db.prepare('UPDATE students SET name = ? WHERE id = ?');
  stmt.run([name, id]);
  stmt.free();

  logAudit({ actorType: 'admin', actorId, action: 'STUDENT_UPDATED', entityType: 'STUDENT', entityId: id, details: { before: { name: existing.name }, after: { name } }, ipAddress: ip });

  return getStudent(id);
}

export function suspendStudent(id: number, actorId: number, ip?: string) {
  const db = getDb();
  const existing = getStudent(id);
  if (existing.status !== 'enrolled') {
    throw new ConflictError('INVALID_STATUS', 'Only enrolled students can be suspended');
  }

  const activeStmt = db.prepare("SELECT id FROM workspace_sessions WHERE student_id = ? AND status IN ('created', 'active', 'awaiting_summary')");
  activeStmt.bind([id]);
  if (activeStmt.step()) { activeStmt.free(); throw new ConflictError('HAS_ACTIVE_SESSIONS', 'Cannot suspend student with active sessions'); }
  activeStmt.free();

  const stmt = db.prepare("UPDATE students SET status = 'suspended' WHERE id = ?");
  stmt.run([id]);
  stmt.free();

  logAudit({ actorType: 'admin', actorId, action: 'STUDENT_SUSPENDED', entityType: 'STUDENT', entityId: id, details: { previousStatus: existing.status }, ipAddress: ip });

  return getStudent(id);
}

export function departStudent(id: number, actorId: number, ip?: string) {
  const db = getDb();
  const existing = getStudent(id);
  if (existing.status === 'departed') {
    throw new ConflictError('ALREADY_DEPARTED', 'Student has already departed');
  }

  const activeStmt = db.prepare("SELECT id FROM workspace_sessions WHERE student_id = ? AND status IN ('created', 'active', 'awaiting_summary')");
  activeStmt.bind([id]);
  if (activeStmt.step()) { activeStmt.free(); throw new ConflictError('HAS_ACTIVE_SESSIONS', 'Cannot depart student with active sessions'); }
  activeStmt.free();

  const stmt = db.prepare("UPDATE students SET status = 'departed' WHERE id = ?");
  stmt.run([id]);
  stmt.free();

  logAudit({ actorType: 'admin', actorId, action: 'STUDENT_DEPARTED', entityType: 'STUDENT', entityId: id, details: { previousStatus: existing.status }, ipAddress: ip });

  return getStudent(id);
}

export function getStudentHistory(studentId: number, page = 1, limit = 20) {
  const db = getDb();
  getStudent(studentId);
  const offset = (page - 1) * limit;

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM workspace_sessions WHERE student_id = ?');
  countStmt.bind([studentId]);
  countStmt.step();
  const total = (countStmt.getAsObject() as unknown as { total: number }).total;
  countStmt.free();

  const stmt = db.prepare('SELECT ws.*, c.name as category_name FROM workspace_sessions ws LEFT JOIN categories c ON ws.category_id = c.id WHERE ws.student_id = ? ORDER BY ws.entry_time DESC LIMIT ? OFFSET ?');
  stmt.bind([studentId, limit, offset]);
  const rows: Array<Record<string, unknown>> = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as unknown as Record<string, unknown>;
    rows.push({
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
    });
  }
  stmt.free();

  return { sessions: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
}

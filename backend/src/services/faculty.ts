import { getDb } from '../db';
import { NotFoundError, ConflictError } from '../utils/errors';
import { logAudit } from './audit';

interface FacultyRow {
  id: number;
  email: string;
  name: string;
  status: string;
  created_at: string;
}

function rowToFaculty(row: FacultyRow) {
  return { id: row.id, email: row.email, name: row.name, status: row.status, createdAt: row.created_at };
}

export async function listFaculty(status?: string, search?: string) {
  const db = getDb();
  const conditions: string[] = ["role_id = 'faculty'"];
  const params: Array<string | number> = [];

  if (status === 'active') { conditions.push("status = 'active'"); }
  else if (status === 'invited') { conditions.push("status = 'invited'"); }
  else if (status === 'suspended') { conditions.push("status = 'suspended'"); }
  else if (status === 'deactivated') { conditions.push("status = 'deactivated'"); }

  if (search) {
    conditions.push('(name ILIKE $1 OR email ILIKE $2)');
    const pattern = `%${search}%`;
    params.push(pattern, pattern);
  }

  const whereClause = ` WHERE ${conditions.join(' AND ')}`;
  const result = await db.query(`SELECT id, email, name, status, created_at FROM users${whereClause} ORDER BY name ASC`, params);
  const rows: FacultyRow[] = result.rows as FacultyRow[];
  return rows.map(rowToFaculty);
}

export async function getFaculty(id: number) {
  const db = getDb();
  const result = await db.query("SELECT id, email, name, status, created_at FROM users WHERE id = $1 AND role_id = 'faculty'", [id]);
  if (result.rows.length === 0) throw new NotFoundError('Faculty');
  return rowToFaculty(result.rows[0] as FacultyRow);
}

export async function createFaculty(email: string, name: string, actorId: number, ip?: string) {
  const db = getDb();

  const dupResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (dupResult.rows.length > 0) throw new ConflictError('DUPLICATE_EMAIL', `A user with email '${email}' already exists`);

  const insertResult = await db.query("INSERT INTO users (email, name, role_id, status) VALUES ($1, $2, 'faculty', 'invited') RETURNING id", [email, name]);
  const id = insertResult.rows[0].id as number;

  logAudit({ actorType: 'admin', actorId, action: 'FACULTY_CREATED', entityType: 'FACULTY', entityId: id, details: { email, name }, ipAddress: ip });

  return await getFaculty(id);
}

export async function updateFaculty(id: number, name: string, email: string, actorId: number, ip?: string) {
  const db = getDb();
  const existing = await getFaculty(id);

  const dupResult = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
  if (dupResult.rows.length > 0) throw new ConflictError('DUPLICATE_EMAIL', `A user with email '${email}' already exists`);

  await db.query('UPDATE users SET name = $1, email = $2 WHERE id = $3', [name, email, id]);

  logAudit({ actorType: 'admin', actorId, action: 'FACULTY_UPDATED', entityType: 'FACULTY', entityId: id, details: { before: { name: existing.name, email: existing.email }, after: { name, email } }, ipAddress: ip });

  return await getFaculty(id);
}

export async function deactivateFaculty(id: number, actorId: number, ip?: string) {
  const db = getDb();
  const existing = await getFaculty(id);
  if (existing.status === 'deactivated') {
    throw new ConflictError('ALREADY_DEACTIVATED', 'Faculty is already deactivated');
  }

  await db.query("UPDATE users SET status = 'deactivated' WHERE id = $1", [id]);
  logAudit({ actorType: 'admin', actorId, action: 'FACULTY_DEACTIVATED', entityType: 'FACULTY', entityId: id, details: { previousStatus: existing.status }, ipAddress: ip });
  return await getFaculty(id);
}

export async function activateFaculty(id: number, actorId: number, ip?: string) {
  const db = getDb();
  const existing = await getFaculty(id);
  if (existing.status === 'active') {
    throw new ConflictError('ALREADY_ACTIVE', 'Faculty is already active');
  }

  await db.query("UPDATE users SET status = 'active' WHERE id = $1", [id]);
  logAudit({ actorType: 'admin', actorId, action: 'FACULTY_ACTIVATED', entityType: 'FACULTY', entityId: id, details: { previousStatus: existing.status }, ipAddress: ip });
  return await getFaculty(id);
}

export async function getFacultyByEmail(email: string) {
  const db = getDb();
  const result = await db.query("SELECT id, email, name, status, created_at FROM users WHERE email = $1 AND role_id = 'faculty'", [email]);
  if (result.rows.length === 0) throw new NotFoundError('Faculty');
  return rowToFaculty(result.rows[0] as FacultyRow);
}

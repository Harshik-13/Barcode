import { getDb } from '../db';
import { NotFoundError, ConflictError } from '../utils/errors';
import { logAudit } from './audit';

interface CategoryRow {
  id: number;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
}

function rowToCategory(row: CategoryRow) {
  return { id: row.id, name: row.name, description: row.description, status: row.status, createdAt: row.created_at };
}

export async function listCategories(status?: string) {
  const db = getDb();
  let sql = 'SELECT * FROM categories';
  const params: Array<string | number> = [];

  if (status === 'active') {
    sql += ' WHERE status = $1';
    params.push('active');
  } else if (status === 'archived') {
    sql += ' WHERE status = $1';
    params.push('archived');
  }

  sql += ' ORDER BY name ASC';
  const result = await db.query(sql, params);
  const rows: CategoryRow[] = result.rows as CategoryRow[];
  return rows.map(rowToCategory);
}

export async function getCategory(id: number) {
  const db = getDb();
  const result = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new NotFoundError('Category');
  return rowToCategory(result.rows[0] as CategoryRow);
}

export async function createCategory(name: string, description: string | undefined, actorId: number, ip?: string) {
  const db = getDb();

  const dupResult = await db.query('SELECT id FROM categories WHERE name = $1 AND status = $2', [name, 'active']);
  if (dupResult.rows.length > 0) throw new ConflictError('DUPLICATE_CATEGORY', `A category with name '${name}' already exists`);

  const insertResult = await db.query('INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id', [name, description ?? null]);
  const id = insertResult.rows[0].id as number;

  logAudit({ actorType: 'admin', actorId, action: 'CATEGORY_CREATED', entityType: 'CATEGORY', entityId: id, details: { name, description }, ipAddress: ip });

  return await getCategory(id);
}

export async function updateCategory(id: number, name: string, description: string | undefined, actorId: number, ip?: string) {
  const db = getDb();
  const existing = await getCategory(id);

  const dupResult = await db.query('SELECT id FROM categories WHERE name = $1 AND status = $2 AND id != $3', [name, 'active', id]);
  if (dupResult.rows.length > 0) throw new ConflictError('DUPLICATE_CATEGORY', `A category with name '${name}' already exists`);

  await db.query('UPDATE categories SET name = $1, description = $2 WHERE id = $3', [name, description ?? null, id]);

  logAudit({ actorType: 'admin', actorId, action: 'CATEGORY_UPDATED', entityType: 'CATEGORY', entityId: id, details: { before: existing, after: { name, description } }, ipAddress: ip });

  return await getCategory(id);
}

export async function getCategoryUsage(id: number): Promise<{ usageCount: number; activeSessions: number; deletionAllowed: boolean; blockedReason: string | null }> {
  const db = getDb();
  await getCategory(id);

  const countResult = await db.query('SELECT COUNT(*) as count FROM workspace_sessions WHERE category_id = $1', [id]);
  const usageCount = parseInt(countResult.rows[0].count, 10);

  const activeResult = await db.query("SELECT COUNT(*) as count FROM workspace_sessions WHERE category_id = $1 AND status IN ('created', 'active', 'awaiting_summary')", [id]);
  const activeSessions = parseInt(activeResult.rows[0].count, 10);

  let deletionAllowed = true;
  let blockedReason: string | null = null;

  if (usageCount > 0) {
    deletionAllowed = false;
    blockedReason = `Category is used in ${usageCount} session(s). Archive instead of delete.`;
  }

  return { usageCount, activeSessions, deletionAllowed, blockedReason };
}

export async function archiveCategory(id: number, actorId: number, ip?: string) {
  const db = getDb();
  const existing = await getCategory(id);

  if (existing.status === 'archived') {
    throw new ConflictError('CATEGORY_ALREADY_ARCHIVED', 'Category is already archived');
  }

  await db.query("UPDATE categories SET status = 'archived' WHERE id = $1", [id]);

  logAudit({ actorType: 'admin', actorId, action: 'CATEGORY_ARCHIVED', entityType: 'CATEGORY', entityId: id, details: { previousStatus: existing.status }, ipAddress: ip });

  return await getCategory(id);
}

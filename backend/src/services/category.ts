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

export function listCategories(status?: string) {
  const db = getDb();
  let sql = 'SELECT * FROM categories';
  const params: Array<string | number> = [];

  if (status === 'active') {
    sql += ' WHERE status = ?';
    params.push('active');
  } else if (status === 'archived') {
    sql += ' WHERE status = ?';
    params.push('archived');
  }

  sql += ' ORDER BY name ASC';
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows: CategoryRow[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as CategoryRow);
  }
  stmt.free();
  return rows.map(rowToCategory);
}

export function getCategory(id: number) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) { stmt.free(); throw new NotFoundError('Category'); }
  const row = stmt.getAsObject() as unknown as CategoryRow;
  stmt.free();
  return rowToCategory(row);
}

export function createCategory(name: string, description: string | undefined, actorId: number, ip?: string) {
  const db = getDb();

  const dup = db.prepare('SELECT id FROM categories WHERE name = ? AND status = ?');
  dup.bind([name, 'active']);
  if (dup.step()) { dup.free(); throw new ConflictError('DUPLICATE_CATEGORY', `A category with name '${name}' already exists`); }
  dup.free();

  const stmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  stmt.run([name, description ?? null]);
  stmt.free();

  const id = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;

  logAudit({ actorType: 'admin', actorId, action: 'CATEGORY_CREATED', entityType: 'CATEGORY', entityId: id, details: { name, description }, ipAddress: ip });

  return getCategory(id);
}

export function updateCategory(id: number, name: string, description: string | undefined, actorId: number, ip?: string) {
  const db = getDb();
  const existing = getCategory(id);

  const dup = db.prepare('SELECT id FROM categories WHERE name = ? AND status = ? AND id != ?');
  dup.bind([name, 'active', id]);
  if (dup.step()) { dup.free(); throw new ConflictError('DUPLICATE_CATEGORY', `A category with name '${name}' already exists`); }
  dup.free();

  const stmt = db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?');
  stmt.run([name, description ?? null, id]);
  stmt.free();

  logAudit({ actorType: 'admin', actorId, action: 'CATEGORY_UPDATED', entityType: 'CATEGORY', entityId: id, details: { before: existing, after: { name, description } }, ipAddress: ip });

  return getCategory(id);
}

export function archiveCategory(id: number, actorId: number, ip?: string) {
  const db = getDb();
  const existing = getCategory(id);

  if (existing.status === 'archived') {
    throw new ConflictError('CATEGORY_ALREADY_ARCHIVED', 'Category is already archived');
  }

  const stmt = db.prepare("UPDATE categories SET status = 'archived' WHERE id = ?");
  stmt.run([id]);
  stmt.free();

  logAudit({ actorType: 'admin', actorId, action: 'CATEGORY_ARCHIVED', entityType: 'CATEGORY', entityId: id, details: { previousStatus: existing.status }, ipAddress: ip });

  return getCategory(id);
}

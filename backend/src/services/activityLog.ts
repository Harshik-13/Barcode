import { getDb } from '../db';
import { NotFoundError } from '../utils/errors';

interface ActivityLogRow {
  id: number;
  actor_type: string;
  actor_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string | Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

function rowToActivityLog(row: ActivityLogRow) {
  return {
    id: row.id,
    actorType: row.actor_type,
    actorId: row.actor_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: typeof row.details === 'string' ? (() => { try { return JSON.parse(row.details); } catch { return row.details; } })() : row.details,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  };
}

export function listActivityLogs(page = 1, limit = 50, filters?: { actorType?: string; action?: string; entityType?: string; dateFrom?: string; dateTo?: string }) {
  const db = getDb();
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (filters?.actorType) { conditions.push('actor_type = ?'); params.push(filters.actorType); }
  if (filters?.action) { conditions.push('action = ?'); params.push(filters.action); }
  if (filters?.entityType) { conditions.push('entity_type = ?'); params.push(filters.entityType); }
  if (filters?.dateFrom) { conditions.push('created_at >= ?'); params.push(filters.dateFrom); }
  if (filters?.dateTo) { conditions.push('created_at <= ?'); params.push(filters.dateTo); }

  const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM activity_logs${whereClause}`);
  if (params.length > 0) countStmt.bind(params);
  countStmt.step();
  const total = (countStmt.getAsObject() as unknown as { total: number }).total;
  countStmt.free();

  const stmt = db.prepare(`SELECT * FROM activity_logs${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`);
  stmt.bind([...params, limit, offset]);
  const rows: ActivityLogRow[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as ActivityLogRow);
  }
  stmt.free();

  const logs = rows.map(rowToActivityLog);
  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export function getActivityLog(id: number) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM activity_logs WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) { stmt.free(); throw new NotFoundError('ActivityLog'); }
  const row = stmt.getAsObject() as unknown as ActivityLogRow;
  stmt.free();
  return rowToActivityLog(row);
}

export function getRecentActivity(limit = 10) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?');
  stmt.bind([limit]);
  const rows: ActivityLogRow[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as ActivityLogRow);
  }
  stmt.free();
  return rows.map(rowToActivityLog);
}

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

export async function listActivityLogs(page = 1, limit = 50, filters?: { actorType?: string; action?: string; entityType?: string; dateFrom?: string; dateTo?: string }) {
  const db = getDb();
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (filters?.actorType) { conditions.push(`actor_type = $${params.length + 1}`); params.push(filters.actorType); }
  if (filters?.action) { conditions.push(`action = $${params.length + 1}`); params.push(filters.action); }
  if (filters?.entityType) { conditions.push(`entity_type = $${params.length + 1}`); params.push(filters.entityType); }
  if (filters?.dateFrom) { conditions.push(`created_at >= $${params.length + 1}`); params.push(filters.dateFrom); }
  if (filters?.dateTo) { conditions.push(`created_at <= $${params.length + 1}`); params.push(filters.dateTo); }

  const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(`SELECT COUNT(*) as total FROM activity_logs${whereClause}`, params);
  const total = parseInt(countResult.rows[0].total, 10);

  const result = await db.query(`SELECT * FROM activity_logs${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
  const rows: ActivityLogRow[] = result.rows as ActivityLogRow[];

  const logs = rows.map(rowToActivityLog);
  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getActivityLog(id: number) {
  const db = getDb();
  const result = await db.query('SELECT * FROM activity_logs WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new NotFoundError('ActivityLog');
  return rowToActivityLog(result.rows[0] as ActivityLogRow);
}

export async function getRecentActivity(limit = 10) {
  const db = getDb();
  const result = await db.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT $1', [limit]);
  const rows: ActivityLogRow[] = result.rows as ActivityLogRow[];
  return rows.map(rowToActivityLog);
}

import { getDb } from '../db';

export interface AuditEntry {
  actorType: 'student' | 'faculty' | 'admin' | 'system';
  actorId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const db = getDb();
    await db.query(
      `INSERT INTO activity_logs (actor_type, actor_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.actorType,
        entry.actorId ?? null,
        entry.action,
        entry.entityType,
        entry.entityId ?? null,
        entry.details ? JSON.stringify(entry.details) : null,
        entry.ipAddress ?? null,
      ]
    );
  } catch {
    // Audit failures must never crash the request
  }
}

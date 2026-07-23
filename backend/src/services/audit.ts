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

export function logAudit(entry: AuditEntry): void {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO activity_logs (actor_type, actor_id, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      entry.actorType,
      entry.actorId ?? null,
      entry.action,
      entry.entityType,
      entry.entityId ?? null,
      entry.details ? JSON.stringify(entry.details) : null,
      entry.ipAddress ?? null,
    ]);
    stmt.free();
  } catch {
    // Audit failures must never crash the request
  }
}

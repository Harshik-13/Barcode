import { getDb } from '../db';

interface NotificationRow {
  id: number;
  student_id: number;
  session_id: number | null;
  type: string;
  message: string;
  is_read: number;
  created_at: string;
}

function rowToNotification(row: NotificationRow) {
  return {
    id: row.id,
    studentId: row.student_id,
    sessionId: row.session_id,
    type: row.type,
    message: row.message,
    isRead: !!row.is_read,
    createdAt: row.created_at,
  };
}

export function createNotification(studentId: number, sessionId: number | null, type: string, message: string): void {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO notifications (student_id, session_id, type, message) VALUES (?, ?, ?, ?)');
  stmt.run([studentId, sessionId, type, message]);
  stmt.free();
}

export function getNotifications(studentId: number, page = 1, limit = 20) {
  const db = getDb();
  const offset = (page - 1) * limit;

  const countStmt = db.prepare('SELECT COUNT(*) as total FROM notifications WHERE student_id = ?');
  countStmt.bind([studentId]);
  countStmt.step();
  const total = (countStmt.getAsObject() as unknown as { total: number }).total;
  countStmt.free();

  const stmt = db.prepare('SELECT * FROM notifications WHERE student_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?');
  stmt.bind([studentId, limit, offset]);
  const rows: NotificationRow[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as NotificationRow);
  }
  stmt.free();

  return {
    notifications: rows.map(rowToNotification),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export function getUnreadCount(studentId: number): number {
  const db = getDb();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE student_id = ? AND is_read = 0');
  stmt.bind([studentId]);
  stmt.step();
  const result = stmt.getAsObject() as unknown as { count: number };
  stmt.free();
  return result.count;
}

export function markAsRead(notificationId: number, studentId: number): void {
  const db = getDb();
  db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND student_id = ?', [notificationId, studentId]);
}

export function markAllAsRead(studentId: number): void {
  const db = getDb();
  db.run('UPDATE notifications SET is_read = 1 WHERE student_id = ? AND is_read = 0', [studentId]);
}

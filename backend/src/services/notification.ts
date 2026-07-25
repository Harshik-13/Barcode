import { getDb } from '../db';
import { dispatchPushToStudent } from './push';

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

export async function createNotification(studentId: number, sessionId: number | null, type: string, message: string): Promise<void> {
  const db = getDb();
  await db.query('INSERT INTO notifications (student_id, session_id, type, message) VALUES ($1, $2, $3, $4)', [studentId, sessionId, type, message]);

  let actionUrl: string | undefined;
  if (sessionId) {
    switch (type) {
      case 'entry':
        actionUrl = '/dashboard';
        break;
      case 'exit':
      case 'summary_required':
        actionUrl = `/sessions/${sessionId}`;
        break;
      case 'completed':
      case 'auto_completed':
        actionUrl = '/dashboard';
        break;
      case 'reminder':
        actionUrl = '/dashboard';
        break;
      default:
        actionUrl = '/dashboard';
    }
  }

  dispatchPushToStudent(studentId, type, message, sessionId ?? undefined, actionUrl).catch(err => {
    console.error('Push dispatch failed:', err);
  });
}

export async function broadcastNotification(type: string, message: string): Promise<number> {
  const db = getDb();
  const result = await db.query("SELECT id FROM students WHERE status = 'enrolled'");
  const studentIds: number[] = (result.rows as Array<{ id: number }>).map(r => r.id);

  for (const sid of studentIds) {
    await db.query('INSERT INTO notifications (student_id, session_id, type, message) VALUES ($1, NULL, $2, $3)', [sid, type, message]);
  }

  const actionUrl = '/notifications';
  for (const sid of studentIds) {
    dispatchPushToStudent(sid, type, message, undefined, actionUrl).catch(err => {
      console.error('Push notification broadcast failed for student', sid, err);
    });
  }

  return studentIds.length;
}

export async function getNotifications(studentId: number, page = 1, limit = 20) {
  const db = getDb();
  const offset = (page - 1) * limit;

  const countResult = await db.query('SELECT COUNT(*) as total FROM notifications WHERE student_id = $1', [studentId]);
  const total = parseInt(countResult.rows[0].total, 10);

  const result = await db.query('SELECT * FROM notifications WHERE student_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [studentId, limit, offset]);
  const rows: NotificationRow[] = result.rows as NotificationRow[];

  return {
    notifications: rows.map(rowToNotification),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUnreadCount(studentId: number): Promise<number> {
  const db = getDb();
  const result = await db.query('SELECT COUNT(*) as count FROM notifications WHERE student_id = $1 AND is_read = 0', [studentId]);
  return parseInt(result.rows[0].count, 10);
}

export async function markAsRead(notificationId: number, studentId: number): Promise<void> {
  const db = getDb();
  await db.query('UPDATE notifications SET is_read = 1 WHERE id = $1 AND student_id = $2', [notificationId, studentId]);
}

export async function markAllAsRead(studentId: number): Promise<void> {
  const db = getDb();
  await db.query('UPDATE notifications SET is_read = 1 WHERE student_id = $1 AND is_read = 0', [studentId]);
}

export async function createFacultyNotification(userId: number, sessionId: number, type: string, message: string): Promise<void> {
  const db = getDb();
  await db.query('INSERT INTO faculty_notifications (user_id, session_id, type, message) VALUES ($1, $2, $3, $4)', [userId, sessionId, type, message]);
}

export async function notifyFacultyNewCompletion(sessionId: number, studentName: string, summary: string): Promise<number> {
  const db = getDb();
  const result = await db.query("SELECT id FROM users WHERE role_id = 'faculty' AND status = 'active'");
  const facultyIds: number[] = (result.rows as Array<{ id: number }>).map(r => r.id);

  for (const uid of facultyIds) {
    await createFacultyNotification(uid, sessionId, 'review', `${studentName} submitted a work summary for review: "${summary.substring(0, 100)}${summary.length > 100 ? '...' : ''}"`);
  }

  return facultyIds.length;
}

export async function getFacultyNotifications(userId: number, page = 1, limit = 20) {
  const db = getDb();
  const offset = (page - 1) * limit;

  const countResult = await db.query('SELECT COUNT(*) as total FROM faculty_notifications WHERE user_id = $1', [userId]);
  const total = parseInt(countResult.rows[0].total, 10);

  const result = await db.query('SELECT fn.*, ws.student_id, s.name as student_name, s.roll as student_roll FROM faculty_notifications fn LEFT JOIN workspace_sessions ws ON fn.session_id = ws.id LEFT JOIN students s ON ws.student_id = s.id WHERE fn.user_id = $1 ORDER BY fn.created_at DESC LIMIT $2 OFFSET $3', [userId, limit, offset]);
  const rows: Array<Record<string, unknown>> = result.rows as Array<Record<string, unknown>>;

  const notifications = rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    sessionId: r.session_id,
    type: r.type,
    message: r.message,
    isRead: !!(r.is_read as number),
    createdAt: r.created_at,
    studentName: r.student_name,
    studentRoll: r.student_roll,
  }));

  return { notifications, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function markFacultyNotificationRead(notificationId: number, userId: number): Promise<void> {
  const db = getDb();
  await db.query('UPDATE faculty_notifications SET is_read = 1 WHERE id = $1 AND user_id = $2', [notificationId, userId]);
}

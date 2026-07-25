import { getDb } from '../db';
import { createNotification } from './notification';
import { logger } from '../utils/logger';

export async function sendReminders(): Promise<{ categoryReminders: number; summaryReminders: number }> {
  const db = getDb();
  let categoryReminders = 0;
  let summaryReminders = 0;

  const catCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const catResult = await db.query(`
    SELECT ws.id, ws.student_id FROM workspace_sessions ws
    WHERE ws.status = 'created' AND ws.entry_time < $1
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.session_id = ws.id AND n.type = 'reminder' AND n.is_read = 0
    )
  `, [catCutoff]);
  const catRows: Array<{ id: number; student_id: number }> = catResult.rows as Array<{ id: number; student_id: number }>;

  for (const row of catRows) {
    createNotification(row.student_id, row.id, 'reminder', 'Please select a work category for your session');
    categoryReminders++;
  }

  const sumCutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const sumResult = await db.query(`
    SELECT ws.id, ws.student_id FROM workspace_sessions ws
    WHERE ws.status = 'awaiting_summary' AND ws.exit_time IS NOT NULL AND ws.exit_time < $1
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.session_id = ws.id AND n.type = 'reminder' AND n.is_read = 0
    )
  `, [sumCutoff]);
  const sumRows: Array<{ id: number; student_id: number }> = sumResult.rows as Array<{ id: number; student_id: number }>;

  for (const row of sumRows) {
    createNotification(row.student_id, row.id, 'reminder', 'Your work summary is due. Please submit it to complete your session.');
    summaryReminders++;
  }

  if (categoryReminders > 0 || summaryReminders > 0) {
    logger.info(`Sent ${categoryReminders} category reminder(s) and ${summaryReminders} summary reminder(s)`);
  }

  return { categoryReminders, summaryReminders };
}

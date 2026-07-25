import { getDb } from '../db';

export interface DashboardStats {
  totalStudents: number;
  enrolledStudents: number;
  invitedStudents: number;
  activeFaculty: number;
  invitedFaculty: number;
  totalFaculty: number;
  activeCategories: number;
  activeSessions: number;
  awaitingSummary: number;
  todaySessions: number;
  recentLogs: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const count = async (sql: string, params?: Array<string | number>): Promise<number> => {
    const result = await db.query(sql, params ?? []);
    return parseInt(result.rows[0].count, 10);
  };

  const totalStudents = await count('SELECT COUNT(*) as count FROM students');
  const enrolledStudents = await count("SELECT COUNT(*) as count FROM students WHERE status = 'enrolled'");
  const invitedStudents = await count("SELECT COUNT(*) as count FROM students WHERE status = 'invited'");
  const totalFaculty = await count("SELECT COUNT(*) as count FROM users WHERE role_id = 'faculty'");
  const activeFaculty = await count("SELECT COUNT(*) as count FROM users WHERE role_id = 'faculty' AND status = 'active'");
  const invitedFaculty = await count("SELECT COUNT(*) as count FROM users WHERE role_id = 'faculty' AND status = 'invited'");
  const activeCategories = await count("SELECT COUNT(*) as count FROM categories WHERE status = 'active'");
  const activeSessions = await count("SELECT COUNT(*) as count FROM workspace_sessions WHERE status IN ('created', 'active')");
  const awaitingSummary = await count("SELECT COUNT(*) as count FROM workspace_sessions WHERE status = 'awaiting_summary'");
  const todaySessions = await count('SELECT COUNT(*) as count FROM workspace_sessions WHERE entry_time::date = $1::date', [today]);
  const recentLogs = await count('SELECT COUNT(*) as count FROM activity_logs WHERE created_at::date = $1::date', [today]);

  return {
    totalStudents, enrolledStudents, invitedStudents,
    activeFaculty, invitedFaculty, totalFaculty,
    activeCategories, activeSessions, awaitingSummary, todaySessions, recentLogs,
  };
}

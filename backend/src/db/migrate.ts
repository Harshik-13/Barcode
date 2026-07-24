import { initDb, getDb, saveDb, closeDb } from './index';
import { logger } from '../utils/logger';

export async function migrate(options?: { skipClose?: boolean }): Promise<void> {
  await initDb();
  const db = getDb();

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role_id TEXT NOT NULL REFERENCES roles(id),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roll TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'suspended', 'departed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS workspace_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id),
      entry_time TEXT NOT NULL,
      exit_time TEXT,
      entry_recorder_id INTEGER NOT NULL REFERENCES users(id),
      exit_recorder_id INTEGER REFERENCES users(id),
      category_id INTEGER REFERENCES categories(id),
      status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'active', 'awaiting_summary', 'completed', 'archived')),
      completion_reason TEXT CHECK (completion_reason IN ('normal', 'auto_completed', 'manual_exit', 'admin_override')),
      summary TEXT,
      is_manual_exit INTEGER NOT NULL DEFAULT 0,
      manual_exit_reason TEXT,
      override_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_student_status ON workspace_sessions(student_id, status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_entry_time ON workspace_sessions(entry_time)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_status ON workspace_sessions(status)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id),
      session_id INTEGER REFERENCES workspace_sessions(id),
      type TEXT NOT NULL CHECK (type IN ('entry', 'exit', 'reminder')),
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id, is_read)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_type TEXT NOT NULL CHECK (actor_type IN ('student', 'faculty', 'admin', 'system')),
      actor_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS activation_otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id),
      otp_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      expires_at TEXT NOT NULL,
      is_used INTEGER NOT NULL DEFAULT 0,
      verified_at TEXT,
      activation_token TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_activation_otps_student ON activation_otps(student_id, is_used)`);

  saveDb();
  logger.info('Migration completed successfully');
  if (!options?.skipClose) {
    closeDb();
  }
}

if (require.main === module) {
  migrate().catch((err) => {
    logger.error('Migration failed', { error: err.message });
    process.exit(1);
  });
}

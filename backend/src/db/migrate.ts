import { initDb, getDb, closeDb } from './index';
import { logger } from '../utils/logger';

export async function migrate(options?: { skipClose?: boolean }): Promise<void> {
  await initDb();
  const db = getDb();

  // 1. Roles Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // 2. Users Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT,
      role_id TEXT NOT NULL REFERENCES roles(id),
      status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended', 'deactivated')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Students Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      roll TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      branch TEXT,
      section TEXT,
      status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'enrolled', 'suspended', 'departed')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. Categories Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. Workspace Sessions Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS workspace_sessions (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id),
      entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
      exit_time TIMESTAMP WITH TIME ZONE,
      entry_recorder_id INTEGER NOT NULL REFERENCES users(id),
      exit_recorder_id INTEGER REFERENCES users(id),
      category_id INTEGER REFERENCES categories(id),
      status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'active', 'awaiting_summary', 'completed', 'archived')),
      completion_reason TEXT CHECK (completion_reason IN ('normal', 'auto_completed', 'manual_exit', 'admin_override')),
      summary TEXT,
      is_manual_exit INTEGER NOT NULL DEFAULT 0,
      manual_exit_reason TEXT,
      override_reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_sessions_student_status ON workspace_sessions(student_id, status)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_sessions_entry_time ON workspace_sessions(entry_time)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_sessions_status ON workspace_sessions(status)`);

  // 6. Notifications Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id),
      session_id INTEGER REFERENCES workspace_sessions(id),
      type TEXT NOT NULL CHECK (type IN ('entry', 'exit', 'reminder', 'completed', 'auto_completed', 'status_change', 'broadcast')),
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id, is_read)`);

  // 7. Faculty Notifications Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS faculty_notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      session_id INTEGER REFERENCES workspace_sessions(id),
      type TEXT NOT NULL DEFAULT 'review' CHECK (type IN ('review', 'info')),
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_faculty_notifications_user ON faculty_notifications(user_id, is_read)`);

  // 8. Activity Logs Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      actor_type TEXT NOT NULL CHECK (actor_type IN ('student', 'faculty', 'admin', 'system')),
      actor_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at)`);

  // 9. Activation OTPs Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS activation_otps (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id),
      otp_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      is_used INTEGER NOT NULL DEFAULT 0,
      verified_at TIMESTAMP WITH TIME ZONE,
      activation_token TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_activation_otps_student ON activation_otps(student_id, is_used)`);

  // 10. Faculty Activation OTPs Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS faculty_activation_otps (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      otp_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      is_used INTEGER NOT NULL DEFAULT 0,
      verified_at TIMESTAMP WITH TIME ZONE,
      activation_token TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_faculty_activation_otps_user ON faculty_activation_otps(user_id, is_used)`);

  // 11. Push Subscriptions Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id),
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      active INTEGER NOT NULL DEFAULT 1
    )
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_student ON push_subscriptions(student_id, active)`);

  // 12. Add hostel to students (idempotent)
  try { await db.query(`ALTER TABLE students ADD COLUMN hostel TEXT`); } catch { /* column already exists */ }

  // 13. Add profile_picture to users (idempotent)
  try { await db.query(`ALTER TABLE users ADD COLUMN profile_picture TEXT`); } catch { /* column already exists */ }

  // 14. Add source to students (idempotent)
  try { await db.query(`ALTER TABLE students ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'`); } catch { /* column already exists */ }
  try { await db.query(`ALTER TABLE students DROP CONSTRAINT IF EXISTS students_source_check`); } catch { /* ignore */ }
  try { await db.query(`ALTER TABLE students ADD CONSTRAINT students_source_check CHECK (source IN ('manual', 'excel_import'))`); } catch { /* ignore */ }

  // 15. Add password_changed_at to users (idempotent)
  try { await db.query(`ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`); } catch { /* column already exists */ }

  // 16. Password Reset Tokens Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash)`);

  // 17. Add google_sub to users (idempotent) — Google OAuth permanent identity binding
  try { await db.query(`ALTER TABLE users ADD COLUMN google_sub TEXT`); } catch { /* column already exists */ }
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub)`);

  logger.info('Migration completed successfully');
  if (!options?.skipClose) {
    await closeDb();
  }
}

if (require.main === module) {
  migrate().catch((err) => {
    logger.error('Migration failed', { error: err.message });
    process.exit(1);
  });
}

import { initDb, getDb, closeDb } from './index';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

export async function seed(options?: { skipClose?: boolean }): Promise<void> {
  await initDb();
  const db = getDb();

  const countResult = await db.query('SELECT COUNT(*) as count FROM roles');
  const count = parseInt(countResult.rows[0].count, 10);

  if (count > 0) {
    logger.info('Database already seeded');
    if (!options?.skipClose) {
      await closeDb();
    }
    return;
  }

  await db.query("INSERT INTO roles (id, name) VALUES ('student', 'student')");
  await db.query("INSERT INTO roles (id, name) VALUES ('faculty', 'faculty')");
  await db.query("INSERT INTO roles (id, name) VALUES ('admin', 'admin')");

  const adminHash = bcrypt.hashSync('Harshverse', 12);
  await db.query(
    "INSERT INTO users (email, name, password_hash, role_id, status) VALUES ('admin@workspace.com', 'System Admin', $1, 'admin', 'active')",
    [adminHash]
  );

  const facultyHash = bcrypt.hashSync('faculty123', 12);
  await db.query(
    "INSERT INTO users (email, name, password_hash, role_id, status) VALUES ('faculty@workspace.com', 'Demo Faculty', $1, 'faculty', 'active')",
    [facultyHash]
  );

  const studentUserHash = bcrypt.hashSync('student123', 12);
  await db.query(
    "INSERT INTO users (email, name, password_hash, role_id, status) VALUES ('student@workspace.com', 'Demo Student', $1, 'student', 'active')",
    [studentUserHash]
  );

  await db.query(
    "INSERT INTO students (roll, name, email, status) VALUES ('STU001', 'Alice Student', 'stu001@vnrvjiet.in', 'enrolled')"
  );
  await db.query(
    "INSERT INTO students (roll, name, email, status) VALUES ('STU002', 'Bob Student', 'stu002@vnrvjiet.in', 'enrolled')"
  );
  await db.query(
    "INSERT INTO students (roll, name, email, status) VALUES ('STU003', 'Charlie Student', 'stu003@vnrvjiet.in', 'enrolled')"
  );
  await db.query(
    "INSERT INTO students (roll, name, email, status) VALUES ('STU004', 'Diana Student', 'stu004@vnrvjiet.in', 'enrolled')"
  );

  await db.query(
    "INSERT INTO categories (name, description) VALUES ('Coding', 'Software development work')"
  );
  await db.query(
    "INSERT INTO categories (name, description) VALUES ('Design', 'UI/UX and graphic design work')"
  );
  await db.query(
    "INSERT INTO categories (name, description) VALUES ('Research', 'Technical research and study')"
  );

  logger.info('Seed completed successfully');
  if (!options?.skipClose) {
    await closeDb();
  }
}

if (require.main === module) {
  seed().catch((err) => {
    logger.error('Seed failed', { error: err.message });
    process.exit(1);
  });
}

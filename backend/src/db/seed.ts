import { initDb, getDb, saveDb, closeDb } from './index';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

export async function seed(options?: { skipClose?: boolean }): Promise<void> {
  await initDb();
  const db = getDb();

  const stmt = db.prepare('SELECT COUNT(*) as count FROM roles');
  stmt.step();
  const count = stmt.getAsObject() as { count: number };
  stmt.free();

  if (count.count > 0) {
    logger.info('Database already seeded');
    if (!options?.skipClose) {
      closeDb();
    }
    return;
  }

  db.run("INSERT INTO roles (id, name) VALUES ('student', 'student')");
  db.run("INSERT INTO roles (id, name) VALUES ('faculty', 'faculty')");
  db.run("INSERT INTO roles (id, name) VALUES ('admin', 'admin')");

  const adminHash = bcrypt.hashSync('admin123', 12);
  db.run(
    "INSERT INTO users (email, name, password_hash, role_id) VALUES ('admin@workspace.com', 'System Admin', ?, 'admin')",
    [adminHash]
  );

  const facultyHash = bcrypt.hashSync('faculty123', 12);
  db.run(
    "INSERT INTO users (email, name, password_hash, role_id) VALUES ('faculty@workspace.com', 'Demo Faculty', ?, 'faculty')",
    [facultyHash]
  );

  const studentUserHash = bcrypt.hashSync('student123', 12);
  db.run(
    "INSERT INTO users (email, name, password_hash, role_id) VALUES ('student@workspace.com', 'Demo Student', ?, 'student')",
    [studentUserHash]
  );

  db.run(
    "INSERT INTO students (roll, name, email, status) VALUES ('STU001', 'Alice Student', 'stu001@vnrvjiet.in', 'enrolled')"
  );
  db.run(
    "INSERT INTO students (roll, name, email, status) VALUES ('STU002', 'Bob Student', 'stu002@vnrvjiet.in', 'enrolled')"
  );
  db.run(
    "INSERT INTO students (roll, name, email, status) VALUES ('STU003', 'Charlie Student', 'stu003@vnrvjiet.in', 'enrolled')"
  );
  db.run(
    "INSERT INTO students (roll, name, email, status) VALUES ('STU004', 'Diana Student', 'stu004@vnrvjiet.in', 'enrolled')"
  );

  db.run(
    "INSERT INTO categories (name, description) VALUES ('Coding', 'Software development work')"
  );
  db.run(
    "INSERT INTO categories (name, description) VALUES ('Design', 'UI/UX and graphic design work')"
  );
  db.run(
    "INSERT INTO categories (name, description) VALUES ('Research', 'Technical research and study')"
  );

  saveDb();
  logger.info('Seed completed successfully');
  if (!options?.skipClose) {
    closeDb();
  }
}

if (require.main === module) {
  seed().catch((err) => {
    logger.error('Seed failed', { error: err.message });
    process.exit(1);
  });
}

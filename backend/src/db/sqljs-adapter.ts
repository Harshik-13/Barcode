import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';

const dbPath = path.resolve(config.database.path);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db: SqlJsDatabase | null = null;

export const EXPECTED_TABLES = [
  'roles',
  'users',
  'students',
  'categories',
  'workspace_sessions',
  'notifications',
  'activity_logs',
  'activation_otps',
] as const;

export type { SqlJsDatabase };

function tmpPath(): string {
  return `${dbPath}.tmp.${process.pid}`;
}

function cleanupStaleTemp(): void {
  const tmpPrefix = path.basename(dbPath) + '.tmp.';
  try {
    const files = fs.readdirSync(dbDir);
    for (const file of files) {
      if (file.startsWith(tmpPrefix) && file !== `${tmpPrefix}${process.pid}`) {
        const fullPath = path.join(dbDir, file);
        try {
          fs.unlinkSync(fullPath);
          logger.warn('Cleaned up stale temporary database file', { file });
        } catch {
        }
      }
    }
  } catch {
  }
}

export async function initDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  cleanupStaleTemp();

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    if (stats.size === 0) {
      logger.warn('Database file is empty, creating new database');
      db = new SQL.Database();
    } else {
      try {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
      } catch (err) {
        logger.error('Failed to load database, backing up corrupt file', {
          error: (err as Error).message,
          path: dbPath,
        });
        const backupPath = `${dbPath}.corrupt.${Date.now()}`;
        fs.renameSync(dbPath, backupPath);
        logger.warn(`Corrupt database backed up to: ${backupPath}`);
        db = new SQL.Database();
      }
    }
  } else {
    logger.info('Database file not found, creating new database');
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  logger.info(`Database connected: ${dbPath}`);
  return db;
}

export function getDb(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const uniqTmp = tmpPath();
  fs.writeFileSync(uniqTmp, buffer);
  fs.renameSync(uniqTmp, dbPath);
}

export function closeDb(): void {
  if (db) {
    saveDb();
    db.close();
    logger.info('Database connection closed');
  }
  db = null;
}

export function validateDb(): void {
  const database = getDb();
  const existingTables: string[] = [];
  const stmt = database.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  while (stmt.step()) {
    const row = stmt.getAsObject() as { name: string };
    existingTables.push(row.name);
  }
  stmt.free();

  const missing = EXPECTED_TABLES.filter((t) => !existingTables.includes(t));
  if (missing.length > 0) {
    throw new Error(
      `Database integrity check failed. Missing tables: ${missing.join(', ')}`
    );
  }
  logger.info('Database integrity check passed');
}

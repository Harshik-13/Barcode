import { Pool, types } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

// Parse PostgreSQL timestamp/timestamptz columns as raw string to maintain SQLite string format compatibility
types.setTypeParser(1114, (val: string) => val); // timestamp without timezone
types.setTypeParser(1184, (val: string) => val); // timestamp with timezone

let pool: Pool | null = null;

function getOrCreatePool(): Pool {
  if (!pool || pool.ended) {
    pool = new Pool({
      connectionString: config.database.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export const EXPECTED_TABLES = [
  'roles',
  'users',
  'students',
  'categories',
  'workspace_sessions',
  'notifications',
  'activity_logs',
  'push_subscriptions',
  'faculty_notifications',
] as const;

export type PgDatabase = Pool;

export async function initDb(): Promise<void> {
  try {
    const p = getOrCreatePool();
    const client = await p.connect();
    client.release();
    logger.info('PostgreSQL database connected');
  } catch (err) {
    logger.error('Failed to connect to PostgreSQL', { error: (err as Error).message });
    throw err;
  }
}

export function getDb(): Pool {
  const p = getOrCreatePool();
  return p;
}

export function saveDb(): void {
  // PostgreSQL auto-commits each statement; no save needed
}

export async function closeDb(): Promise<void> {
  if (pool) {
    if (!pool.ended) await pool.end();
    pool = null;
    logger.info('PostgreSQL database connection closed');
  }
}

export async function validateDb(): Promise<void> {
  const database = getDb();
  const result = await database.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`
  );
  const existingTables: string[] = result.rows.map(
    (row: { table_name: string }) => row.table_name
  );

  const missing = EXPECTED_TABLES.filter((t) => !existingTables.includes(t));
  if (missing.length > 0) {
    throw new Error(
      `Database integrity check failed. Missing tables: ${missing.join(', ')}`
    );
  }
  logger.info('Database integrity check passed');
}

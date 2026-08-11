import { describe, it, expect, beforeAll } from 'vitest';
import { initDb, closeDb, getDb } from '../src/db';
import { migrate } from '../src/db/migrate';

describe('database migration (google_sub)', () => {
  beforeAll(async () => {
    await initDb();
  });

  it('adds users.google_sub as a nullable unique column', async () => {
    const db = getDb();
    const columns = await db.query(
      `SELECT column_name, is_nullable, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'google_sub'`
    );
    expect(columns.rows).toHaveLength(1);
    expect(columns.rows[0].is_nullable).toBe('YES');
    expect(columns.rows[0].data_type).toBe('text');
  });

  it('creates a unique index on users.google_sub', async () => {
    const db = getDb();
    const indexes = await db.query(
      `SELECT indexname, indexdef
       FROM pg_indexes
       WHERE schemaname = 'public' AND tablename = 'users' AND indexname = 'idx_users_google_sub'`
    );
    expect(indexes.rows).toHaveLength(1);
    expect(indexes.rows[0].indexdef).toContain('UNIQUE');
    expect(indexes.rows[0].indexdef).toContain('google_sub');
  });

  it('is idempotent — running migrate again does not error', async () => {
    await expect(migrate({ skipClose: true })).resolves.toBeUndefined();
  });

  it('allows multiple legacy users with NULL google_sub and rejects duplicate non-null values', async () => {
    const db = getDb();
    const emailSuffix = `migration-${Date.now()}`;
    const first = await db.query(
      `INSERT INTO users (email, name, role_id, status, google_sub)
       VALUES ($1, 'Migration Null One', 'student', 'active', NULL)
       RETURNING id`,
      [`${emailSuffix}-null1@vnrvjiet.in`]
    );
    const second = await db.query(
      `INSERT INTO users (email, name, role_id, status, google_sub)
       VALUES ($1, 'Migration Null Two', 'student', 'active', NULL)
       RETURNING id`,
      [`${emailSuffix}-null2@vnrvjiet.in`]
    );
    const bound = await db.query(
      `INSERT INTO users (email, name, role_id, status, google_sub)
       VALUES ($1, 'Migration Bound', 'student', 'active', $2)
       RETURNING id`,
      [`${emailSuffix}-bound@vnrvjiet.in`, 'migration-unique-sub']
    );

    await expect(
      db.query(
        `INSERT INTO users (email, name, role_id, status, google_sub)
         VALUES ($1, 'Migration Dup', 'student', 'active', 'migration-unique-sub')`,
        [`${emailSuffix}-dup@vnrvjiet.in`]
      )
    ).rejects.toThrow();

    await db.query(`DELETE FROM users WHERE id = ANY($1)`, [
      [first.rows[0].id, second.rows[0].id, bound.rows[0].id],
    ]);
  });

  afterAll(async () => {
    await closeDb();
  });
});

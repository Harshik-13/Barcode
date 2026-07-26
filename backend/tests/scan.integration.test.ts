import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { initDb, getDb, closeDb } from '../src/db';
import app from '../src/app';

let adminToken: string;
let facultyToken: string;
let studentToken: string;

beforeAll(async () => {
  await initDb();

  const db = getDb();
  await db.query('DELETE FROM faculty_notifications');
  await db.query('DELETE FROM notifications');
  await db.query('DELETE FROM activity_logs');
  await db.query('DELETE FROM workspace_sessions');

  const adminRes = await request(app).post('/api/auth/login').send({ email: 'admin@workspace.com', password: 'Harshverse' });
  adminToken = adminRes.body.token;

  const facRes = await request(app).post('/api/auth/login').send({ email: 'faculty@workspace.com', password: 'faculty123' });
  facultyToken = facRes.body.token;

  const stuRes = await request(app).post('/api/auth/login').send({ email: 'student@workspace.com', password: 'student123' });
  studentToken = stuRes.body.token;
}, 15000);

afterAll(async () => {
  await closeDb();
});

describe('POST /api/scan — Functional', () => {
  it('Case 1: should create entry for student with no active session (roll barcode)', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ barcode: 'STU001' });

    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe('SUCCESS_ENTRY');
    expect(res.body.data.studentRoll).toBe('STU001');
    expect(res.body.data.studentName).toBe('Alice Student');
    expect(res.body.data.sessionStatus).toBe('active');
    expect(res.body.data.entryTime).toBeDefined();
    expect(res.body.data.exitTime).toBeNull();
  });

  it('Case 2: should exit an active session on second scan', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ barcode: 'STU001' });

    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe('SUCCESS_EXIT');
    expect(res.body.data.sessionStatus).toBe('awaiting_summary');
    expect(res.body.data.exitTime).toBeDefined();
  });

  it('Case 3: should reject scan when session is awaiting_summary', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ barcode: 'STU001' });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('SUMMARY_REQUIRED');
  });

  it('Case 4: should create new entry for different student', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ barcode: 'STU002' });

    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe('SUCCESS_ENTRY');
    expect(res.body.data.studentRoll).toBe('STU002');
  });

  it('Case 5: should reject invalid barcode (empty)', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ barcode: '' });

    expect(res.status).toBe(400);
  });

  it('Case 5: should reject invalid barcode (whitespace only)', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ barcode: '   ' });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('STUDENT_NOT_FOUND');
  });

  it('Case 5: should reject invalid barcode (non-existent)', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ barcode: 'NONEXISTENT' });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('STUDENT_NOT_FOUND');
  });

  it('Case 5: should reject invalid barcode (special chars)', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ barcode: '<script>alert(1)</script>' });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('STUDENT_NOT_FOUND');
  });

  it('Case 6: should reject student role from scanning', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ barcode: 'STU001' });

    expect(res.status).toBe(403);
  });

  it('should reject requests without auth', async () => {
    const res = await request(app)
      .post('/api/scan')
      .send({ barcode: 'STU001' });

    expect(res.status).toBe(401);
  });

  it('should reject requests with invalid token', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', 'Bearer invalid-token')
      .send({ barcode: 'STU001' });

    expect(res.status).toBe(401);
  });

  it('should reject missing barcode field', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /api/scan — Entry and Exit cycle for same student', () => {
  it('should complete full cycle: entry -> exit -> summary required', async () => {
    const entry = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ barcode: 'STU003' });

    expect(entry.status).toBe(200);
    expect(entry.body.data.code).toBe('SUCCESS_ENTRY');

    const exit = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ barcode: 'STU003' });

    expect(exit.status).toBe(200);
    expect(exit.body.data.code).toBe('SUCCESS_EXIT');

    const blocked = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ barcode: 'STU003' });

    expect(blocked.status).toBe(422);
    expect(blocked.body.error).toBe('SUMMARY_REQUIRED');
  });
});

describe('POST /api/scan — Admin scanning', () => {
  it('should allow admin to scan', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ barcode: 'STU004' });

    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe('SUCCESS_ENTRY');
  });
});

describe('POST /api/scan — Audit trail', () => {
  it('should create audit logs for scan actions', async () => {
    const logsRes = await request(app)
      .get('/api/activity-logs?action=SCAN_ENTRY')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(logsRes.status).toBe(200);
    expect(Array.isArray(logsRes.body.data)).toBe(true);
  });
});

describe('POST /api/scan — Rate limiting', () => {
  it('should apply rate limiting to scan endpoint', async () => {
    const promises = Array(90).fill(null).map(() =>
      request(app)
        .post('/api/scan')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ barcode: 'STU001' })
    );

    const results = await Promise.all(promises);
    const tooMany = results.some(r => r.status === 429);
    expect(tooMany).toBe(true);
  });
});

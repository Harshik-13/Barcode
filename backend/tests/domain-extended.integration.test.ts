import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { initDb, closeDb, getDb } from '../src/db';
import app from '../src/app';

let adminToken: string;
let facultyToken: string;
let studentToken: string;

const adminLogin = () => request(app).post('/api/auth/login').send({ email: 'admin@workspace.com', password: 'admin123' });
const facultyLogin = () => request(app).post('/api/auth/login').send({ email: 'faculty@workspace.com', password: 'faculty123' });
const studentLogin = () => request(app).post('/api/auth/login').send({ email: 'student@workspace.com', password: 'student123' });

beforeAll(async () => {
  await initDb();

  const db = getDb();
  await db.query('DELETE FROM faculty_notifications');
  await db.query('DELETE FROM notifications');
  await db.query('DELETE FROM activity_logs');
  await db.query('DELETE FROM workspace_sessions');
  await db.query('DELETE FROM users WHERE email IN ($1, $2)', ['newfaculty@test.com', 'updated@test.com']);

  const adminRes = await adminLogin();
  adminToken = adminRes.body.token;

  const facRes = await facultyLogin();
  facultyToken = facRes.body.token;

  const stuRes = await studentLogin();
  studentToken = stuRes.body.token;
}, 15000);

afterAll(async () => {
  await closeDb();
});

describe('Faculty Management API', () => {
  let facultyId: number;

  it('GET /api/faculty — should list faculty as admin', async () => {
    const res = await request(app).get('/api/faculty').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/faculty — should reject non-admin', async () => {
    const res1 = await request(app).get('/api/faculty').set('Authorization', `Bearer ${facultyToken}`);
    expect(res1.status).toBe(403);
    const res2 = await request(app).get('/api/faculty').set('Authorization', `Bearer ${studentToken}`);
    expect(res2.status).toBe(403);
  });

  it('GET /api/faculty — should require auth', async () => {
    const res = await request(app).get('/api/faculty');
    expect(res.status).toBe(401);
  });

  it('POST /api/faculty — should create faculty as admin', async () => {
    const res = await request(app).post('/api/faculty').set('Authorization', `Bearer ${adminToken}`).send({ email: 'newfaculty@test.com', name: 'New Faculty' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('New Faculty');
    expect(res.body.data.email).toBe('newfaculty@test.com');
    expect(res.body.data.status).toBe('invited');
    facultyId = res.body.data.id;
  });

  it('POST /api/faculty — should reject duplicate email', async () => {
    const res = await request(app).post('/api/faculty').set('Authorization', `Bearer ${adminToken}`).send({ email: 'newfaculty@test.com', name: 'Duplicate' });
    expect(res.status).toBe(409);
  });

  it('POST /api/faculty — should reject non-admin', async () => {
    const res = await request(app).post('/api/faculty').set('Authorization', `Bearer ${facultyToken}`).send({ email: 'fail@test.com', name: 'Fail' });
    expect(res.status).toBe(403);
  });

  it('POST /api/faculty — should reject missing email', async () => {
    const res = await request(app).post('/api/faculty').set('Authorization', `Bearer ${adminToken}`).send({ name: 'No Email' });
    expect(res.status).toBe(400);
  });

  it('POST /api/faculty — should reject invalid email', async () => {
    const res = await request(app).post('/api/faculty').set('Authorization', `Bearer ${adminToken}`).send({ email: 'not-an-email', name: 'Bad Email' });
    expect(res.status).toBe(400);
  });

  it('GET /api/faculty/:id — should get faculty by id', async () => {
    const res = await request(app).get(`/api/faculty/${facultyId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('New Faculty');
  });

  it('GET /api/faculty/:id — should return 404 for unknown', async () => {
    const res = await request(app).get('/api/faculty/99999').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('PUT /api/faculty/:id — should update faculty', async () => {
    const res = await request(app).put(`/api/faculty/${facultyId}`).set('Authorization', `Bearer ${adminToken}`).send({ name: 'Updated Faculty', email: 'updated@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Faculty');
    expect(res.body.data.email).toBe('updated@test.com');
  });

  it('PUT /api/faculty/:id — should reject non-admin', async () => {
    const res = await request(app).put(`/api/faculty/${facultyId}`).set('Authorization', `Bearer ${facultyToken}`).send({ name: 'Hack', email: 'hack@test.com' });
    expect(res.status).toBe(403);
  });

  it('PATCH /api/faculty/:id/deactivate — should deactivate faculty', async () => {
    const res = await request(app).patch(`/api/faculty/${facultyId}/deactivate`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('deactivated');
  });

  it('PATCH /api/faculty/:id/deactivate — should reject non-admin', async () => {
    const res = await request(app).patch(`/api/faculty/${facultyId}/deactivate`).set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(403);
  });

  it('PATCH /api/faculty/:id/activate — should reactivate faculty', async () => {
    const res = await request(app).patch(`/api/faculty/${facultyId}/activate`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('active');
  });

  it('GET /api/faculty — should support status filter', async () => {
    const res = await request(app).get('/api/faculty?status=active').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((f: any) => f.status === 'active')).toBe(true);
  });
});

describe('Dashboard API', () => {
  it('GET /api/dashboard/stats — should return stats as admin', async () => {
    const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalStudents');
    expect(res.body.data).toHaveProperty('enrolledStudents');
    expect(res.body.data).toHaveProperty('activeFaculty');
    expect(res.body.data).toHaveProperty('activeCategories');
    expect(res.body.data).toHaveProperty('activeSessions');
  });

  it('GET /api/dashboard/stats — should reject non-admin', async () => {
    const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/sessions/stats/live — should return live stats for faculty', async () => {
    const res = await request(app).get('/api/sessions/stats/live').set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('count');
    expect(Array.isArray(res.body.data.students)).toBe(true);
  });

  it('GET /api/sessions/stats/live — should reject student', async () => {
    const res = await request(app).get('/api/sessions/stats/live').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/sessions/stats/live — should require auth', async () => {
    const res = await request(app).get('/api/sessions/stats/live');
    expect(res.status).toBe(401);
  });
});

describe('Category Usage API', () => {
  it('GET /api/categories/:id/usage — should return usage for active category', async () => {
    const res = await request(app).get('/api/categories/1/usage').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('usageCount');
    expect(res.body.data).toHaveProperty('deletionAllowed');
    expect(res.body.data).toHaveProperty('blockedReason');
  });

  it('GET /api/categories/:id/usage — should reject non-admin', async () => {
    const res = await request(app).get('/api/categories/1/usage').set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/categories/:id/usage — should return 404 for unknown', async () => {
    const res = await request(app).get('/api/categories/99999/usage').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe('Student Suspend API', () => {
  it('PATCH /api/students/:id/suspend — should reject faculty', async () => {
    const res = await request(app).patch('/api/students/2/suspend').set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(403);
  });

  it('PATCH /api/students/:id/suspend — should return 404 for unknown', async () => {
    const res = await request(app).patch('/api/students/99999/suspend').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe('Session Manual Exit & Override API', () => {
  let sessionId: number;

  it('POST /api/sessions — should create a session for testing', async () => {
    const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${facultyToken}`).send({ studentId: 2 });
    expect(res.status).toBe(201);
    sessionId = res.body.data.id;
  });

  it('PATCH /api/sessions/:id/start — should start the session', async () => {
    const res = await request(app).patch(`/api/sessions/${sessionId}/start`).set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('active');
  });

  it('PATCH /api/sessions/:id/manual-exit — should perform manual exit', async () => {
    const res = await request(app).patch(`/api/sessions/${sessionId}/manual-exit`).set('Authorization', `Bearer ${facultyToken}`).send({ reason: 'Student left early', categoryId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('awaiting_summary');
    expect(res.body.data.isManualExit).toBe(true);
    expect(res.body.data.manualExitReason).toBe('Student left early');
  });

  it('PATCH /api/sessions/:id/manual-exit — should reject missing reason', async () => {
    const res = await request(app).patch(`/api/sessions/${sessionId}/manual-exit`).set('Authorization', `Bearer ${facultyToken}`).send({});
    expect(res.status).toBe(400);
  });

  it('PATCH /api/sessions/:id/manual-exit — should reject student', async () => {
    const res = await request(app).patch(`/api/sessions/${sessionId}/manual-exit`).set('Authorization', `Bearer ${studentToken}`).send({ reason: 'test' });
    expect(res.status).toBe(403);
  });

  it('PATCH /api/sessions/:id/override — should override session as admin', async () => {
    const res = await request(app).patch(`/api/sessions/${sessionId}/override`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'completed', summary: 'Admin override', reason: 'Manual correction' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.summary).toBe('Admin override');
    expect(res.body.data.overrideReason).toBe('Manual correction');
  });

  it('PATCH /api/sessions/:id/override — should reject missing reason', async () => {
    const res = await request(app).patch(`/api/sessions/${sessionId}/override`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'completed' });
    expect(res.status).toBe(400);
  });

  it('PATCH /api/sessions/:id/override — should reject faculty', async () => {
    const res = await request(app).patch(`/api/sessions/${sessionId}/override`).set('Authorization', `Bearer ${facultyToken}`).send({ status: 'completed', reason: 'test' });
    expect(res.status).toBe(403);
  });
});

describe('Notifications API', () => {
  it('GET /api/notifications — should list notifications for student', async () => {
    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/notifications — should require auth', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('GET /api/notifications/unread-count — should return count', async () => {
    const res = await request(app).get('/api/notifications/unread-count').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.count).toBe('number');
  });

  it('PATCH /api/notifications/:id/read — should mark notification as read', async () => {
    const list = await request(app).get('/api/notifications').set('Authorization', `Bearer ${studentToken}`);
    if (list.body.data.length > 0) {
      const notifId = list.body.data[0].id;
      const res = await request(app).patch(`/api/notifications/${notifId}/read`).set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    }
  });

  it('PATCH /api/notifications/read-all — should mark all as read', async () => {
    const res = await request(app).patch('/api/notifications/read-all').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);
  });

  it('POST /api/notifications/broadcast — should broadcast as admin', async () => {
    const res = await request(app).post('/api/notifications/broadcast').set('Authorization', `Bearer ${adminToken}`).send({ type: 'broadcast', message: 'Test broadcast to all students' });
    expect(res.status).toBe(200);
    expect(res.body.data.sentTo).toBeGreaterThan(0);
  });

  it('POST /api/notifications/broadcast — should reject non-admin', async () => {
    const res = await request(app).post('/api/notifications/broadcast').set('Authorization', `Bearer ${facultyToken}`).send({ type: 'broadcast', message: 'Should fail' });
    expect(res.status).toBe(403);
  });

  it('POST /api/notifications/broadcast — should reject missing message', async () => {
    const res = await request(app).post('/api/notifications/broadcast').set('Authorization', `Bearer ${adminToken}`).send({ type: 'broadcast' });
    expect(res.status).toBe(400);
  });

  it('GET /api/faculty-notifications — should list faculty notifications', async () => {
    const res = await request(app).get('/api/faculty-notifications').set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/faculty-notifications — should reject student', async () => {
    const res = await request(app).get('/api/faculty-notifications').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('PATCH /api/faculty-notifications/:id/read — should mark faculty notification as read', async () => {
    const list = await request(app).get('/api/faculty-notifications').set('Authorization', `Bearer ${facultyToken}`);
    if (list.body.data.length > 0) {
      const notifId = list.body.data[0].id;
      const res = await request(app).patch(`/api/faculty-notifications/${notifId}/read`).set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    }
  });
});
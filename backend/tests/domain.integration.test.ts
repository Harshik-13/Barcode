import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { initDb, closeDb } from '../src/db';
import app from '../src/app';

let adminToken: string;
let facultyToken: string;
let studentToken: string;

const adminLogin = () => request(app).post('/api/auth/login').send({ email: 'admin@workspace.com', password: 'admin123' });
const facultyLogin = () => request(app).post('/api/auth/login').send({ email: 'faculty@workspace.com', password: 'faculty123' });
const studentLogin = () => request(app).post('/api/auth/login').send({ email: 'student@workspace.com', password: 'student123' });

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-for-domain-tests';
  await initDb();

  const adminRes = await adminLogin();
  adminToken = adminRes.body.token;

  const facRes = await facultyLogin();
  facultyToken = facRes.body.token;

  const stuRes = await studentLogin();
  studentToken = stuRes.body.token;
}, 15000);

afterAll(() => {
  closeDb();
});

describe('GET /api/health', () => {
  it('should return 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Categories API', () => {
  let categoryId: number;

  it('GET /api/categories — should list categories', async () => {
    const res = await request(app).get('/api/categories').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
  });

  it('GET /api/categories — should require auth', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
  });

  it('POST /api/categories — should create category as admin', async () => {
    const res = await request(app).post('/api/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Testing', description: 'Test category' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Testing');
    expect(res.body.data.status).toBe('active');
    categoryId = res.body.data.id;
  });

  it('POST /api/categories — should reject duplicate name', async () => {
    const res = await request(app).post('/api/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Testing', description: 'Duplicate' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('DUPLICATE_CATEGORY');
  });

  it('POST /api/categories — should reject faculty', async () => {
    const res = await request(app).post('/api/categories').set('Authorization', `Bearer ${facultyToken}`).send({ name: 'FacultyCat', description: '' });
    expect(res.status).toBe(403);
  });

  it('POST /api/categories — should reject student', async () => {
    const res = await request(app).post('/api/categories').set('Authorization', `Bearer ${studentToken}`).send({ name: 'StudentCat', description: '' });
    expect(res.status).toBe(403);
  });

  it('POST /api/categories — should reject missing name', async () => {
    const res = await request(app).post('/api/categories').set('Authorization', `Bearer ${adminToken}`).send({ description: 'No name' });
    expect(res.status).toBe(400);
  });

  it('GET /api/categories/:id — should get category by id', async () => {
    const res = await request(app).get(`/api/categories/${categoryId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Testing');
  });

  it('GET /api/categories/:id — should return 404 for unknown', async () => {
    const res = await request(app).get('/api/categories/99999').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('PUT /api/categories/:id — should update category as admin', async () => {
    const res = await request(app).put(`/api/categories/${categoryId}`).set('Authorization', `Bearer ${adminToken}`).send({ name: 'Testing Updated', description: 'Updated desc' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Testing Updated');
  });

  it('PATCH /api/categories/:id/archive — should archive category', async () => {
    const res = await request(app).patch(`/api/categories/${categoryId}/archive`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('archived');
  });
});

describe('Students API', () => {
  let studentId: number;

  it('GET /api/students — should list students', async () => {
    const res = await request(app).get('/api/students').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/students — should support pagination', async () => {
    const res = await request(app).get('/api/students?page=1&limit=1').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/students/lookup — should find student by roll', async () => {
    const res = await request(app).get('/api/students/lookup?q=STU001').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.roll).toBe('STU001');
  });

  it('GET /api/students/lookup — should return 404 for unknown', async () => {
    const res = await request(app).get('/api/students/lookup?q=XXXXXXXX').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/students/search — should search by name', async () => {
    const res = await request(app).get('/api/students/search?q=Alice').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/students — should create student as admin', async () => {
    const res = await request(app).post('/api/students').set('Authorization', `Bearer ${adminToken}`).send({ roll: 'STU005', name: 'Eve Student', email: 'eve@workspace.com' });
    expect(res.status).toBe(201);
    expect(res.body.data.roll).toBe('STU005');
    studentId = res.body.data.id;
  });

  it('POST /api/students — should reject duplicate roll', async () => {
    const res = await request(app).post('/api/students').set('Authorization', `Bearer ${adminToken}`).send({ roll: 'STU005', name: 'Duplicate', email: 'dup@workspace.com' });
    expect(res.status).toBe(409);
  });

  it('POST /api/students — should reject faculty', async () => {
    const res = await request(app).post('/api/students').set('Authorization', `Bearer ${facultyToken}`).send({ roll: 'STU099', name: 'Should Fail' });
    expect(res.status).toBe(403);
  });

  it('GET /api/students/:id — should get by id', async () => {
    const res = await request(app).get(`/api/students/${studentId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Eve Student');
  });

  it('PUT /api/students/:id — should update student', async () => {
    const res = await request(app).put(`/api/students/${studentId}`).set('Authorization', `Bearer ${adminToken}`).send({ name: 'Eve Updated', email: 'eve.new@workspace.com' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Eve Updated');
    expect(res.body.data.email).toBe('eve.new@workspace.com');
  });

  it('PATCH /api/students/:id/depart — should depart student', async () => {
    const res = await request(app).patch(`/api/students/${studentId}/depart`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('departed');
  });
});

describe('Sessions API', () => {
  let sessionId: number;

  it('POST /api/sessions — should create session as faculty', async () => {
    const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${facultyToken}`).send({ studentId: 1 });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('created');
    expect(res.body.data.studentId).toBe(1);
    sessionId = res.body.data.id;
  });

  it('POST /api/sessions — should reject duplicate active session', async () => {
    const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${facultyToken}`).send({ studentId: 1 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ACTIVE_SESSION_EXISTS');
  });

  it('POST /api/sessions — should reject student role', async () => {
    const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${studentToken}`).send({ studentId: 2 });
    expect(res.status).toBe(403);
  });

  it('POST /api/sessions — should reject missing studentId', async () => {
    const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${facultyToken}`).send({});
    expect(res.status).toBe(400);
  });

  it('PATCH /api/sessions/:id/exit — should exit session', async () => {
    const res = await request(app).patch(`/api/sessions/${sessionId}/exit`).set('Authorization', `Bearer ${facultyToken}`).send({ categoryId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('awaiting_summary');
    expect(res.body.data.exitTime).toBeDefined();
  });

  it('PATCH /api/sessions/:id/exit — should reject invalid transition', async () => {
    const res = await request(app).patch(`/api/sessions/${sessionId}/exit`).set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('INVALID_TRANSITION');
  });

  it('PATCH /api/sessions/:id/complete — should complete session', async () => {
    const res = await request(app).patch(`/api/sessions/${sessionId}/complete`).set('Authorization', `Bearer ${facultyToken}`).send({ summary: 'Completed work on feature X' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.summary).toBe('Completed work on feature X');
  });

  it('PATCH /api/sessions/:id/complete — should reject missing summary', async () => {
    const second = await request(app).post('/api/sessions').set('Authorization', `Bearer ${facultyToken}`).send({ studentId: 2 });
    const secondId = second.body.data.id;
    await request(app).patch(`/api/sessions/${secondId}/exit`).set('Authorization', `Bearer ${facultyToken}`);
    const res = await request(app).patch(`/api/sessions/${secondId}/complete`).set('Authorization', `Bearer ${facultyToken}`).send({});
    expect(res.status).toBe(400);
  });

  it('GET /api/sessions — should list sessions', async () => {
    const res = await request(app).get('/api/sessions').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/sessions — should filter by status', async () => {
    const res = await request(app).get('/api/sessions?status=completed').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((s: any) => s.status === 'completed')).toBe(true);
  });

  it('GET /api/sessions/:id — should get by id', async () => {
    const res = await request(app).get(`/api/sessions/${sessionId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(sessionId);
  });

  it('GET /api/sessions/active/:studentId — should return active session', async () => {
    const fresh = await request(app).post('/api/sessions').set('Authorization', `Bearer ${facultyToken}`).send({ studentId: 1 });
    await request(app).patch(`/api/sessions/${fresh.body.data.id}/start`).set('Authorization', `Bearer ${facultyToken}`);
    const res = await request(app).get('/api/sessions/active/1').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).not.toBeNull();
    expect(res.body.data.status).toBe('active');
  });

  it('GET /api/sessions/active/:studentId — should return null for no active', async () => {
    const res = await request(app).get('/api/sessions/active/99999').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it('PATCH /api/sessions/:id/archive — should archive session as admin', async () => {
    const res = await request(app).patch(`/api/sessions/${sessionId}/archive`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('archived');
  });

  it('PATCH /api/sessions/:id/archive — should reject faculty', async () => {
    const res = await request(app).patch(`/api/sessions/${sessionId}/archive`).set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/sessions — should require auth', async () => {
    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(401);
  });

  it('GET /students/:id/history — should return session history', async () => {
    const res = await request(app).get('/api/students/1/history').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Activity Logs API', () => {
  it('GET /api/activity-logs — should list logs as admin', async () => {
    const res = await request(app).get('/api/activity-logs').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/activity-logs — should reject faculty', async () => {
    const res = await request(app).get('/api/activity-logs').set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/activity-logs/recent — should return recent logs', async () => {
    const res = await request(app).get('/api/activity-logs/recent').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('Authorization edge cases', () => {
  it('should reject access to protected routes without token', async () => {
    const endpoints = ['/api/categories', '/api/students', '/api/sessions', '/api/activity-logs'];
    for (const ep of endpoints) {
      const res = await request(app).get(ep);
      expect(res.status).toBe(401);
    }
  });

  it('should reject access with invalid token', async () => {
    const res = await request(app).get('/api/categories').set('Authorization', 'Bearer totally-invalid-token');
    expect(res.status).toBe(401);
  });
});

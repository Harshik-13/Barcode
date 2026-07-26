import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { initDb, closeDb } from '../src/db';
import app from '../src/app';

beforeAll(async () => {
  await initDb();
}, 10000);

afterAll(async () => {
  await closeDb();
});

describe('POST /api/auth/login', () => {
  it('should login admin with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@workspace.com', password: 'Harshverse' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('admin@workspace.com');
    expect(res.body.user.role).toBe('admin');
  });

  it('should login faculty with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty@workspace.com', password: 'faculty123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('faculty');
  });

  it('should login student with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@workspace.com', password: 'student123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('student');
  });

  it('should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'test123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@workspace.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  it('should reject missing email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Harshverse' });

    expect(res.status).toBe(400);
  });

  it('should reject missing password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@workspace.com' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user with valid token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@workspace.com', password: 'Harshverse' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('admin@workspace.com');
    expect(res.body.role).toBe('admin');
  });

  it('should reject missing token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('MISSING_TOKEN');
  });

  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_TOKEN');
  });

  it('should reject expired token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsInR5cGUiOiJhZG1pbiIsImlhdCI6MTUwMDAwMDAwMCwiZXhwIjoxNTAwMDAwMDAwfQ.dummy');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('should logout successfully', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@workspace.com', password: 'Harshverse' });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('should reject logout without auth', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});

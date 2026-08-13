import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb, getDb, closeDb } from '../src/db';
import { setupGoogleAuth, cleanupGoogleAuth, TestAuthTokens } from './helpers/googleOAuth';

let tokens: TestAuthTokens;

beforeAll(async () => {
  await initDb();
  tokens = await setupGoogleAuth();
}, 30000);

afterAll(async () => {
  await cleanupGoogleAuth();
  await closeDb();
});

describe('POST /api/auth/google', () => {
  it('should sign in an existing admin via Google', async () => {
    const { default: request } = await import('supertest');
    const { default: app } = await import('../src/app');
    const { signGoogleToken, baseClaims } = await import('./helpers/googleOAuth');

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'admin.google@vnrvjiet.in', sub: 'sub-admin-scan' })) });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('admin.google@vnrvjiet.in');
    expect(res.body.user.role).toBe('admin');
  });

  it('should sign in an existing student via Google', async () => {
    const { default: request } = await import('supertest');
    const { default: app } = await import('../src/app');
    const { signGoogleToken, baseClaims } = await import('./helpers/googleOAuth');

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'stu001@vnrvjiet.in', sub: 'sub-student-scan' })) });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('student');
  });

  it('should reject unverified email', async () => {
    const { default: request } = await import('supertest');
    const { default: app } = await import('../src/app');
    const { signGoogleToken, baseClaims } = await import('./helpers/googleOAuth');

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email_verified: false, sub: 'sub-unverified' })) });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('EMAIL_NOT_VERIFIED');
  });

  it('should reject non-allowlisted domain', async () => {
    const { default: request } = await import('supertest');
    const { default: app } = await import('../src/app');
    const { signGoogleToken, baseClaims } = await import('./helpers/googleOAuth');

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'someone@gmail.com', sub: 'sub-gmail' })) });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('DOMAIN_NOT_ALLOWED');
  });

  it('should reject missing credential', async () => {
    const { default: request } = await import('supertest');
    const { default: app } = await import('../src/app');

    const res = await request(app).post('/api/auth/google').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user with valid token', async () => {
    const { default: request } = await import('supertest');
    const { default: app } = await import('../src/app');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer ' + tokens.adminToken);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('admin.google@vnrvjiet.in');
    expect(res.body.role).toBe('admin');
  });

  it('should reject missing token', async () => {
    const { default: request } = await import('supertest');
    const { default: app } = await import('../src/app');

    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('MISSING_TOKEN');
  });

  it('should reject invalid token', async () => {
    const { default: request } = await import('supertest');
    const { default: app } = await import('../src/app');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_TOKEN');
  });
});

describe('POST /api/auth/logout', () => {
  it('should logout successfully', async () => {
    const { default: request } = await import('supertest');
    const { default: app } = await import('../src/app');

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer ' + tokens.adminToken);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('should reject logout without auth', async () => {
    const { default: request } = await import('supertest');
    const { default: app } = await import('../src/app');

    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});

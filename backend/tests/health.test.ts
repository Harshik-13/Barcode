import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { initDb, closeDb } from '../src/db';
import app from '../src/app';

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  await initDb();
}, 10000);

afterAll(() => {
  closeDb();
});

describe('GET /api/health', () => {
  it('should return 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('should include security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';
import type { AddressInfo } from 'net';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { initDb, closeDb, getDb } from '../src/db';
import app from '../src/app';

const GOOGLE_ISSUER = 'https://accounts.google.com';
const AUDIENCE = 'test-google-client-id';

const TEST_EMAILS = [
  'faculty.google@vnrvjiet.in',
  'admin.google@vnrvjiet.in',
  'student.google@vnrvjiet.in',
  'suspended.google@vnrvjiet.in',
  'unknown.google@vnrvjiet.in',
  'faculty-bind.google@vnrvjiet.in',
];

const keyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const privateKeyPem = keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
const publicJwk = keyPair.publicKey.export({ format: 'jwk' }) as { kty: string; n: string; e: string };
const jwks = { keys: [{ ...publicJwk, kid: 'test-key-1', alg: 'RS256', use: 'sig' }] };

let jwksServer: http.Server;

function signGoogleToken(payload: Record<string, unknown>, options: jwt.SignOptions = {}): string {
  return jwt.sign(payload, privateKeyPem, {
    algorithm: 'RS256',
    header: { kid: 'test-key-1' },
    issuer: GOOGLE_ISSUER,
    audience: AUDIENCE,
    expiresIn: '15m',
    ...options,
  });
}

function baseClaims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sub: 'google-test-sub',
    email: 'faculty.google@vnrvjiet.in',
    email_verified: true,
    name: 'Google Test Faculty',
    picture: 'https://example.com/picture.png',
    ...overrides,
  };
}

beforeAll(async () => {
  jwksServer = http.createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(jwks));
  });
  await new Promise<void>((resolve) => jwksServer.listen(0, '127.0.0.1', resolve));
  const address = jwksServer.address() as AddressInfo;
  process.env.GOOGLE_JWKS_URI = `http://127.0.0.1:${address.port}/certs`;

  await initDb();
  const db = getDb();

  await db.query('DELETE FROM students WHERE email = ANY($1)', [TEST_EMAILS]);
  await db.query('DELETE FROM users WHERE email = ANY($1)', [TEST_EMAILS]);

  await db.query(
    "INSERT INTO users (email, name, role_id, status) VALUES ('faculty.google@vnrvjiet.in', 'Google Test Faculty', 'faculty', 'active')"
  );
  await db.query(
    "INSERT INTO users (email, name, role_id, status) VALUES ('admin.google@vnrvjiet.in', 'Google Test Admin', 'admin', 'active')"
  );
  await db.query(
    "INSERT INTO users (email, name, role_id, status) VALUES ('student.google@vnrvjiet.in', 'Google Test Student', 'student', 'active')"
  );
  await db.query(
    "INSERT INTO students (roll, name, email, branch, section, status) VALUES ('GOOGLE01', 'Google Test Student', 'student.google@vnrvjiet.in', 'CSE', 'A', 'enrolled')"
  );
  await db.query(
    "INSERT INTO users (email, name, role_id, status) VALUES ('suspended.google@vnrvjiet.in', 'Google Test Suspended', 'student', 'suspended')"
  );
  await db.query(
    "INSERT INTO users (email, name, role_id, status) VALUES ('faculty-bind.google@vnrvjiet.in', 'Google Test Faculty Bind', 'faculty', 'active')"
  );
}, 15000);

afterAll(async () => {
  const db = getDb();
  await db.query('DELETE FROM students WHERE email = ANY($1)', [TEST_EMAILS]);
  await db.query('DELETE FROM users WHERE email = ANY($1)', [TEST_EMAILS]);
  await new Promise<void>((resolve) => jwksServer.close(() => resolve()));
  delete process.env.GOOGLE_JWKS_URI;
  await closeDb();
});

describe('POST /api/auth/google — successful sign-in', () => {
  it('should sign in an existing faculty with a verified @vnrvjiet.in token', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims()) });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({
      id: expect.any(Number),
      name: 'Google Test Faculty',
      role: 'faculty',
      email: 'faculty.google@vnrvjiet.in',
    });
  });

  it('should sign in an existing admin', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'admin.google@vnrvjiet.in', sub: 'sub-admin' })) });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
  });

  it('should sign in an existing student and return the linked studentId', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'student.google@vnrvjiet.in', sub: 'sub-student' })) });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('student');
    expect(typeof res.body.user.studentId).toBe('number');
  });

  it('should issue a JWT that works with protected routes', async () => {
    const login = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ sub: 'sub-me' })) });

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(me.status).toBe(200);
    expect(me.body.email).toBe('faculty.google@vnrvjiet.in');
  });
});

describe('POST /api/auth/google — rejections', () => {
  it('should auto-provision a student with a valid-domain email and no existing account', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'unknown.google@vnrvjiet.in', sub: 'sub-unknown' })) });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('student');
    expect(res.body.needsOnboarding).toBe(true);
  });

  it('should reject non-allowlisted domains', async () => {
    const gmail = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'someone@gmail.com', sub: 'sub-gmail' })) });
    expect(gmail.status).toBe(401);
    expect(gmail.body.error).toBe('DOMAIN_NOT_ALLOWED');

    const other = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'someone@other.edu', sub: 'sub-other' })) });
    expect(other.status).toBe(401);
    expect(other.body.error).toBe('DOMAIN_NOT_ALLOWED');
  });

  it('should accept hd when it matches and reject when it does not', async () => {
    const ok = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ hd: 'vnrvjiet.in', sub: 'sub-hd-ok' })) });
    expect(ok.status).toBe(200);

    const bad = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ hd: 'evil.com', sub: 'sub-hd-bad' })) });
    expect(bad.status).toBe(401);
    expect(bad.body.error).toBe('DOMAIN_NOT_ALLOWED');
  });

  it('should reject unverified email claims', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email_verified: false, sub: 'sub-unverified' })) });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('EMAIL_NOT_VERIFIED');
  });

  it('should reject tokens with the wrong audience', async () => {
    const token = signGoogleToken(baseClaims({ sub: 'sub-aud' }), { audience: 'some-other-client-id' });
    const res = await request(app).post('/api/auth/google').send({ credential: token });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_TOKEN');
  });

  it('should reject tokens with a non-Google issuer', async () => {
    const token = signGoogleToken(baseClaims({ sub: 'sub-iss' }), { issuer: 'https://evil.example' });
    const res = await request(app).post('/api/auth/google').send({ credential: token });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_TOKEN');
  });

  it('should reject expired tokens', async () => {
    const token = signGoogleToken(baseClaims({ sub: 'sub-exp' }), { expiresIn: -60 });
    const res = await request(app).post('/api/auth/google').send({ credential: token });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_TOKEN');
  });

  it('should reject tokens that are not yet valid (future nbf)', async () => {
    const token = jwt.sign(
      baseClaims({ sub: 'sub-nbf' }),
      privateKeyPem,
      {
        algorithm: 'RS256',
        header: { kid: 'test-key-1' },
        issuer: GOOGLE_ISSUER,
        audience: AUDIENCE,
        expiresIn: '15m',
        notBefore: '600s',
      }
    );
    const res = await request(app).post('/api/auth/google').send({ credential: token });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_TOKEN');
  });

  it('should reject a token with a corrupted signature', async () => {
    const valid = signGoogleToken(baseClaims({ sub: 'sub-tamper' }));
    const corrupted = valid.slice(0, -4) + 'AAAA';
    const res = await request(app).post('/api/auth/google').send({ credential: corrupted });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_TOKEN');
  });

  it('should reject a random non-token string', async () => {
    const res = await request(app).post('/api/auth/google').send({ credential: 'not-a-real-google-token' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_TOKEN');
  });

  it('should reject an account that is not active', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'suspended.google@vnrvjiet.in', sub: 'sub-susp' })) });

    expect(res.status).toBe(403);
  });

  it('should reject requests without a credential', async () => {
    const res = await request(app).post('/api/auth/google').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });
});

describe('Google login audit trail', () => {
  it('should record GOOGLE_LOGIN for successes', async () => {
    const db = getDb();
    const result = await db.query("SELECT COUNT(*) as count FROM activity_logs WHERE action = 'GOOGLE_LOGIN'");
    expect(parseInt(result.rows[0].count, 10)).toBeGreaterThan(0);
  });

  it('should record GOOGLE_LOGIN_REJECTED_DOMAIN for domain rejections', async () => {
    const db = getDb();
    const result = await db.query("SELECT COUNT(*) as count FROM activity_logs WHERE action = 'GOOGLE_LOGIN_REJECTED_DOMAIN'");
    expect(parseInt(result.rows[0].count, 10)).toBeGreaterThan(0);
  });

  it('should record GOOGLE_LOGIN_FAILED for verification and lookup failures', async () => {
    const db = getDb();
    const result = await db.query("SELECT COUNT(*) as count FROM activity_logs WHERE action = 'GOOGLE_LOGIN_FAILED'");
    expect(parseInt(result.rows[0].count, 10)).toBeGreaterThan(0);
  });
});

describe('POST /api/auth/google — student provisioning', () => {
  it('should return needsOnboarding: true for a newly provisioned student', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'unknown.google@vnrvjiet.in', sub: 'sub-unknown' })) });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('student');
    expect(res.body.needsOnboarding).toBe(true);
    expect(res.body.user.studentId).toBeDefined();
  });

  it('should return needsOnboarding: false for an existing student with branch set', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'student.google@vnrvjiet.in', sub: 'sub-student' })) });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('student');
    expect(res.body.needsOnboarding).toBeFalsy();
  });

  it('should bind google_sub on first login and use it on subsequent logins', async () => {
    const res1 = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'faculty-bind.google@vnrvjiet.in', sub: 'sub-faculty-binding' })) });
    expect(res1.status).toBe(200);

    const db = getDb();
    const result = await db.query("SELECT google_sub FROM users WHERE email = 'faculty-bind.google@vnrvjiet.in'");
    expect(result.rows[0].google_sub).toBe('sub-faculty-binding');

    const res2 = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'faculty-bind.google@vnrvjiet.in', sub: 'sub-faculty-binding' })) });
    expect(res2.status).toBe(200);
  });
});

describe('POST /api/auth/onboarding', () => {
  it('should complete onboarding for a student who needs it', async () => {
    const loginRes = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'unknown.google@vnrvjiet.in', sub: 'sub-onboard' })) });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;

    const statusRes = await request(app)
      .get('/api/auth/onboarding/status')
      .set('Authorization', `Bearer ${token}`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.needsOnboarding).toBe(true);

    const onbRes = await request(app)
      .post('/api/auth/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ branch: 'CSE', section: 'B', hostel: 'BH1' });
    expect(onbRes.status).toBe(200);

    const statusRes2 = await request(app)
      .get('/api/auth/onboarding/status')
      .set('Authorization', `Bearer ${token}`);
    expect(statusRes2.status).toBe(200);
    expect(statusRes2.body.needsOnboarding).toBe(false);
  });

  it('should reject onboarding for non-students', async () => {
    const loginRes = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'faculty.google@vnrvjiet.in', sub: 'sub-faculty-onboard' })) });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;

    const onbRes = await request(app)
      .post('/api/auth/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ branch: 'CSE', section: 'A' });
    expect(onbRes.status).toBe(403);
  });

  it('should reject if onboarding already completed', async () => {
    const loginRes = await request(app)
      .post('/api/auth/google')
      .send({ credential: signGoogleToken(baseClaims({ email: 'student.google@vnrvjiet.in', sub: 'sub-student-reonboard' })) });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;

    const onbRes = await request(app)
      .post('/api/auth/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ branch: 'ECE', section: 'C' });
    expect(onbRes.status).toBe(400);
    expect(onbRes.body.error).toBe('ALREADY_COMPLETED');
  });
});

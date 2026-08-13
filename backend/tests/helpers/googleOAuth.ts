import http from 'http';
import type { AddressInfo } from 'net';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getDb } from '../../src/db';

const GOOGLE_ISSUER = 'https://accounts.google.com';
const AUDIENCE = 'test-google-client-id';

const keyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const privateKeyPem = keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
const publicJwk = keyPair.publicKey.export({ format: 'jwk' }) as { kty: string; n: string; e: string };

let jwksServer: http.Server | undefined;

export function signGoogleToken(payload: Record<string, unknown>, options: jwt.SignOptions = {}): string {
  return jwt.sign(payload, privateKeyPem, {
    algorithm: 'RS256',
    header: { kid: 'test-key-1' },
    issuer: GOOGLE_ISSUER,
    audience: AUDIENCE,
    expiresIn: '15m',
    ...options,
  });
}

export function baseClaims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sub: 'google-test-sub',
    email: 'faculty.google@vnrvjiet.in',
    email_verified: true,
    name: 'Google Test Faculty',
    picture: 'https://example.com/picture.png',
    ...overrides,
  };
}

async function startJwksServer(): Promise<void> {
  if (jwksServer) return;

  jwksServer = http.createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ keys: [{ ...publicJwk, kid: 'test-key-1', alg: 'RS256', use: 'sig' }] }));
  });

  await new Promise<void>((resolve) => jwksServer!.listen(0, '127.0.0.1', resolve));
  const address = jwksServer!.address() as AddressInfo;
  process.env.GOOGLE_JWKS_URI = 'http://127.0.0.1:' + address.port + '/certs';
}

async function stopJwksServer(): Promise<void> {
  if (jwksServer) {
    await new Promise<void>((resolve) => jwksServer!.close(() => resolve()));
    jwksServer = undefined;
    delete process.env.GOOGLE_JWKS_URI;
  }
}

export interface TestAuthTokens {
  adminToken: string;
  facultyToken: string;
  studentToken: string;
}

export async function setupGoogleAuth(): Promise<TestAuthTokens> {
  await startJwksServer();

  const { default: app } = await import('../../src/app');
  const { default: request } = await import('supertest');

  const db = getDb();

  await db.query(
    "INSERT INTO users (email, name, role_id, status) VALUES ('admin.google@vnrvjiet.in', 'Test Admin', 'admin', 'active') ON CONFLICT (email) DO NOTHING"
  );
  await db.query(
    "INSERT INTO users (email, name, role_id, status) VALUES ('faculty.google@vnrvjiet.in', 'Test Faculty', 'faculty', 'active') ON CONFLICT (email) DO NOTHING"
  );

  const adminRes = await request(app)
    .post('/api/auth/google')
    .send({ credential: signGoogleToken(baseClaims({ email: 'admin.google@vnrvjiet.in', sub: 'sub-admin-scan' })) });

  const facultyRes = await request(app)
    .post('/api/auth/google')
    .send({ credential: signGoogleToken(baseClaims({ email: 'faculty.google@vnrvjiet.in', sub: 'sub-faculty-scan' })) });

  const studentRes = await request(app)
    .post('/api/auth/google')
    .send({ credential: signGoogleToken(baseClaims({ email: 'stu001@vnrvjiet.in', sub: 'sub-student-scan' })) });

  return {
    adminToken: adminRes.body.token,
    facultyToken: facultyRes.body.token,
    studentToken: studentRes.body.token,
  };
}

export async function cleanupGoogleAuth(): Promise<void> {
  const db = getDb();
  await db.query('DELETE FROM faculty_notifications WHERE session_id IN (SELECT id FROM workspace_sessions WHERE entry_recorder_id IN (SELECT id FROM users WHERE email IN ($1, $2)) OR exit_recorder_id IN (SELECT id FROM users WHERE email IN ($1, $2)))', ['admin.google@vnrvjiet.in', 'faculty.google@vnrvjiet.in']);
  await db.query('DELETE FROM notifications WHERE session_id IN (SELECT id FROM workspace_sessions WHERE entry_recorder_id IN (SELECT id FROM users WHERE email IN ($1, $2)) OR exit_recorder_id IN (SELECT id FROM users WHERE email IN ($1, $2)))', ['admin.google@vnrvjiet.in', 'faculty.google@vnrvjiet.in']);
  await db.query('DELETE FROM workspace_sessions WHERE entry_recorder_id IN (SELECT id FROM users WHERE email IN ($1, $2)) OR exit_recorder_id IN (SELECT id FROM users WHERE email IN ($1, $2))', ['admin.google@vnrvjiet.in', 'faculty.google@vnrvjiet.in']);
  await db.query("DELETE FROM users WHERE email IN ('admin.google@vnrvjiet.in', 'faculty.google@vnrvjiet.in')");
  await db.query("DELETE FROM users WHERE email = 'stu001@vnrvjiet.in'");
  await stopJwksServer();
}

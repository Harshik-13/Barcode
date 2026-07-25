import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logAudit } from './audit';

interface UserRow {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  role_id: string;
  status: string;
}

interface TokenPayload {
  sub: number;
  type: string;
  iat: number;
  exp: number;
}

function signToken(userId: number, role: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: userId,
    type: role,
    iat: now,
    exp: now + config.jwt.expiryHours * 3600,
  };
  return jwt.sign(payload, config.jwt.secret);
}

export async function authenticate(loginId: string, password: string, ip?: string) {
  const email = loginId;

  const db = getDb();
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const hasRow = result.rows.length > 0;
  const user = hasRow ? (result.rows[0] as UserRow) : ({} as Record<string, never>);

  if (!hasRow || !('id' in user)) {
    await logAudit({
      actorType: 'system',
      actorId: null,
      action: 'LOGIN_FAILED',
      entityType: 'USER',
      entityId: null,
      details: { reason: 'invalid_email', email },
      ipAddress: ip,
    });
    throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    await logAudit({
      actorType: 'system',
      actorId: null,
      action: 'LOGIN_FAILED',
      entityType: 'USER',
      entityId: user.id,
      details: { reason: 'invalid_password' },
      ipAddress: ip,
    });
    throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (user.status !== 'active') {
    await logAudit({
      actorType: user.role_id as 'faculty' | 'admin' | 'student',
      actorId: user.id,
      action: 'LOGIN_FAILED',
      entityType: 'USER',
      entityId: user.id,
      details: { reason: 'account_inactive', status: user.status },
      ipAddress: ip,
    });
    throw new ForbiddenError('Your account is not active');
  }

  const token = signToken(user.id, user.role_id);

  await logAudit({
    actorType: user.role_id as 'faculty' | 'admin' | 'student',
    actorId: user.id,
    action: 'LOGIN',
    entityType: 'USER',
    entityId: user.id,
    ipAddress: ip,
  });

  let studentId: number | undefined;
  if (user.role_id === 'student') {
    const db = getDb();
    const stuResult = await db.query('SELECT id FROM students WHERE email = $1', [user.email]);
    if (stuResult.rows.length > 0) {
      studentId = (stuResult.rows[0] as { id: number }).id;
    }
  }

  return {
    token,
    user: { id: user.id, name: user.name, role: user.role_id, email: user.email, studentId },
  };
}

export async function getCurrentUser(userId: number) {
  const db = getDb();
  const result = await db.query('SELECT id, email, name, role_id, status, created_at FROM users WHERE id = $1', [userId]);
  const hasRow = result.rows.length > 0;
  const user = hasRow ? (result.rows[0] as UserRow) : ({} as Record<string, never>);

  if (!hasRow || !('id' in user)) {
    throw new UnauthorizedError('INVALID_TOKEN', 'User not found');
  }

  const createdAt = (user as any).created_at;
  let studentId: number | undefined;
  if (user.role_id === 'student') {
    const db = getDb();
    const stuResult = await db.query('SELECT id FROM students WHERE email = $1', [user.email]);
    if (stuResult.rows.length > 0) {
      studentId = (stuResult.rows[0] as { id: number }).id;
    }
  }
  return { id: user.id, name: user.name, role: user.role_id, email: user.email, status: user.status, createdAt, studentId };
}

export async function logLogout(userId: number, role: string, ip?: string): Promise<void> {
  await logAudit({
    actorType: role as 'faculty' | 'admin' | 'student',
    actorId: userId,
    action: 'LOGOUT',
    entityType: 'USER',
    entityId: userId,
    ipAddress: ip,
  });
}

export async function logPermissionDenied(userId: number, role: string, action: string, ip?: string): Promise<void> {
  await logAudit({
    actorType: role as 'faculty' | 'admin' | 'student',
    actorId: userId,
    action: 'PERMISSION_DENIED',
    entityType: 'ACCESS',
    entityId: null,
    details: { attemptedAction: action },
    ipAddress: ip,
  });
}

import jwt from 'jsonwebtoken';
import { getDb } from '../db';
import { config } from '../config';
import { UnauthorizedError } from '../utils/errors';
import { logAudit } from './audit';

interface TokenPayload {
  sub: number;
  type: string;
  pca: number;
  iat: number;
  exp: number;
}

export function signToken(userId: number, role: string, passwordChangedAt: Date | string): string {
  const now = Math.floor(Date.now() / 1000);
  const pcaDate = typeof passwordChangedAt === 'string' ? new Date(passwordChangedAt) : passwordChangedAt;
  const payload: TokenPayload = {
    sub: userId,
    type: role,
    pca: Math.floor(pcaDate.getTime() / 1000),
    iat: now,
    exp: now + config.jwt.expiryHours * 3600,
  };
  return jwt.sign(payload, config.jwt.secret);
}

export async function buildLoginResponse(user: {
  id: number;
  email: string;
  name: string;
  role_id: string;
  password_changed_at: string | null;
}): Promise<{ token: string; user: { id: number; name: string; role: string; email: string; studentId?: number } }> {
  const pca = user.password_changed_at ?? new Date().toISOString();
  const token = signToken(user.id, user.role_id, pca);

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
  const user = hasRow ? (result.rows[0] as { id: number; email: string; name: string; role_id: string; status: string; created_at: string }) : ({} as Record<string, never>);

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

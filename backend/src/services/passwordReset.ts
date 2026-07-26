import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { config } from '../config';
import { ValidationError, BusinessRuleError } from '../utils/errors';
import { logAudit } from './audit';
import { sendPasswordResetEmail } from './email';
import { validateNewPassword } from './passwordValidation';

const TOKEN_BYTES = 32;
const RESET_EXPIRY_MINUTES = 15;

function generateRawToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyTokenHash(token: string, hash: string): boolean {
  const computed = crypto.createHash('sha256').update(token).digest('hex');
  const a = Buffer.from(computed);
  const b = Buffer.from(hash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function cleanupStaleTokens(): Promise<void> {
  const db = getDb();
  await db.query(
    `DELETE FROM password_reset_tokens WHERE used_at IS NOT NULL OR expires_at < CURRENT_TIMESTAMP`
  );
}

export async function requestPasswordReset(email: string, ip?: string): Promise<void> {
  const db = getDb();

  const userResult = await db.query(
    'SELECT id, email, role_id, status FROM users WHERE email = $1',
    [email]
  );

  if (userResult.rows.length === 0) {
    return;
  }

  const user = userResult.rows[0] as { id: number; email: string; role_id: string; status: string };

  if (user.status !== 'active') {
    return;
  }

  cleanupStaleTokens().catch(() => { /* cleanup failures must not crash */ });

  await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL', [user.id]);

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000).toISOString();

  await db.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, tokenHash, expiresAt]
  );

  const resetLink = `${config.frontendUrl}/reset-password?token=${rawToken}`;

  sendPasswordResetEmail(user.email, resetLink).catch((err) => {
    /* email failures must not crash the request */
  });

  await logAudit({
    actorType: user.role_id as 'student' | 'faculty' | 'admin',
    actorId: user.id,
    action: 'PASSWORD_RESET_REQUESTED',
    entityType: 'USER',
    entityId: user.id,
    ipAddress: ip,
  });
}

export async function resetPassword(
  rawToken: string,
  newPassword: string,
  confirmPassword: string,
  ip?: string
): Promise<void> {
  if (newPassword !== confirmPassword) {
    throw new ValidationError('VALIDATION_ERROR', 'New password and confirmation do not match');
  }

  validateNewPassword(newPassword);

  const db = getDb();

  cleanupStaleTokens().catch(() => { /* cleanup failures must not crash */ });

  const tokenResult = await db.query(
    `SELECT id, user_id, token_hash, expires_at, used_at
     FROM password_reset_tokens
     WHERE used_at IS NULL AND expires_at > CURRENT_TIMESTAMP
     ORDER BY created_at DESC
     LIMIT 1`,
    []
  );

  if (tokenResult.rows.length === 0) {
    throw new BusinessRuleError('INVALID_RESET_TOKEN', 'This reset link is invalid or has expired');
  }

  const tokenRow = tokenResult.rows[0] as {
    id: number;
    user_id: number;
    token_hash: string;
    expires_at: string;
    used_at: string | null;
  };

  if (!verifyTokenHash(rawToken, tokenRow.token_hash)) {
    throw new BusinessRuleError('INVALID_RESET_TOKEN', 'This reset link is invalid or has expired');
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  await db.query('BEGIN');
  try {
    await db.query(
      'UPDATE users SET password_hash = $1, password_changed_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHash, tokenRow.user_id]
    );

    await db.query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [tokenRow.id]
    );

    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  await logAudit({
    actorType: 'system',
    actorId: tokenRow.user_id,
    action: 'PASSWORD_RESET_COMPLETED',
    entityType: 'USER',
    entityId: tokenRow.user_id,
    ipAddress: ip,
  });
}

import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import { logAudit } from './audit';
import { validateNewPassword } from './passwordValidation';

const BCRYPT_ROUNDS = 12;

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
  role: string,
  ip?: string
): Promise<void> {
  if (newPassword !== confirmPassword) {
    throw new ValidationError('VALIDATION_ERROR', 'New password and confirmation do not match');
  }

  if (currentPassword === newPassword) {
    throw new ValidationError('VALIDATION_ERROR', 'New password must be different from current password');
  }

  validateNewPassword(newPassword);

  const db = getDb();

  const userResult = await db.query(
    'SELECT id, password_hash, role_id FROM users WHERE id = $1',
    [userId]
  );
  if (userResult.rows.length === 0) {
    throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid credentials');
  }

  const user = userResult.rows[0] as { id: number; password_hash: string; role_id: string };

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    throw new UnauthorizedError('INVALID_CREDENTIALS', 'Current password is incorrect');
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await db.query('BEGIN');
  try {
    await db.query(
      'UPDATE users SET password_hash = $1, password_changed_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHash, userId]
    );

    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  await logAudit({
    actorType: role as 'student' | 'faculty' | 'admin',
    actorId: userId,
    action: 'PASSWORD_CHANGED',
    entityType: 'USER',
    entityId: userId,
    details: null,
    ipAddress: ip,
  });
}

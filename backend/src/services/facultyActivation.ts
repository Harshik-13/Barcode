import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { config } from '../config';
import { NotFoundError, ConflictError, BusinessRuleError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';
import { logAudit } from './audit';
import { getFacultyByEmail } from './faculty';
import { sendOtpEmail } from './email';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateActivationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function getFacultyOrError(email: string): Promise<{ id: number; name: string; email: string }> {
  try {
    const faculty = await getFacultyByEmail(email);
    return { id: faculty.id, name: faculty.name, email: faculty.email };
  } catch {
    throw new NotFoundError('Faculty account not found');
  }
}

async function checkAlreadyActivated(userId: number): Promise<void> {
  const db = getDb();
  const result = await db.query("SELECT status FROM users WHERE id = $1", [userId]);
  if (result.rows.length > 0) {
    const row = result.rows[0] as { status: string };
    if (row.status !== 'invited') {
      throw new ConflictError('ALREADY_ACTIVATED', 'This faculty account has already been activated');
    }
    return;
  }
}

async function invalidatePreviousOtps(userId: number): Promise<void> {
  const db = getDb();
  await db.query('UPDATE faculty_activation_otps SET is_used = 1 WHERE user_id = $1 AND is_used = 0', [userId]);
}

function verifyOtpNotExpired(expiresAt: string): void {
  if (new Date(expiresAt) < new Date()) {
    throw new BusinessRuleError('OTP_EXPIRED', 'OTP has expired. Please request a new one.');
  }
}

function verifyOtpNotUsed(record: { is_used: number }): void {
  if (record.is_used) {
    throw new BusinessRuleError('OTP_ALREADY_USED', 'This OTP has already been used');
  }
}

function verifyOtpAttempts(record: { attempts: number; max_attempts: number }): void {
  if (record.attempts >= record.max_attempts) {
    throw new BusinessRuleError('OTP_MAX_ATTEMPTS', 'Too many failed attempts. Please request a new OTP.');
  }
}

export async function startFacultyActivation(email: string, ip?: string) {
  const faculty = await getFacultyOrError(email);

  await checkAlreadyActivated(faculty.id);

  await invalidatePreviousOtps(faculty.id);

  const otp = generateOtp();
  const otpHash = bcrypt.hashSync(otp, 10);
  const expiresAt = new Date(Date.now() + config.activation.otpExpiryMinutes * 60 * 1000).toISOString();

  const db = getDb();
  await db.query('INSERT INTO faculty_activation_otps (user_id, otp_hash, max_attempts, expires_at) VALUES ($1, $2, $3, $4)', [faculty.id, otpHash, config.activation.otpMaxAttempts, expiresAt]);

  sendOtpEmail(email, otp).catch((err) => logger.error('Background faculty OTP send failed', { error: err.message }));

  logAudit({ actorType: 'system', actorId: faculty.id, action: 'FACULTY_ACTIVATION_OTP_SENT', entityType: 'FACULTY', entityId: faculty.id, details: { email }, ipAddress: ip });

  return { message: 'OTP sent to your email' };
}

export async function verifyFacultyOtp(email: string, otp: string, ip?: string) {
  const faculty = await getFacultyOrError(email);

  await checkAlreadyActivated(faculty.id);

  const db = getDb();
  const result = await db.query('SELECT * FROM faculty_activation_otps WHERE user_id = $1 AND is_used = 0 ORDER BY created_at DESC LIMIT 1', [faculty.id]);
  if (result.rows.length === 0) {
    throw new NotFoundError('No active OTP found. Please request a new OTP');
  }
  const record = result.rows[0] as unknown as {
    id: number; otp_hash: string; attempts: number; max_attempts: number; expires_at: string; is_used: number;
  };

  verifyOtpNotExpired(record.expires_at);
  verifyOtpNotUsed(record);
  verifyOtpAttempts(record);

  const valid = bcrypt.compareSync(otp, record.otp_hash);
  if (!valid) {
    await db.query('UPDATE faculty_activation_otps SET attempts = attempts + 1 WHERE id = $1', [record.id]);
    logAudit({ actorType: 'system', actorId: faculty.id, action: 'FACULTY_ACTIVATION_OTP_FAILED', entityType: 'FACULTY', entityId: faculty.id, details: { email, attempt: record.attempts + 1 }, ipAddress: ip });
    throw new BusinessRuleError('INVALID_OTP', 'Invalid OTP. Please try again.');
  }

  const activationToken = generateActivationToken();
  await db.query('UPDATE faculty_activation_otps SET verified_at = $1, activation_token = $2 WHERE id = $3', [new Date().toISOString(), activationToken, record.id]);

  logAudit({ actorType: 'system', actorId: faculty.id, action: 'FACULTY_ACTIVATION_OTP_VERIFIED', entityType: 'FACULTY', entityId: faculty.id, details: { email }, ipAddress: ip });

  return { activationToken, message: 'OTP verified successfully' };
}

export async function setFacultyPassword(activationToken: string, password: string, ip?: string) {
  if (!password || password.length < 8) {
    throw new BusinessRuleError('WEAK_PASSWORD', 'Password must be at least 8 characters');
  }

  const db = getDb();
  const result = await db.query('SELECT * FROM faculty_activation_otps WHERE activation_token = $1 AND is_used = 0 AND verified_at IS NOT NULL', [activationToken]);
  if (result.rows.length === 0) {
    throw new ForbiddenError('Invalid or expired activation token');
  }
  const record = result.rows[0] as unknown as {
    id: number; user_id: number; is_used: number;
  };

  verifyOtpNotUsed(record);

  const passwordHash = bcrypt.hashSync(password, 12);
  await db.query("UPDATE users SET password_hash = $1, status = 'active' WHERE id = $2", [passwordHash, record.user_id]);

  await db.query('UPDATE faculty_activation_otps SET is_used = 1 WHERE id = $1', [record.id]);

  logAudit({ actorType: 'system', actorId: null, action: 'FACULTY_ACTIVATION_COMPLETED', entityType: 'FACULTY', entityId: record.user_id, details: { userId: record.user_id }, ipAddress: ip });

  return { message: 'Password set successfully. You can now log in.' };
}

export async function checkFacultyActivationStatus(email: string) {
  const faculty = await getFacultyOrError(email);

  const db = getDb();
  const result = await db.query("SELECT status FROM users WHERE id = $1", [faculty.id]);
  const row = result.rows[0] as { status: string };

  return { activated: row.status !== 'invited', name: faculty.name };
}

export async function resendFacultyOtp(email: string, ip?: string) {
  const faculty = await getFacultyOrError(email);

  await checkAlreadyActivated(faculty.id);

  const db = getDb();
  const latestResult = await db.query('SELECT created_at FROM faculty_activation_otps WHERE user_id = $1 AND is_used = 0 ORDER BY created_at DESC LIMIT 1', [faculty.id]);
  if (latestResult.rows.length > 0) {
    const latest = latestResult.rows[0] as unknown as { created_at: string };
    const elapsed = (Date.now() - new Date(latest.created_at).getTime()) / 1000;
    if (elapsed < config.activation.otpCooldownSeconds) {
      const remaining = Math.ceil(config.activation.otpCooldownSeconds - elapsed);
      throw new BusinessRuleError('OTP_COOLDOWN', `Please wait ${remaining} seconds before requesting a new OTP`);
    }
  }

  await invalidatePreviousOtps(faculty.id);

  const otp = generateOtp();
  const otpHash = bcrypt.hashSync(otp, 10);
  const expiresAt = new Date(Date.now() + config.activation.otpExpiryMinutes * 60 * 1000).toISOString();

  await db.query('INSERT INTO faculty_activation_otps (user_id, otp_hash, max_attempts, expires_at) VALUES ($1, $2, $3, $4)', [faculty.id, otpHash, config.activation.otpMaxAttempts, expiresAt]);

  sendOtpEmail(email, otp).catch((err) => logger.error('Background faculty OTP resend failed', { error: err.message }));

  logAudit({ actorType: 'system', actorId: faculty.id, action: 'FACULTY_ACTIVATION_OTP_RESENT', entityType: 'FACULTY', entityId: faculty.id, details: { email }, ipAddress: ip });

  return { message: 'OTP resent to your email' };
}

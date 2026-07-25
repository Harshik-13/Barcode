import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { config } from '../config';
import { NotFoundError, ConflictError, BusinessRuleError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';
import { logAudit } from './audit';
import { lookupStudent } from './student';
import { sendOtpEmail } from './email';

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateActivationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function deriveEmail(roll: string): string {
  return `${roll.toLowerCase()}${config.activation.studentEmailDomain}`;
}

async function getStudentOrError(roll: string): Promise<{ id: number; name: string; roll: string }> {
  try {
    const student = await lookupStudent(roll);
    return student as { id: number; name: string; roll: string };
  } catch {
    throw new NotFoundError('Student account not found');
  }
}

async function checkAlreadyActivated(studentId: number, email: string): Promise<void> {
  const db = getDb();
  const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (result.rows.length > 0) {
    throw new ConflictError('ALREADY_ACTIVATED', 'This account has already been activated');
  }
}

async function invalidatePreviousOtps(studentId: number): Promise<void> {
  const db = getDb();
  await db.query('UPDATE activation_otps SET is_used = 1 WHERE student_id = $1 AND is_used = 0', [studentId]);
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

export async function startActivation(roll: string, ip?: string) {
  const student = await getStudentOrError(roll);
  const email = deriveEmail(student.roll);

  await checkAlreadyActivated(student.id, email);

  const db = getDb();

  await db.query('BEGIN');
  let rolledBack = false;
  try {
    await invalidatePreviousOtps(student.id);

    const otp = generateOtp();
    const otpHash = bcrypt.hashSync(otp, 10);
    const expiresAt = new Date(Date.now() + config.activation.otpExpiryMinutes * 60 * 1000).toISOString();

    await db.query('INSERT INTO activation_otps (student_id, otp_hash, max_attempts, expires_at) VALUES ($1, $2, $3, $4)', [student.id, otpHash, config.activation.otpMaxAttempts, expiresAt]);
    await db.query('COMMIT');

    sendOtpEmail(email, otp).catch((err) => logger.error('Background OTP send failed', { error: err.message }));

    logAudit({ actorType: 'student', actorId: student.id, action: 'ACTIVATION_OTP_SENT', entityType: 'STUDENT', entityId: student.id, details: { roll }, ipAddress: ip });

    return { message: 'OTP sent to your college email', emailDomain: config.activation.studentEmailDomain };
  } catch (err) {
    if (!rolledBack) { try { await db.query('ROLLBACK'); } catch { /* ignore */ } }
    throw err;
  }
}

export async function verifyOtp(roll: string, otp: string, ip?: string) {
  const student = await getStudentOrError(roll);
  const email = deriveEmail(student.roll);

  await checkAlreadyActivated(student.id, email);

  const db = getDb();
  const result = await db.query('SELECT * FROM activation_otps WHERE student_id = $1 AND is_used = 0 ORDER BY created_at DESC LIMIT 1', [student.id]);
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
    await db.query('UPDATE activation_otps SET attempts = attempts + 1 WHERE id = $1', [record.id]);
    logAudit({ actorType: 'student', actorId: student.id, action: 'ACTIVATION_OTP_FAILED', entityType: 'STUDENT', entityId: student.id, details: { roll, attempt: record.attempts + 1 }, ipAddress: ip });
    throw new BusinessRuleError('INVALID_OTP', 'Invalid OTP. Please try again.');
  }

  const activationToken = generateActivationToken();
  await db.query('UPDATE activation_otps SET verified_at = $1, activation_token = $2 WHERE id = $3', [new Date().toISOString(), activationToken, record.id]);

  logAudit({ actorType: 'student', actorId: student.id, action: 'ACTIVATION_OTP_VERIFIED', entityType: 'STUDENT', entityId: student.id, details: { roll }, ipAddress: ip });

  return { activationToken, message: 'OTP verified successfully' };
}

export async function setPassword(activationToken: string, password: string, ip?: string) {
  if (!password || password.length < 8) {
    throw new BusinessRuleError('WEAK_PASSWORD', 'Password must be at least 8 characters');
  }

  const db = getDb();
  const result = await db.query('SELECT * FROM activation_otps WHERE activation_token = $1 AND is_used = 0 AND verified_at IS NOT NULL', [activationToken]);
  if (result.rows.length === 0) {
    throw new ForbiddenError('Invalid or expired activation token');
  }
  const record = result.rows[0] as unknown as {
    id: number; student_id: number; expires_at: string; is_used: number;
  };

  verifyOtpNotUsed(record);

  const studentResult = await db.query('SELECT roll, name FROM students WHERE id = $1', [record.student_id]);
  if (studentResult.rows.length === 0) {
    throw new NotFoundError('Student');
  }
  const student = studentResult.rows[0] as unknown as { roll: string; name: string };

  const email = deriveEmail(student.roll);

  const existingUserResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUserResult.rows.length > 0) {
    throw new ConflictError('ALREADY_ACTIVATED', 'This account has already been activated');
  }

  const passwordHash = bcrypt.hashSync(password, 12);

  await db.query('BEGIN');
  let rolledBack = false;
  try {
    await db.query('INSERT INTO users (email, name, password_hash, role_id, status) VALUES ($1, $2, $3, $4, $5)', [email, student.name, passwordHash, 'student', 'active']);
    await db.query("UPDATE students SET status = 'enrolled' WHERE id = $1", [record.student_id]);
    await db.query('UPDATE activation_otps SET is_used = 1 WHERE id = $1', [record.id]);
    await db.query('COMMIT');

    logAudit({ actorType: 'system', actorId: null, action: 'ACTIVATION_COMPLETED', entityType: 'STUDENT', entityId: record.student_id, details: { roll: student.roll, email }, ipAddress: ip });

    return { message: 'Password set successfully. You can now log in with your college email.' };
  } catch (err) {
    if (!rolledBack) { try { await db.query('ROLLBACK'); } catch { /* ignore */ } }
    throw err;
  }
}

export async function resendOtp(roll: string, ip?: string) {
  const student = await getStudentOrError(roll);
  const email = deriveEmail(student.roll);

  await checkAlreadyActivated(student.id, email);

  const db = getDb();
  const latestResult = await db.query('SELECT created_at FROM activation_otps WHERE student_id = $1 AND is_used = 0 ORDER BY created_at DESC LIMIT 1', [student.id]);
  if (latestResult.rows.length > 0) {
    const latest = latestResult.rows[0] as unknown as { created_at: string };
    const elapsed = (Date.now() - new Date(latest.created_at).getTime()) / 1000;
    if (elapsed < config.activation.otpCooldownSeconds) {
      const remaining = Math.ceil(config.activation.otpCooldownSeconds - elapsed);
      throw new BusinessRuleError('OTP_COOLDOWN', `Please wait ${remaining} seconds before requesting a new OTP`);
    }
  }

  await db.query('BEGIN');
  let rolledBack = false;
  try {
    await invalidatePreviousOtps(student.id);

    const otp = generateOtp();
    const otpHash = bcrypt.hashSync(otp, 10);
    const expiresAt = new Date(Date.now() + config.activation.otpExpiryMinutes * 60 * 1000).toISOString();

    await db.query('INSERT INTO activation_otps (student_id, otp_hash, max_attempts, expires_at) VALUES ($1, $2, $3, $4)', [student.id, otpHash, config.activation.otpMaxAttempts, expiresAt]);
    await db.query('COMMIT');

    sendOtpEmail(email, otp).catch((err) => logger.error('Background OTP resend failed', { error: err.message }));

    logAudit({ actorType: 'student', actorId: student.id, action: 'ACTIVATION_OTP_RESENT', entityType: 'STUDENT', entityId: student.id, details: { roll }, ipAddress: ip });

    return { message: 'OTP resent to your college email' };
  } catch (err) {
    if (!rolledBack) { try { await db.query('ROLLBACK'); } catch { /* ignore */ } }
    throw err;
  }
}

export async function checkActivationStatus(roll: string) {
  const student = await getStudentOrError(roll);
  const email = deriveEmail(student.roll);

  const db = getDb();
  const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  const activated = result.rows.length > 0;

  return { activated, name: student.name, emailDomain: config.activation.studentEmailDomain };
}

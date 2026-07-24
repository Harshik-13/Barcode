import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { config } from '../config';
import { NotFoundError, ConflictError, BusinessRuleError, ForbiddenError } from '../utils/errors';
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

function getStudentOrError(roll: string): { id: number; name: string; roll: string } {
  try {
    return lookupStudent(roll) as { id: number; name: string; roll: string };
  } catch {
    throw new NotFoundError('Student account not found');
  }
}

function checkAlreadyActivated(studentId: number, email: string): void {
  const db = getDb();
  const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
  stmt.bind([email]);
  if (stmt.step()) {
    stmt.free();
    throw new ConflictError('ALREADY_ACTIVATED', 'This account has already been activated');
  }
  stmt.free();
}

function invalidatePreviousOtps(studentId: number): void {
  const db = getDb();
  db.run('UPDATE activation_otps SET is_used = 1 WHERE student_id = ? AND is_used = 0', [studentId]);
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

export function startActivation(roll: string, ip?: string) {
  const student = getStudentOrError(roll);
  const email = deriveEmail(student.roll);

  checkAlreadyActivated(student.id, email);

  invalidatePreviousOtps(student.id);

  const otp = generateOtp();
  const otpHash = bcrypt.hashSync(otp, 10);
  const expiresAt = new Date(Date.now() + config.activation.otpExpiryMinutes * 60 * 1000).toISOString();

  const db = getDb();
  const stmt = db.prepare('INSERT INTO activation_otps (student_id, otp_hash, max_attempts, expires_at) VALUES (?, ?, ?, ?)');
  stmt.run([student.id, otpHash, config.activation.otpMaxAttempts, expiresAt]);
  stmt.free();

  sendOtpEmail(email, otp);

  logAudit({ actorType: 'student', actorId: student.id, action: 'ACTIVATION_OTP_SENT', entityType: 'STUDENT', entityId: student.id, details: { roll }, ipAddress: ip });

  return { message: 'OTP sent to your college email', emailDomain: config.activation.studentEmailDomain };
}

export function verifyOtp(roll: string, otp: string, ip?: string) {
  const student = getStudentOrError(roll);
  const email = deriveEmail(student.roll);

  checkAlreadyActivated(student.id, email);

  const db = getDb();
  const stmt = db.prepare('SELECT * FROM activation_otps WHERE student_id = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1');
  stmt.bind([student.id]);
  if (!stmt.step()) {
    stmt.free();
    throw new NotFoundError('No active OTP found. Please request a new OTP');
  }
  const record = stmt.getAsObject() as unknown as {
    id: number; otp_hash: string; attempts: number; max_attempts: number; expires_at: string; is_used: number;
  };
  stmt.free();

  verifyOtpNotExpired(record.expires_at);
  verifyOtpNotUsed(record);
  verifyOtpAttempts(record);

  const valid = bcrypt.compareSync(otp, record.otp_hash);
  if (!valid) {
    db.run('UPDATE activation_otps SET attempts = attempts + 1 WHERE id = ?', [record.id]);
    logAudit({ actorType: 'student', actorId: student.id, action: 'ACTIVATION_OTP_FAILED', entityType: 'STUDENT', entityId: student.id, details: { roll, attempt: record.attempts + 1 }, ipAddress: ip });
    throw new BusinessRuleError('INVALID_OTP', 'Invalid OTP. Please try again.');
  }

  const activationToken = generateActivationToken();
  db.run('UPDATE activation_otps SET verified_at = ?, activation_token = ? WHERE id = ?', [new Date().toISOString(), activationToken, record.id]);

  logAudit({ actorType: 'student', actorId: student.id, action: 'ACTIVATION_OTP_VERIFIED', entityType: 'STUDENT', entityId: student.id, details: { roll }, ipAddress: ip });

  return { activationToken, message: 'OTP verified successfully' };
}

export function setPassword(activationToken: string, password: string, ip?: string) {
  if (!password || password.length < 8) {
    throw new BusinessRuleError('WEAK_PASSWORD', 'Password must be at least 8 characters');
  }

  const db = getDb();
  const stmt = db.prepare('SELECT * FROM activation_otps WHERE activation_token = ? AND is_used = 0 AND verified_at IS NOT NULL');
  stmt.bind([activationToken]);
  if (!stmt.step()) {
    stmt.free();
    throw new ForbiddenError('Invalid or expired activation token');
  }
  const record = stmt.getAsObject() as unknown as {
    id: number; student_id: number; expires_at: string; is_used: number;
  };
  stmt.free();

  verifyOtpNotUsed(record);

  const studentStmt = db.prepare('SELECT roll, name FROM students WHERE id = ?');
  studentStmt.bind([record.student_id]);
  if (!studentStmt.step()) {
    studentStmt.free();
    throw new NotFoundError('Student');
  }
  const student = studentStmt.getAsObject() as unknown as { roll: string; name: string };
  studentStmt.free();

  const email = deriveEmail(student.roll);

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?');
  existingUser.bind([email]);
  if (existingUser.step()) {
    existingUser.free();
    throw new ConflictError('ALREADY_ACTIVATED', 'This account has already been activated');
  }
  existingUser.free();

  const passwordHash = bcrypt.hashSync(password, 12);
  db.run('INSERT INTO users (email, name, password_hash, role_id, status) VALUES (?, ?, ?, ?, ?)', [email, student.name, passwordHash, 'student', 'active']);

  db.run('UPDATE activation_otps SET is_used = 1 WHERE id = ?', [record.id]);

  logAudit({ actorType: 'system', actorId: null, action: 'ACTIVATION_COMPLETED', entityType: 'STUDENT', entityId: record.student_id, details: { roll: student.roll, email }, ipAddress: ip });

  return { message: 'Password set successfully. You can now log in.' };
}

export function resendOtp(roll: string, ip?: string) {
  const student = getStudentOrError(roll);
  const email = deriveEmail(student.roll);

  checkAlreadyActivated(student.id, email);

  const db = getDb();
  const latestStmt = db.prepare('SELECT created_at FROM activation_otps WHERE student_id = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1');
  latestStmt.bind([student.id]);
  if (latestStmt.step()) {
    const latest = latestStmt.getAsObject() as unknown as { created_at: string };
    latestStmt.free();
    const elapsed = (Date.now() - new Date(latest.created_at).getTime()) / 1000;
    if (elapsed < config.activation.otpCooldownSeconds) {
      const remaining = Math.ceil(config.activation.otpCooldownSeconds - elapsed);
      throw new BusinessRuleError('OTP_COOLDOWN', `Please wait ${remaining} seconds before requesting a new OTP`);
    }
  } else {
    latestStmt.free();
  }

  invalidatePreviousOtps(student.id);

  const otp = generateOtp();
  const otpHash = bcrypt.hashSync(otp, 10);
  const expiresAt = new Date(Date.now() + config.activation.otpExpiryMinutes * 60 * 1000).toISOString();

  const insertStmt = db.prepare('INSERT INTO activation_otps (student_id, otp_hash, max_attempts, expires_at) VALUES (?, ?, ?, ?)');
  insertStmt.run([student.id, otpHash, config.activation.otpMaxAttempts, expiresAt]);
  insertStmt.free();

  sendOtpEmail(email, otp);

  logAudit({ actorType: 'student', actorId: student.id, action: 'ACTIVATION_OTP_RESENT', entityType: 'STUDENT', entityId: student.id, details: { roll }, ipAddress: ip });

  return { message: 'OTP resent to your college email' };
}

export function checkActivationStatus(roll: string) {
  const student = getStudentOrError(roll);
  const email = deriveEmail(student.roll);

  const db = getDb();
  const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
  stmt.bind([email]);
  const activated = stmt.step();
  stmt.free();

  return { activated, name: student.name, emailDomain: config.activation.studentEmailDomain };
}

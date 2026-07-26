import nodemailer from 'nodemailer';
import { config, isTest, isProd } from '../config';
import { logger } from '../utils/logger';

function createTransport(): nodemailer.Transporter | null {
  if (!config.email.user || !config.email.password) {
    logger.warn('SMTP credentials not configured — emails will be logged to console');
    return null;
  }

  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: { user: config.email.user, pass: config.email.password },
  });
}

const transport = createTransport();

export async function verifySmtp(): Promise<void> {
  if (!transport) {
    if (isProd) {
      throw new Error('SMTP transport unavailable in production');
    }
    logger.warn('Skipping SMTP verification — transport not configured');
    return;
  }

  try {
    await transport.verify();
    logger.info('Gmail SMTP initialized successfully.');
  } catch (err) {
    throw new Error(`SMTP verification failed: ${(err as Error).message}`);
  }
}

export async function sendOtpEmail(toEmail: string, otp: string): Promise<void> {
  if (!transport || isTest) {
    logger.info(`[EMAIL] To: ${toEmail} — Your OTP: ${otp}`);
    return;
  }

  try {
    await transport.sendMail({
      from: config.email.from,
      to: toEmail,
      subject: 'Your Workspace Activation OTP',
      text: `Your OTP for workspace account activation is: ${otp}\n\nThis OTP expires in ${config.activation.otpExpiryMinutes} minutes.`,
      html: `<p>Your OTP for workspace account activation is: <strong>${otp}</strong></p><p>This OTP expires in ${config.activation.otpExpiryMinutes} minutes.</p>`,
    });
    logger.info(`OTP email sent to ${toEmail}`);
  } catch (err) {
    logger.error(`Failed to send OTP email to ${toEmail}`, { error: (err as Error).message });
    throw err;
  }
}

export async function sendPasswordResetEmail(toEmail: string, resetLink: string): Promise<void> {
  if (!transport || isTest) {
    logger.info(`[EMAIL] To: ${toEmail} — Password reset link: ${resetLink}`);
    return;
  }

  try {
    await transport.sendMail({
      from: config.email.from,
      to: toEmail,
      subject: 'Reset Your 8Hour Workspace Password',
      text: `You requested a password reset.\n\nClick the link below to reset your password. This link expires in 15 minutes.\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
      html: `<p>You requested a password reset.</p><p>Click the link below to reset your password. This link expires in <strong>15 minutes</strong>.</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, please ignore this email.</p>`,
    });
    logger.info(`Password reset email sent to ${toEmail}`);
  } catch (err) {
    logger.error(`Failed to send password reset email to ${toEmail}`, { error: (err as Error).message });
    throw err;
  }
}

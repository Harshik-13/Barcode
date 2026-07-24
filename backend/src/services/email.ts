import nodemailer from 'nodemailer';
import { config, isTest } from '../config';
import { logger } from '../utils/logger';

function createTransport(): nodemailer.Transporter {
  if (!config.email.user || !config.email.password) {
    logger.warn('SMTP credentials not configured — emails will be logged to console');
    return null as unknown as nodemailer.Transporter;
  }

  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: { user: config.email.user, pass: config.email.password },
    tls: config.email.useTls ? { rejectUnauthorized: true } : undefined,
  });
}

const transport = createTransport();

export async function sendOtpEmail(toEmail: string, otp: string): Promise<void> {
  if (isTest || !transport) {
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

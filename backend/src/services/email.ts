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

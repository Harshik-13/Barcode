import { logger } from '../utils/logger';

export function sendOtpEmail(toEmail: string, otp: string): void {
  logger.info(`[EMAIL] To: ${toEmail} — Your OTP: ${otp}`);
}

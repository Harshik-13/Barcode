import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (config.env === 'production') {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
  }

  next();
}

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const FIVE_MINUTES = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, FIVE_MINUTES);

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip ?? 'unknown';
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + config.rateLimit.windowMs };
    store.set(key, entry);
  }

  entry.count++;

  res.setHeader('X-RateLimit-Limit', String(config.rateLimit.maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, config.rateLimit.maxRequests - entry.count)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

  if (entry.count > config.rateLimit.maxRequests) {
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    });
    return;
  }

  next();
}

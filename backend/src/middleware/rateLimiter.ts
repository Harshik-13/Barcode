import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

const FIVE_MINUTES = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const store of stores.values()) {
    for (const [key, entry] of store) {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    }
  }
}, FIVE_MINUTES);

export function createRateLimiter(name: string, maxRequests: number, windowMs: number) {
  const store = new Map<string, RateLimitEntry>();
  stores.set(name, store);

  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > maxRequests) {
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      });
      return;
    }

    next();
  };
}

export const globalLimiter = createRateLimiter('global', config.rateLimit.maxRequests, config.rateLimit.windowMs);
export const scanLimiter = createRateLimiter('scan', 30, 60000);
export const adminLimiter = createRateLimiter('admin', 30, 60000);
export const authLimiter = createRateLimiter('auth', config.rateLimit.authMax, 60000);

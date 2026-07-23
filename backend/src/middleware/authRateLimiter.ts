import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60000;
const MAX_LOGIN_ATTEMPTS = 10;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60000);

export function authRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip ?? 'unknown';
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, entry);
  }

  entry.count++;

  if (entry.count > MAX_LOGIN_ATTEMPTS) {
    res.status(429).json({
      error: 'RATE_LIMITED',
      message: 'Too many login attempts. Please try again later.',
    });
    return;
  }

  next();
}

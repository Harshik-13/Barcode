import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logPermissionDenied } from '../services/auth';

export interface AuthPayload {
  userId: number;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError('MISSING_TOKEN', 'Authentication token is required'));
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as unknown as { sub: number; type: string };
    req.user = { userId: payload.sub, role: payload.type };
    next();
  } catch {
    next(new UnauthorizedError('INVALID_TOKEN', 'The provided token is invalid or expired'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('MISSING_TOKEN', 'Authentication token is required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      logPermissionDenied(req.user.userId, req.user.role, req.path);
      next(new ForbiddenError('You do not have permission to perform this action'));
      return;
    }

    next();
  };
}

export function requireOwnership(getOwnerId: (req: Request) => number) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('MISSING_TOKEN', 'Authentication token is required'));
      return;
    }

    if (req.user.role === 'student' && getOwnerId(req) !== req.user.userId) {
      logPermissionDenied(req.user.userId, req.user.role, req.path);
      next(new ForbiddenError('You do not own this resource'));
      return;
    }

    next();
  };
}

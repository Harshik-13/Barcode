import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logPermissionDenied } from '../services/auth';
import { getDb } from '../db';

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

export async function requireOwnStudentResource(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    next(new UnauthorizedError('MISSING_TOKEN', 'Authentication token is required'));
    return;
  }

  if (req.user.role !== 'student') {
    next();
    return;
  }

  const resourceId = parseInt((req.params.studentId || req.params.id) as string, 10);
  if (isNaN(resourceId)) {
    next(new ForbiddenError('Invalid resource identifier'));
    return;
  }

  try {
    const db = getDb();
    const result = await db.query(
      'SELECT s.id FROM students s JOIN users u ON s.email = u.email WHERE u.id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0 || (result.rows[0] as { id: number }).id !== resourceId) {
      logPermissionDenied(req.user.userId, req.user.role, req.path);
      next(new ForbiddenError('You do not own this resource'));
      return;
    }

    next();
  } catch {
    next(new ForbiddenError('Could not verify resource ownership'));
  }
}

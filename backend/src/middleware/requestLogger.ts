import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { generateRequestId } from '../../../shared';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = generateRequestId();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });

  next();
}

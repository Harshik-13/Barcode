import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole, requireOwnership } from '../middleware/auth';
import { listSessions, getSessionById, createSession, startSession, exitSession, manualExitSession, completeSession, archiveSession, getActiveSessionForStudent } from '../services/session';
import { validateBody } from '../utils/validation';
import { parsePagination } from '../utils/pagination';

const router = Router();

router.get('/sessions', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const filters: Record<string, unknown> = {};
    if (req.query.studentId) filters.studentId = parseInt(req.query.studentId as string, 10);
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom as string;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo as string;
    const result = listSessions(page, limit, filters as any);
    res.json({ data: result.sessions, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (err) { next(err); }
});

router.get('/sessions/active/:studentId', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = getActiveSessionForStudent(parseInt(req.params.studentId as string, 10));
    res.json({ data: session ?? null });
  } catch (err) { next(err); }
});

router.get('/sessions/:id', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = getSessionById(parseInt(req.params.id as string, 10));
    res.json({ data: session });
  } catch (err) { next(err); }
});

router.post('/sessions',
  requireAuth,
  requireRole('faculty', 'admin'),
  validateBody([
    { field: 'studentId', type: 'integer', required: true },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = createSession(req.body.studentId, req.user!.userId, req.user!.role, req.ip as string);
      res.status(201).json({ data: session });
    } catch (err) { next(err); }
  }
);

router.patch('/sessions/:id/start',
  requireAuth,
  requireRole('faculty', 'admin'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = startSession(parseInt(req.params.id as string, 10), req.user!.userId, req.user!.role, req.ip as string);
      res.json({ data: session });
    } catch (err) { next(err); }
  }
);

router.patch('/sessions/:id/exit',
  requireAuth,
  requireRole('faculty', 'admin'),
  validateBody([
    { field: 'categoryId', type: 'integer', required: false },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = exitSession(parseInt(req.params.id as string, 10), req.user!.userId, req.body.categoryId, req.user!.role, req.ip as string);
      res.json({ data: session });
    } catch (err) { next(err); }
  }
);

router.patch('/sessions/:id/manual-exit',
  requireAuth,
  requireRole('faculty', 'admin'),
  validateBody([
    { field: 'reason', type: 'string', required: true, min: 1, max: 500 },
    { field: 'categoryId', type: 'integer', required: false },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = manualExitSession(parseInt(req.params.id as string, 10), req.user!.userId, req.body.categoryId, req.body.reason, req.user!.role, req.ip as string);
      res.json({ data: session });
    } catch (err) { next(err); }
  }
);

router.patch('/sessions/:id/complete',
  requireAuth,
  requireOwnership((req) => getSessionById(parseInt(req.params.id as string, 10)).studentId),
  requireRole('faculty', 'admin', 'student'),
  validateBody([
    { field: 'summary', type: 'string', required: true, min: 1, max: 2000 },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = completeSession(parseInt(req.params.id as string, 10), req.user!.userId, req.body.summary, req.user!.role, req.ip as string);
      res.json({ data: session });
    } catch (err) { next(err); }
  }
);

router.patch('/sessions/:id/archive',
  requireAuth,
  requireRole('admin'),
  validateBody([
    { field: 'reason', type: 'string', required: false, max: 500 },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = archiveSession(parseInt(req.params.id as string, 10), req.user!.userId, req.body.reason, req.user!.role, req.ip as string);
      res.json({ data: session });
    } catch (err) { next(err); }
  }
);

export default router;

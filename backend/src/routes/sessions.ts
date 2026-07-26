import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole, requireOwnStudentResource } from '../middleware/auth';
import { getDb } from '../db';
import { getSessionById, listSessions, createSession, startSession, exitSession, manualExitSession, completeSession, archiveSession, getLiveSessionCount, getLiveStudents, overrideSession, getActiveSessionForStudent, getStudentStats, reviewSession } from '../services/session';
import { adminLimiter } from '../middleware/rateLimiter';
import { parsePagination } from '../utils/pagination';
import { validateBody } from '../utils/validation';

const router = Router();

router.get('/sessions/live', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [liveCount, liveStudents] = await Promise.all([getLiveSessionCount(), getLiveStudents()]);
    res.json({ data: { count: liveCount, students: liveStudents } });
  } catch (err) { next(err); }
});

router.get('/sessions/stats/live', requireAuth, requireRole('admin', 'faculty'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [liveCount, liveStudents] = await Promise.all([getLiveSessionCount(), getLiveStudents()]);
    res.json({ data: { count: liveCount, students: liveStudents } });
  } catch (err) { next(err); }
});

router.get('/sessions/active/:studentId', requireAuth, requireOwnStudentResource, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await getActiveSessionForStudent(parseInt(req.params.studentId as string, 10));
    res.json({ data: session });
  } catch (err) { next(err); }
});

router.get('/sessions/stats/:studentId', requireAuth, requireOwnStudentResource, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getStudentStats(parseInt(req.params.studentId as string, 10));
    res.json({ data: stats });
  } catch (err) { next(err); }
});

router.get('/sessions', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    let studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;

    if (req.user!.role === 'student') {
      if (studentId !== undefined) {
        const db = getDb();
        const ownResult = await db.query('SELECT s.id FROM students s JOIN users u ON s.email = u.email WHERE u.id = $1', [req.user!.userId]);
        if (ownResult.rows.length === 0 || (ownResult.rows[0] as { id: number }).id !== studentId) {
          res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS', message: 'You do not own this resource' });
          return;
        }
      } else {
        const db = getDb();
        const ownResult = await db.query('SELECT s.id FROM students s JOIN users u ON s.email = u.email WHERE u.id = $1', [req.user!.userId]);
        if (ownResult.rows.length > 0) {
          studentId = (ownResult.rows[0] as { id: number }).id;
        }
      }
    }

    const filters = {
      studentId,
      status: req.query.status as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
    };
    const result = await listSessions(page, limit, filters);
    res.json({ data: result.sessions, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (err) { next(err); }
});

router.get('/sessions/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await getSessionById(parseInt(req.params.id as string, 10));
    if (req.user!.role === 'student' && session.studentId !== req.user!.userId) {
      const db = getDb();
      const ownResult = await db.query('SELECT s.id FROM students s JOIN users u ON s.email = u.email WHERE u.id = $1', [req.user!.userId]);
      if (ownResult.rows.length === 0 || (ownResult.rows[0] as { id: number }).id !== session.studentId) {
        res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS', message: 'You do not own this resource' });
        return;
      }
    }
    res.json({ data: session });
  } catch (err) { next(err); }
});

router.post('/sessions',
  adminLimiter,
  requireAuth,
  requireRole('admin', 'faculty'),
  validateBody([
    { field: 'studentId', type: 'number', required: true },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await createSession(req.body.studentId, req.user!.userId, req.user!.role, req.ip as string);
      res.status(201).json({ data: session });
    } catch (err) { next(err); }
  }
);

router.patch('/sessions/:id/start',
  adminLimiter,
  requireAuth,
  requireRole('admin', 'faculty'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await startSession(parseInt(req.params.id as string, 10), req.user!.userId, req.user!.role, req.ip as string);
      res.json({ data: session });
    } catch (err) { next(err); }
  }
);

router.patch('/sessions/:id/exit',
  adminLimiter,
  requireAuth,
  requireRole('admin', 'faculty'),
  validateBody([
    { field: 'categoryId', type: 'number', required: false },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await exitSession(parseInt(req.params.id as string, 10), req.user!.userId, req.body.categoryId, req.user!.role, req.ip as string);
      res.json({ data: session });
    } catch (err) { next(err); }
  }
);

router.patch('/sessions/:id/manual-exit',
  adminLimiter,
  requireAuth,
  requireRole('admin', 'faculty'),
  validateBody([
    { field: 'reason', type: 'string', required: true, min: 1 },
    { field: 'categoryId', type: 'number', required: false },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await manualExitSession(parseInt(req.params.id as string, 10), req.user!.userId, req.body.categoryId, req.body.reason, req.user!.role, req.ip as string);
      res.json({ data: session });
    } catch (err) { next(err); }
  }
);

router.patch('/sessions/:id/complete',
  adminLimiter,
  requireAuth,
  requireRole('admin', 'faculty'),
  validateBody([
    { field: 'summary', type: 'string', required: true, min: 1, max: 2000 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await completeSession(parseInt(req.params.id as string, 10), req.user!.userId, req.body.summary, req.user!.role, req.ip as string);
      res.json({ data: session });
    } catch (err) { next(err); }
  }
);

router.patch('/sessions/:id/archive',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await archiveSession(parseInt(req.params.id as string, 10), req.user!.userId, req.body.reason, req.user!.role, req.ip as string);
      res.json({ data: session });
    } catch (err) { next(err); }
  }
);

router.post('/sessions/:id/review',
  adminLimiter,
  requireAuth,
  requireRole('admin', 'faculty'),
  validateBody([
    { field: 'status', type: 'string', required: true },
    { field: 'feedback', type: 'string', required: false, max: 500 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!['approved', 'rejected'].includes(req.body.status)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'status must be approved or rejected' });
        return;
      }
      const session = await reviewSession(parseInt(req.params.id as string, 10), req.user!.userId, req.body.status, req.body.feedback, req.user!.role, req.ip as string);
      res.json({ data: session });
    } catch (err) { next(err); }
  }
);

router.patch('/sessions/:id/override',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  validateBody([
    { field: 'reason', type: 'string', required: true, min: 1 },
    { field: 'status', type: 'string', required: false },
    { field: 'categoryId', type: 'number', required: false },
    { field: 'summary', type: 'string', required: false },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await overrideSession(parseInt(req.params.id as string, 10), req.user!.userId, req.user!.role, req.ip as string, {
        status: req.body.status,
        categoryId: req.body.categoryId,
        summary: req.body.summary,
        reason: req.body.reason,
      });
      res.json({ data: session });
    } catch (err) { next(err); }
  }
);

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { listActivityLogs, getActivityLog, getRecentActivity } from '../services/activityLog';
import { parsePagination } from '../utils/pagination';

const router = Router();

router.get('/activity-logs', requireAuth, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const filters = {
      actorType: req.query.actorType as string | undefined,
      action: req.query.action as string | undefined,
      entityType: req.query.entityType as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
    };
    const result = await listActivityLogs(page, limit, filters);
    res.json({ data: result.logs, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (err) { next(err); }
});

router.get('/activity-logs/recent', requireAuth, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await getRecentActivity();
    res.json({ data: logs });
  } catch (err) { next(err); }
});

router.get('/activity-logs/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await getActivityLog(parseInt(req.params.id as string, 10));
    res.json({ data: log });
  } catch (err) { next(err); }
});

export default router;

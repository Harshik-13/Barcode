import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { listActivityLogs, getActivityLog, getRecentActivity } from '../services/activityLog';
import { parsePagination } from '../utils/pagination';

const router = Router();

router.get('/activity-logs', requireAuth, requireRole('admin'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const filters: Record<string, unknown> = {};
    if (req.query.actorType) filters.actorType = req.query.actorType as string;
    if (req.query.action) filters.action = req.query.action as string;
    if (req.query.entityType) filters.entityType = req.query.entityType as string;
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom as string;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo as string;
    const result = listActivityLogs(page, limit, filters as any);
    res.json({ data: result.logs, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (err) { next(err); }
});

router.get('/activity-logs/recent', requireAuth, requireRole('admin'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const maxResults = Math.min(100, parseInt(req.query.limit as string, 10) || 10);
    const logs = getRecentActivity(maxResults);
    res.json({ data: logs });
  } catch (err) { next(err); }
});

router.get('/activity-logs/:id', requireAuth, requireRole('admin'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = getActivityLog(parseInt(req.params.id as string, 10));
    res.json({ data: log });
  } catch (err) { next(err); }
});

export default router;

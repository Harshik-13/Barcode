import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notification';
import { parsePagination } from '../utils/pagination';

const router = Router();

router.get('/notifications', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const result = getNotifications(req.user!.userId, page, limit);
    res.json({ data: result.notifications, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (err) { next(err); }
});

router.get('/notifications/unread-count', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = getUnreadCount(req.user!.userId);
    res.json({ data: { count } });
  } catch (err) { next(err); }
});

router.patch('/notifications/:id/read', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    markAsRead(parseInt(req.params.id as string, 10), req.user!.userId);
    res.json({ data: { success: true } });
  } catch (err) { next(err); }
});

router.patch('/notifications/read-all', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    markAllAsRead(req.user!.userId);
    res.json({ data: { success: true } });
  } catch (err) { next(err); }
});

export default router;

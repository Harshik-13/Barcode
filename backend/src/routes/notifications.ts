import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, broadcastNotification, getFacultyNotifications, markFacultyNotificationRead } from '../services/notification';
import { adminLimiter } from '../middleware/rateLimiter';
import { parsePagination } from '../utils/pagination';
import { validateBody } from '../utils/validation';

const router = Router();

router.get('/notifications', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const result = await getNotifications(req.user!.userId, page, limit);
    res.json({ data: result.notifications, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (err) { next(err); }
});

router.get('/notifications/unread-count', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await getUnreadCount(req.user!.userId);
    res.json({ data: { count } });
  } catch (err) { next(err); }
});

router.patch('/notifications/:id/read', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await markAsRead(parseInt(req.params.id as string, 10), req.user!.userId);
    res.json({ data: { success: true } });
  } catch (err) { next(err); }
});

router.patch('/notifications/read-all', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await markAllAsRead(req.user!.userId);
    res.json({ data: { success: true } });
  } catch (err) { next(err); }
});

router.post('/notifications/broadcast',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  validateBody([
    { field: 'message', type: 'string', required: true },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await broadcastNotification(req.body.type || 'broadcast', req.body.message);
      res.json({ data: { sentTo: count } });
    } catch (err) { next(err); }
  }
);

router.get('/faculty-notifications', requireAuth, requireRole('faculty', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const result = await getFacultyNotifications(req.user!.userId, page, limit);
    res.json({ data: result.notifications, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (err) { next(err); }
});

router.patch('/faculty-notifications/:id/read', requireAuth, requireRole('faculty', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await markFacultyNotificationRead(parseInt(req.params.id as string, 10), req.user!.userId);
    res.json({ data: { success: true } });
  } catch (err) { next(err); }
});

export default router;

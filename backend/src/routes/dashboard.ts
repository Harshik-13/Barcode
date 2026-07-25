import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getDashboardStats } from '../services/dashboard';

const router = Router();

router.get('/dashboard/stats',
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await getDashboardStats();
      res.json({ data: stats });
    } catch (err) { next(err); }
  }
);

export default router;

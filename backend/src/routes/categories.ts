import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { listCategories, getCategory, createCategory, updateCategory, getCategoryUsage, archiveCategory } from '../services/category';
import { adminLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../utils/validation';

const router = Router();

router.get('/categories', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const categories = await listCategories(status);
    res.json({ data: categories });
  } catch (err) { next(err); }
});

router.get('/categories/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await getCategory(parseInt(req.params.id as string, 10));
    res.json({ data: category });
  } catch (err) { next(err); }
});

router.get('/categories/:id/usage', adminLimiter, requireAuth, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usage = await getCategoryUsage(parseInt(req.params.id as string, 10));
    res.json({ data: usage });
  } catch (err) { next(err); }
});

router.post('/categories',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  validateBody([
    { field: 'name', type: 'string', required: true, min: 1, max: 100 },
    { field: 'description', type: 'string', required: false, max: 500 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = await createCategory(req.body.name, req.body.description, req.user!.userId, req.ip as string);
      res.status(201).json({ data: category });
    } catch (err) { next(err); }
  }
);

router.put('/categories/:id',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  validateBody([
    { field: 'name', type: 'string', required: true, min: 1, max: 100 },
    { field: 'description', type: 'string', required: false, max: 500 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = await updateCategory(parseInt(req.params.id as string, 10), req.body.name, req.body.description, req.user!.userId, req.ip as string);
      res.json({ data: category });
    } catch (err) { next(err); }
  }
);

router.patch('/categories/:id/archive',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = await archiveCategory(parseInt(req.params.id as string, 10), req.user!.userId, req.ip as string);
      res.json({ data: category });
    } catch (err) { next(err); }
  }
);

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { listCategories, getCategory, createCategory, updateCategory, archiveCategory } from '../services/category';
import { validateBody } from '../utils/validation';

const router = Router();

router.get('/categories', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const categories = listCategories(status);
    res.json({ data: categories });
  } catch (err) { next(err); }
});

router.get('/categories/:id', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = getCategory(parseInt(req.params.id as string, 10));
    res.json({ data: category });
  } catch (err) { next(err); }
});

router.post('/categories',
  requireAuth,
  requireRole('admin'),
  validateBody([
    { field: 'name', type: 'string', required: true, min: 1, max: 100 },
    { field: 'description', type: 'string', required: false, max: 500 },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = createCategory(req.body.name, req.body.description, req.user!.userId, req.ip as string);
      res.status(201).json({ data: category });
    } catch (err) { next(err); }
  }
);

router.put('/categories/:id',
  requireAuth,
  requireRole('admin'),
  validateBody([
    { field: 'name', type: 'string', required: true, min: 1, max: 100 },
    { field: 'description', type: 'string', required: false, max: 500 },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = updateCategory(parseInt(req.params.id as string, 10), req.body.name, req.body.description, req.user!.userId, req.ip as string);
      res.json({ data: category });
    } catch (err) { next(err); }
  }
);

router.patch('/categories/:id/archive',
  requireAuth,
  requireRole('admin'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = archiveCategory(parseInt(req.params.id as string, 10), req.user!.userId, req.ip as string);
      res.json({ data: category });
    } catch (err) { next(err); }
  }
);

export default router;

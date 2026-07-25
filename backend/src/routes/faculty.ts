import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { listFaculty, getFaculty, createFaculty, updateFaculty, activateFaculty, deactivateFaculty, getFacultyByEmail } from '../services/faculty';
import { adminLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../utils/validation';

const router = Router();

router.get('/faculty', requireAuth, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const facultyList = await listFaculty(status, search);
    res.json({ data: facultyList });
  } catch (err) { next(err); }
});

router.get('/faculty/by-email', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.query.email as string;
    if (!email) { res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email query parameter is required' }); return; }
    const faculty = await getFacultyByEmail(email);
    res.json({ data: faculty });
  } catch (err) { next(err); }
});

router.get('/faculty/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const faculty = await getFaculty(parseInt(req.params.id as string, 10));
    res.json({ data: faculty });
  } catch (err) { next(err); }
});

router.post('/faculty',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  validateBody([
    { field: 'email', type: 'email', required: true },
    { field: 'name', type: 'string', required: true, min: 1, max: 200 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const faculty = await createFaculty(req.body.email, req.body.name, req.user!.userId, req.ip as string);
      res.status(201).json({ data: faculty });
    } catch (err) { next(err); }
  }
);

router.put('/faculty/:id',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  validateBody([
    { field: 'name', type: 'string', required: true, min: 1, max: 200 },
    { field: 'email', type: 'string', required: true },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const faculty = await updateFaculty(parseInt(req.params.id as string, 10), req.body.name, req.body.email, req.user!.userId, req.ip as string);
      res.json({ data: faculty });
    } catch (err) { next(err); }
  }
);

router.patch('/faculty/:id/deactivate',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const faculty = await deactivateFaculty(parseInt(req.params.id as string, 10), req.user!.userId, req.ip as string);
      res.json({ data: faculty });
    } catch (err) { next(err); }
  }
);

router.patch('/faculty/:id/activate',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const faculty = await activateFaculty(parseInt(req.params.id as string, 10), req.user!.userId, req.ip as string);
      res.json({ data: faculty });
    } catch (err) { next(err); }
  }
);

export default router;

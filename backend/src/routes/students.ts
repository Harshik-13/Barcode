import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole, requireOwnStudentResource } from '../middleware/auth';
import { listStudents, getStudent, lookupStudent, searchStudents, adminSearchStudents, createStudent, updateStudent, suspendStudent, departStudent, getStudentHistory } from '../services/student';
import { adminLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../utils/validation';
import { parsePagination } from '../utils/pagination';

const router = Router();

router.get('/students', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status as string | undefined;
    const search = req.query.q as string | undefined;
    const result = await listStudents(page, limit, status, search);
    res.json({ data: result.students, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (err) { next(err); }
});

router.get('/students/lookup', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Query parameter q is required' });
      return;
    }
    const student = await lookupStudent(query);
    res.json({ data: student });
  } catch (err) { next(err); }
});

router.get('/students/search', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Query parameter q is required' });
      return;
    }
    const students = await searchStudents(q);
    res.json({ data: students });
  } catch (err) { next(err); }
});

router.get('/admin/students/search', requireAuth, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length === 0) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Query parameter q is required' });
      return;
    }
    const students = await adminSearchStudents(q.trim());
    res.json({ data: students });
  } catch (err) { next(err); }
});

router.get('/students/:id', requireAuth, requireOwnStudentResource, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await getStudent(parseInt(req.params.id as string, 10));
    res.json({ data: student });
  } catch (err) { next(err); }
});

router.get('/students/:id/history', requireAuth, requireOwnStudentResource, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const result = await getStudentHistory(parseInt(req.params.id as string, 10), page, limit);
    res.json({ data: result.sessions, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (err) { next(err); }
});

router.post('/students',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  validateBody([
    { field: 'roll', type: 'string', required: true, min: 1, max: 50 },
    { field: 'name', type: 'string', required: true, min: 1, max: 200 },
    { field: 'branch', type: 'string', required: false, max: 100 },
    { field: 'section', type: 'string', required: false, max: 50 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await createStudent(req.body.roll, req.body.name, req.user!.userId, req.ip as string, req.body.branch, req.body.section);
      res.status(201).json({ data: student });
    } catch (err) { next(err); }
  }
);

router.put('/students/:id',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  validateBody([
    { field: 'name', type: 'string', required: true, min: 1, max: 200 },
    { field: 'branch', type: 'string', required: false, max: 100 },
    { field: 'section', type: 'string', required: false, max: 50 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await updateStudent(parseInt(req.params.id as string, 10), req.body.name, req.user!.userId, req.ip as string, req.body.branch, req.body.section);
      res.json({ data: student });
    } catch (err) { next(err); }
  }
);

router.patch('/students/:id/suspend',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await suspendStudent(parseInt(req.params.id as string, 10), req.user!.userId, req.ip as string);
      res.json({ data: student });
    } catch (err) { next(err); }
  }
);

router.patch('/students/:id/depart',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await departStudent(parseInt(req.params.id as string, 10), req.user!.userId, req.ip as string);
      res.json({ data: student });
    } catch (err) { next(err); }
  }
);

export default router;

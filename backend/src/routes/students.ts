import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { listStudents, getStudent, lookupStudent, searchStudents, createStudent, updateStudent, suspendStudent, departStudent, getStudentHistory } from '../services/student';
import { validateBody } from '../utils/validation';
import { parsePagination } from '../utils/pagination';

const router = Router();

router.get('/students', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status as string | undefined;
    const result = listStudents(page, limit, status);
    res.json({ data: result.students, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (err) { next(err); }
});

router.get('/students/lookup', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Query parameter q is required' });
      return;
    }
    const student = lookupStudent(query);
    res.json({ data: student });
  } catch (err) { next(err); }
});

router.get('/students/search', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Query parameter q is required' });
      return;
    }
    const students = searchStudents(q);
    res.json({ data: students });
  } catch (err) { next(err); }
});

router.get('/students/:id', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = getStudent(parseInt(req.params.id as string, 10));
    res.json({ data: student });
  } catch (err) { next(err); }
});

router.get('/students/:id/history', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const result = getStudentHistory(parseInt(req.params.id as string, 10), page, limit);
    res.json({ data: result.sessions, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
  } catch (err) { next(err); }
});

router.post('/students',
  requireAuth,
  requireRole('admin'),
  validateBody([
    { field: 'roll', type: 'string', required: true, min: 1, max: 50 },
    { field: 'name', type: 'string', required: true, min: 1, max: 200 },
    { field: 'email', type: 'email', required: false },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = createStudent(req.body.roll, req.body.name, req.body.email, req.user!.userId, req.ip as string);
      res.status(201).json({ data: student });
    } catch (err) { next(err); }
  }
);

router.put('/students/:id',
  requireAuth,
  requireRole('admin'),
  validateBody([
    { field: 'name', type: 'string', required: true, min: 1, max: 200 },
    { field: 'email', type: 'email', required: false },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = updateStudent(parseInt(req.params.id as string, 10), req.body.name, req.body.email, req.user!.userId, req.ip as string);
      res.json({ data: student });
    } catch (err) { next(err); }
  }
);

router.patch('/students/:id/suspend',
  requireAuth,
  requireRole('admin'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = suspendStudent(parseInt(req.params.id as string, 10), req.user!.userId, req.ip as string);
      res.json({ data: student });
    } catch (err) { next(err); }
  }
);

router.patch('/students/:id/depart',
  requireAuth,
  requireRole('admin'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = departStudent(parseInt(req.params.id as string, 10), req.user!.userId, req.ip as string);
      res.json({ data: student });
    } catch (err) { next(err); }
  }
);

export default router;

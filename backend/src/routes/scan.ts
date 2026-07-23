import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { processScan } from '../services/scan';
import { validateBody } from '../utils/validation';

const router = Router();

router.post('/scan',
  requireAuth,
  requireRole('faculty', 'admin'),
  validateBody([
    { field: 'barcode', type: 'string', required: true, min: 1, max: 100 },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = processScan(req.body.barcode, req.user!.userId, req.user!.role, req.ip as string);

      if (result.code === 'SUCCESS_ENTRY' || result.code === 'SUCCESS_EXIT') {
        res.json({ data: result });
      } else {
        res.status(422).json({ error: result.code, message: result.message, details: 'details' in result ? result.details : undefined });
      }
    } catch (err) { next(err); }
  }
);

export default router;

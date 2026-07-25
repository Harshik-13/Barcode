import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { processScan } from '../services/scan';
import { scanLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../utils/validation';

const router = Router();

router.post('/scan',
  scanLimiter,
  requireAuth,
  requireRole('admin', 'faculty'),
  validateBody([
    { field: 'barcode', type: 'string', required: true },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const barcode = req.body.barcode;
      const result = await processScan(barcode, req.user!.userId, req.user!.role, req.ip as string);
      const statusMap: Record<string, number> = {
        'SUCCESS_ENTRY': 200,
        'SUCCESS_EXIT': 200,
        'INVALID_BARCODE': 400,
        'STUDENT_NOT_FOUND': 422,
        'ACCOUNT_INACTIVE': 422,
        'SUMMARY_REQUIRED': 422,
        'DUPLICATE_SCAN': 409,
        'INVALID_SESSION_STATE': 409,
      };
      const status = statusMap[result.code] ?? 500;
      if (status >= 400) {
        const response: Record<string, unknown> = { error: result.code, message: (result as { message: string }).message };
        if ('details' in result && result.details) response.details = result.details;
        res.status(status).json(response);
      } else {
        res.status(status).json({ data: result });
      }
    } catch (err) { next(err); }
  }
);

export default router;

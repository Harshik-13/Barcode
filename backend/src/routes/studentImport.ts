import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimiter';
import { importStudents } from '../services/studentImport';
import { IMPORT } from '../../../shared';
import { ValidationError } from '../utils/errors';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMPORT.MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const allowed = IMPORT.ALLOWED_MIME_TYPES as readonly string[];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('INVALID_FILE_TYPE', 'Only .xlsx files are accepted'));
    }
  },
});

const router = Router();

router.post(
  '/admin/students/import',
  adminLimiter,
  requireAuth,
  requireRole('admin'),
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Excel file is required' });
        return;
      }

      const result = await importStudents(req.file, req.user!.userId, req.ip as string);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

export default router;

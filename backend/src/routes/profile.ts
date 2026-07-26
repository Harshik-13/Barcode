import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../middleware/auth';
import { getProfile, updateProfile } from '../services/profile';
import { uploadProfilePicture, removeProfilePicture } from '../services/profilePicture';
import { changePassword } from '../services/password';
import { config } from '../config';
import { authLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../utils/validation';
import { PROFILE_PICTURE } from '../../../shared';
import { NotFoundError } from '../utils/errors';
import fs from 'fs';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PROFILE_PICTURE.MAX_SIZE_BYTES },
});

const router = Router();

router.get('/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await getProfile(req.user!.userId);
    res.json({ data: profile });
  } catch (err) { next(err); }
});

router.patch('/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, hostel, branch, section } = req.body;
    const updates: { name?: string; hostel?: string | null; branch?: string | null; section?: string | null } = {};
    if (name !== undefined) updates.name = name;
    if (hostel !== undefined) updates.hostel = hostel;
    if (branch !== undefined) updates.branch = branch;
    if (section !== undefined) updates.section = section;
    const profile = await updateProfile(req.user!.userId, updates, req.user!.userId, req.ip as string);
    res.json({ data: profile });
  } catch (err) { next(err); }
});

router.patch('/profile/change-password',
  authLimiter,
  requireAuth,
  validateBody([
    { field: 'currentPassword', type: 'string', required: true, min: 1 },
    { field: 'newPassword', type: 'string', required: true, min: 1 },
    { field: 'confirmPassword', type: 'string', required: true, min: 1 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await changePassword(
        req.user!.userId,
        req.body.currentPassword,
        req.body.newPassword,
        req.body.confirmPassword,
        req.user!.role,
        req.ip as string
      );
      res.json({ message: 'Password updated successfully' });
    } catch (err) { next(err); }
  }
);

router.post(
  '/profile/picture',
  requireAuth,
  upload.single('picture'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Picture file is required' });
        return;
      }
      const filename = await uploadProfilePicture(req.user!.userId, req.file, req.user!.role as 'student' | 'faculty' | 'admin');
      res.json({ data: { profilePicture: filename } });
    } catch (err) { next(err); }
  }
);

router.delete('/profile/picture', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await removeProfilePicture(req.user!.userId, req.user!.role as 'student' | 'faculty' | 'admin');
    res.json({ data: { profilePicture: null } });
  } catch (err) { next(err); }
});

router.get('/profile/picture/:userId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId as string, 10);
    if (isNaN(userId)) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid user ID' });
      return;
    }
    const { getDb } = await import('../db');
    const db = getDb();
    const result = await db.query('SELECT profile_picture FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) throw new NotFoundError('User');
    const filename = (result.rows[0] as { profile_picture: string | null }).profile_picture;
    if (!filename) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'No profile picture' });
      return;
    }

    const isOld = filename.startsWith('pp_');
    const filePath = isOld
      ? path.join(config.upload.profileDir, filename)
      : path.join(config.upload.profileDir, 'users', String(userId), filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Profile picture file not found' });
      return;
    }

    const ext = isOld ? path.extname(filename).toLowerCase() : '.webp';
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) { next(err); }
});

export default router;

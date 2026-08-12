import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { authenticate, getCurrentUser, logLogout, logPermissionDenied } from '../services/auth';
import { loginWithGoogleToken, completeOnboarding } from '../services/googleAuth';
import { authLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../utils/validation';
import { getDb } from '../db';

const router = Router();

router.post('/auth/google',
  authLimiter,
  validateBody([
    { field: 'credential', type: 'string', required: true, min: 1 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await loginWithGoogleToken(req.body.credential, req.ip as string);
      res.json(result);
    } catch (err) { next(err); }
  }
);

router.post('/auth/login',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getCurrentUser(req.user!.userId);
      res.json(user);
    } catch (err) { next(err); }
  }
);

router.post('/auth/logout', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logLogout(req.user!.userId, req.user!.role, req.ip as string);
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
});

router.get('/auth/onboarding/status', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const userResult = await db.query('SELECT role_id FROM users WHERE id = $1', [req.user!.userId]);
    if (userResult.rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }

    const user = userResult.rows[0] as { role_id: string };
    if (user.role_id !== 'student') { res.json({ needsOnboarding: false }); return; }

    const stuResult = await db.query(
      'SELECT s.branch FROM students s JOIN users u ON s.email = u.email WHERE u.id = $1',
      [req.user!.userId]
    );
    if (stuResult.rows.length === 0) { res.json({ needsOnboarding: false }); return; }

    const student = stuResult.rows[0] as { branch: string | null };
    res.json({ needsOnboarding: !student.branch });
  } catch (err) { next(err); }
});

router.post('/auth/onboarding',
  requireAuth,
  validateBody([
    { field: 'branch', type: 'string', required: true, min: 1 },
    { field: 'section', type: 'string', required: true, min: 1 },
    { field: 'hostel', type: 'string', required: false },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await completeOnboarding(
        req.user!.userId,
        req.body.branch,
        req.body.section,
        req.body.hostel,
        req.ip as string
      );
      res.json({ message: 'Onboarding completed successfully' });
    } catch (err) { next(err); }
  }
);

export default router;

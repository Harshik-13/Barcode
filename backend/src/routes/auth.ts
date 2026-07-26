import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { authenticate, getCurrentUser, logLogout, logPermissionDenied } from '../services/auth';
import { requestPasswordReset, resetPassword } from '../services/passwordReset';
import { authLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../utils/validation';

const router = Router();

router.post('/auth/login',
  authLimiter,
  validateBody([
    { field: 'email', type: 'string', required: true, min: 1 },
    { field: 'password', type: 'string', required: true, min: 1 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authenticate(req.body.email, req.body.password, req.ip as string);
      res.json(result);
    } catch (err) { next(err); }
  }
);

router.post('/auth/forgot-password',
  authLimiter,
  validateBody([
    { field: 'email', type: 'string', required: true, min: 1 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requestPasswordReset(req.body.email, req.ip as string);
      res.json({ message: 'If the account exists, password reset instructions have been sent.' });
    } catch (err) { next(err); }
  }
);

router.post('/auth/reset-password',
  authLimiter,
  validateBody([
    { field: 'token', type: 'string', required: true, min: 1 },
    { field: 'newPassword', type: 'string', required: true, min: 1 },
    { field: 'confirmPassword', type: 'string', required: true, min: 1 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await resetPassword(req.body.token, req.body.newPassword, req.body.confirmPassword, req.ip as string);
      res.json({ message: 'Password has been reset successfully.' });
    } catch (err) { next(err); }
  }
);

router.get('/auth/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getCurrentUser(req.user!.userId);
    res.json(user);
  } catch (err) { next(err); }
});

router.post('/auth/logout', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logLogout(req.user!.userId, req.user!.role, req.ip as string);
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
});

export default router;

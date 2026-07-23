import { Router, Request, Response } from 'express';
import { authenticate, getCurrentUser, logLogout } from '../services/auth';
import { requireAuth } from '../middleware/auth';
import { authRateLimiter } from '../middleware/authRateLimiter';
import { validateBody } from '../utils/validation';

const router = Router();

const loginValidation = [
  { field: 'email', type: 'email' as const, required: true },
  { field: 'password', type: 'string' as const, required: true, min: 1 },
];

router.post('/auth/login', authRateLimiter, validateBody(loginValidation), (req: Request, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] as string) ?? req.ip;
  const result = authenticate(req.body.email, req.body.password, ip);
  res.json(result);
});

router.post('/auth/logout', requireAuth, (req: Request, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] as string) ?? req.ip;
  logLogout(req.user!.userId, req.user!.role, ip);
  res.json({ message: 'Logged out successfully' });
});

router.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = getCurrentUser(req.user!.userId);
  res.json(user);
});

export default router;

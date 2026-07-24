import { Router, Request, Response, NextFunction } from 'express';
import { startActivation, verifyOtp, setPassword, resendOtp, checkActivationStatus } from '../services/activation';
import { rateLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../utils/validation';

const router = Router();

const rollValidation = [
  { field: 'roll', type: 'string' as const, required: true, min: 1, max: 50 },
];

const otpValidation = [
  { field: 'roll', type: 'string' as const, required: true, min: 1, max: 50 },
  { field: 'otp', type: 'string' as const, required: true, min: 6, max: 6 },
];

const passwordValidation = [
  { field: 'activationToken', type: 'string' as const, required: true, min: 1 },
  { field: 'password', type: 'string' as const, required: true, min: 8, max: 128 },
];

router.post('/activation/start', rateLimiter, validateBody(rollValidation), (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = (req.headers['x-forwarded-for'] as string) ?? req.ip;
    const result = startActivation(req.body.roll, ip);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/activation/resend-otp', rateLimiter, validateBody(rollValidation), (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = (req.headers['x-forwarded-for'] as string) ?? req.ip;
    const result = resendOtp(req.body.roll, ip);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/activation/verify-otp', rateLimiter, validateBody(otpValidation), (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = (req.headers['x-forwarded-for'] as string) ?? req.ip;
    const result = verifyOtp(req.body.roll, req.body.otp, ip);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/activation/set-password', rateLimiter, validateBody(passwordValidation), (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = (req.headers['x-forwarded-for'] as string) ?? req.ip;
    const result = setPassword(req.body.activationToken, req.body.password, ip);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/activation/status', rateLimiter, validateBody(rollValidation), (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = checkActivationStatus(req.body.roll);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;

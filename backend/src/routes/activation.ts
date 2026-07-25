import { Router, Request, Response, NextFunction } from 'express';
import { startActivation, verifyOtp, setPassword, resendOtp, checkActivationStatus } from '../services/activation';
import { validateBody } from '../utils/validation';

const router = Router();

router.post('/activation/start',
  validateBody([
    { field: 'roll', type: 'string', required: true, min: 1, max: 50 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await startActivation(req.body.roll, req.ip as string);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

router.post('/activation/verify-otp',
  validateBody([
    { field: 'roll', type: 'string', required: true, min: 1, max: 50 },
    { field: 'otp', type: 'string', required: true, min: 6, max: 6 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await verifyOtp(req.body.roll, req.body.otp, req.ip as string);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

router.post('/activation/set-password',
  validateBody([
    { field: 'activationToken', type: 'string', required: true },
    { field: 'password', type: 'string', required: true, min: 8 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await setPassword(req.body.activationToken, req.body.password, req.ip as string);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

router.post('/activation/resend-otp',
  validateBody([
    { field: 'roll', type: 'string', required: true, min: 1, max: 50 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await resendOtp(req.body.roll, req.ip as string);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

router.post('/activation/status',
  validateBody([
    { field: 'roll', type: 'string', required: true, min: 1, max: 50 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await checkActivationStatus(req.body.roll);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

export default router;

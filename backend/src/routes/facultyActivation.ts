import { Router, Request, Response, NextFunction } from 'express';
import { startFacultyActivation, verifyFacultyOtp, setFacultyPassword, checkFacultyActivationStatus, resendFacultyOtp } from '../services/facultyActivation';
import { validateBody } from '../utils/validation';

const router = Router();

router.post('/faculty/activation/start',
  validateBody([
    { field: 'email', type: 'string', required: true },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await startFacultyActivation(req.body.email, req.ip as string);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

router.post('/faculty/activation/verify-otp',
  validateBody([
    { field: 'email', type: 'string', required: true },
    { field: 'otp', type: 'string', required: true, min: 6, max: 6 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await verifyFacultyOtp(req.body.email, req.body.otp, req.ip as string);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

router.post('/faculty/activation/set-password',
  validateBody([
    { field: 'activationToken', type: 'string', required: true },
    { field: 'password', type: 'string', required: true, min: 8 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await setFacultyPassword(req.body.activationToken, req.body.password, req.ip as string);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

router.post('/faculty/activation/status',
  validateBody([
    { field: 'email', type: 'string', required: true },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await checkFacultyActivationStatus(req.body.email);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

router.post('/faculty/activation/resend-otp',
  validateBody([
    { field: 'email', type: 'string', required: true },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await resendFacultyOtp(req.body.email, req.ip as string);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

export default router;

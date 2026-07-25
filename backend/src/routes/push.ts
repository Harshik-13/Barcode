import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { getVapidPublicKey, createPushSubscription, deactivatePushSubscription, getPushSubscriptions } from '../services/push';
import { validateBody } from '../utils/validation';

const router = Router();

router.get('/push/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ data: { publicKey: getVapidPublicKey() } });
});

router.get('/push/subscriptions',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subs = await getPushSubscriptions(req.user!.userId);
      res.json({ data: subs.map(s => ({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth }, userAgent: s.userAgent })) });
    } catch (err) { next(err); }
  }
);

router.post('/push/subscribe',
  requireAuth,
  validateBody([
    { field: 'endpoint', type: 'string', required: true },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body.keys || typeof req.body.keys !== 'object' || !req.body.keys.p256dh || !req.body.keys.auth) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'keys object with p256dh and auth is required' });
        return;
      }
      const sub = await createPushSubscription(
        req.user!.userId,
        req.body.endpoint,
        req.body.keys.p256dh,
        req.body.keys.auth,
        req.headers['user-agent']
      );
      res.status(201).json({ data: sub });
    } catch (err) { next(err); }
  }
);

router.post('/push/unsubscribe',
  requireAuth,
  validateBody([
    { field: 'endpoint', type: 'string', required: true },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deactivatePushSubscription(req.user!.userId, req.body.endpoint);
      res.json({ message: 'Unsubscribed successfully' });
    } catch (err) { next(err); }
  }
);

export default router;

import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  try {
    const result = await getDb().query('SELECT 1 as ok');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', message: 'Database connection failed' });
  }
});

export default router;

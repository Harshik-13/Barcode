import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  try {
    const stmt = getDb().prepare('SELECT 1 as ok');
    stmt.step();
    const row = stmt.getAsObject() as { ok: number };
    stmt.free();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', message: 'Database connection failed' });
  }
});

export default router;

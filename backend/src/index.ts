import { config, validateEnv } from './config';
import { initDb, getDb, saveDb, closeDb, validateDb } from './db';
import { migrate } from './db/migrate';
import { seed } from './db/seed';
import app from './app';
import { logger } from './utils/logger';
import { verifySmtp } from './services/email';

validateEnv();

async function bootstrap(): Promise<void> {
  logger.info('Starting database bootstrap...');

  await initDb();

  await migrate({ skipClose: true });

  const db = getDb();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM roles');
  stmt.step();
  const { count } = stmt.getAsObject() as { count: number };
  stmt.free();

  if (count === 0) {
    logger.info('Database is fresh, running seed...');
    await seed({ skipClose: true });
  }

  validateDb();
  saveDb();
  logger.info('Database bootstrap completed successfully');
}

async function start(): Promise<void> {
  await bootstrap();

  await verifySmtp();

  const port = config.port;
  app.listen(port, () => {
    logger.info(`Server running on port ${port} in ${config.env} mode`);
    logger.info(`Database: ${config.database.path}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('SIGINT', () => {
  logger.info('Shutting down...');
  saveDb();
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down...');
  saveDb();
  closeDb();
  process.exit(0);
});

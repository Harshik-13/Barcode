import { config, validateEnv } from './config';
import { initDb, saveDb, closeDb } from './db';
import app from './app';
import { logger } from './utils/logger';

validateEnv();

async function start(): Promise<void> {
  await initDb();
  saveDb();

  const port = config.port;
  app.listen(port, () => {
    logger.info(`Server running on port ${port} in ${config.env} mode`);
    logger.info(`Database: ${config.database.path}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
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

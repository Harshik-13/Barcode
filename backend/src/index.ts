import { config, validateEnv } from './config';
import { initDb, getDb, saveDb, closeDb, validateDb } from './db';
import { migrate } from './db/migrate';
import { seed } from './db/seed';
import app from './app';
import { logger } from './utils/logger';
import { verifySmtp } from './services/email';
import { autoCompleteSessions } from './services/session';
import { sendReminders } from './services/reminder';
import { cleanupPushSubscriptions } from './services/push';
import { Server } from 'http';

validateEnv();

let server: Server;
let maintenanceInterval: ReturnType<typeof setInterval> | null = null;
let isShuttingDown = false;
let runningJobs = 0;

async function bootstrap(): Promise<void> {
  logger.info('Starting database bootstrap...');

  await initDb();

  await migrate({ skipClose: true });

  const db = getDb();
  const rolesCountResult = await db.query('SELECT COUNT(*) as count FROM roles');
  const count = parseInt(rolesCountResult.rows[0].count, 10);

  if (count === 0) {
    logger.info('Database is fresh, running seed...');
    await seed({ skipClose: true });
  }

  await validateDb();
  logger.info('Database bootstrap completed successfully');
}

async function start(): Promise<void> {
  await bootstrap();

  await verifySmtp();

  const port = config.port;
  server = app.listen(port, () => {
    logger.info(`Server running on port ${port} in ${config.env} mode`);
    logger.info(`Database: ${config.database.url}`);
  });

  maintenanceInterval = setInterval(async () => {
    if (isShuttingDown || runningJobs > 0) return;

    runningJobs++;
    try {
      const autoResult = await autoCompleteSessions();
      if (autoResult.autoCompleted > 0) {
        logger.info(`Auto-completed ${autoResult.autoCompleted} session(s)`);
      }
      await sendReminders();
      const cleaned = await cleanupPushSubscriptions();
      if (cleaned > 0) {
        logger.info(`Cleaned up ${cleaned} expired push subscription(s)`);
      }
    } catch (err) {
      logger.error('Scheduled maintenance check failed', { error: (err as Error).message });
    } finally {
      runningJobs--;
    }
  }, 5 * 60 * 1000);
}

function shutdown(signal: string): void {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  if (maintenanceInterval) {
    clearInterval(maintenanceInterval);
    maintenanceInterval = null;
  }

  server.close(() => {
    logger.info('HTTP server closed');
    finishShutdown();
  });

  const forceExit = setTimeout(() => {
    logger.warn('Forced shutdown after timeout');
    finishShutdown();
  }, 10000);

  async function finishShutdown() {
    clearTimeout(forceExit);
    try {
      await closeDb();
      logger.info('Shutdown complete');
    } catch (err) {
      logger.error('Error during shutdown', { error: (err as Error).message });
    }
    process.exit(0);
  }
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
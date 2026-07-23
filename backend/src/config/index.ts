import dotenv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV !== 'test') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '8080', 10),
  database: {
    path: process.env.DATABASE_PATH ?? './data/workspace.db',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    expiryHours: parseInt(process.env.JWT_EXPIRY_HOURS ?? '12', 10),
  },
  cors: {
    origins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(','),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100', 10),
  },
  log: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
} as const;

export const isDev = config.env === 'development';
export const isTest = config.env === 'test';
export const isProd = config.env === 'production';

const REQUIRED_VARS: string[] = ['JWT_SECRET'];

export function validateEnv(): void {
  for (const variable of REQUIRED_VARS) {
    if (!process.env[variable]) {
      throw new Error(`Missing required environment variable: ${variable}`);
    }
  }
}

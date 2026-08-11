import dotenv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV !== 'test') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '8080', 10),
  database: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:Harshik@13@localhost:5432/workspace',
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
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '10', 10),
  },
  googleAuth: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    jwksUri: process.env.GOOGLE_JWKS_URI ?? 'https://www.googleapis.com/oauth2/v3/certs',
    allowedDomains: (process.env.ALLOWED_EMAIL_DOMAINS ?? '@vnrvjiet.in')
      .split(',')
      .map((domain) => domain.trim())
      .filter(Boolean),
  },
  activation: {
    studentEmailDomain: process.env.STUDENT_EMAIL_DOMAIN ?? '@vnrvjiet.in',
    otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES ?? '10', 10),
    otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10),
    otpCooldownSeconds: parseInt(process.env.ACTIVATION_COOLDOWN_SECONDS ?? '30', 10),
  },
  email: {
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'Hive <8hattendance@gmail.com>',
  },
  log: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
  push: {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? '',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? '',
    vapidSubject: process.env.VAPID_SUBJECT ?? 'mailto:admin@8hour-workspace.com',
  },
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  upload: {
    profileDir: path.resolve(process.cwd(), 'uploads', 'profiles'),
    maxFileSize: 2 * 1024 * 1024,
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
  if (isProd && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
    throw new Error('Missing required SMTP credentials. Set SMTP_USER and SMTP_PASS.');
  }
  if (isProd && (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY)) {
    throw new Error('Missing required VAPID keys for push notifications. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.');
  }
}

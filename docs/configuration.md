# Configuration Conventions

## Types of Configuration

| Type | Description | Storage | Change Frequency |
|------|-------------|---------|-----------------|
| Application config | DB path, port, CORS origins | Environment variables | Per deployment |
| Feature flags | Toggle features on/off | Config file (`feature-flags.ts`) | Per deployment or runtime |
| Constants | Business rules, limits, timeouts | Code constants (`constants.ts`) | Per release |
| Environment config | Which environment is this? | `NODE_ENV` / `APP_ENV` | Per deployment |

---

## Application Configuration

Configuration is loaded from environment variables at startup, with sensible defaults.

### Backend

```typescript
// backend/src/config/index.ts
export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '8080', 10),
  database: {
    path: process.env.DATABASE_PATH ?? './data/workspace.db',
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
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
```

### Frontend

Frontend config exposed at build time via `import.meta.env`:

```typescript
// frontend/src/config/index.ts
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
  appEnv: (import.meta.env.VITE_APP_ENV as string) ?? 'development',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
} as const;
```

---

## Feature Flags

Feature flags allow enabling/disabling features without redeploying.

```typescript
// frontend/src/config/feature-flags.ts
export const featureFlags = {
  // When true, show the experimental dashboard view
  enableNewDashboard: true,

  // When true, enable offline scan queue
  enableOfflineSync: true,

  // When true, show debug info in UI (dev only)
  enableDevTools: config.appEnv === 'development',
} as const;
```

For runtime-toggled flags (by environment):

```typescript
// backend/src/config/feature-flags.ts
export const featureFlags = {
  enableBatchOperations: config.env !== 'development',
  enableDetailedAuditLogging: config.env === 'production',
  sessionTimeoutMinutes: config.env === 'production' ? 480 : 1440, // 8h vs 24h
};
```

---

## Constants

Business constants are defined in `constants.ts` files:

```typescript
// shared/constants/index.ts
export const SESSION = {
  MAX_HOURS: 8,
  MIN_HOURS: 0.5,
  GRACE_MINUTES: 15,
  REMINDER_AFTER_HOURS: 4,
} as const;

export const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin',
} as const;

export const SESSION_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;

export const NOTIFICATION_TYPES = {
  ENTRY: 'entry',
  EXIT: 'exit',
  REMINDER: 'reminder',
} as const;

export const ERROR_CODES = {
  [...]
} as const;
```

---

## Environment-Specific Configuration

### Configuration by Environment

```typescript
const envConfigs = {
  development: {
    logLevel: 'debug',
    rateLimitMax: 1000,
    jwtExpiryHours: 24,
  },
  test: {
    logLevel: 'silent',
    databasePath: ':memory:',
    rateLimitMax: 10000,
  },
  staging: {
    logLevel: 'info',
    rateLimitMax: 200,
    jwtExpiryHours: 12,
  },
  production: {
    logLevel: 'info',
    rateLimitMax: 100,
    jwtExpiryHours: 8,
  },
} as const;
```

---

## Validation at Startup

All configuration should be validated when the application starts:

```typescript
// backend/src/config/validate.ts
const requiredString = ['JWT_SECRET'];
const requiredNumber = ['PORT'];

export function validateConfig(): void {
  for (const key of requiredString) {
    if (!process.env[key]) {
      throw new Error(`Missing required config: ${key}`);
    }
  }
  for (const key of requiredNumber) {
    if (isNaN(parseInt(process.env[key] ?? '', 10))) {
      throw new Error(`Invalid numeric config: ${key}`);
    }
  }
}
```

---

## Configuration Access Rules

1. **Config is read-only after startup.** Never modify config objects at runtime.
2. **Config is accessed through typed objects.** Avoid accessing `process.env` directly in business logic.
3. **Feature flags are not security controls.** Feature flags hide UI elements, but the backend must still enforce authorization.
4. **Environment-based defaults** should make the app runnable with zero configuration in development.

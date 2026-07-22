# Environment Strategy

## Environments

| Environment | Purpose | Who Uses It | Data |
|-------------|---------|-------------|------|
| **development** | Local development | Developers | Seeded test data |
| **testing** | Automated test runs | CI pipelines | Ephemeral, fresh per run |
| **staging** | Pre-production validation | QA, reviewers | Anonymized production-like |
| **production** | Live system | End users | Real data |

---

## Configuration Separation

Configuration is separated by **what it is**, not **where it runs**:

| Category | Storage | Example |
|----------|---------|---------|
| Code config | `.ts` files in `config/` | API port, DB path, CORS origins |
| Secret values | Environment variables / secrets manager | JWT secret, DB password, OAuth client secret |
| Feature flags | `config/feature-flags.ts` | `enableNewScanner: boolean` |
| Environment identity | `NODE_ENV` or `APP_ENV` | `development`, `production` |

---

## Environment Variables

### Naming Convention

- Frontend: `VITE_` prefix (required by Vite for client exposure)
- Backend: `UPPER_SNAKE_CASE` without prefix
- Shared: document in `.env.example` files

### Required Variables

**Backend (`backend/.env`)**

```
NODE_ENV=development
PORT=8080
DATABASE_PATH=./data/workspace.db
JWT_SECRET=change-me-in-production
JWT_EXPIRY_HOURS=12
CORS_ORIGINS=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=debug
```

**Frontend (`frontend/.env`)**

```
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_ENV=development
VITE_GOOGLE_CLIENT_ID=
```

---

## Secrets Management

### Development

- `.env` files with dummy values committed as `.env.example`
- Real `.env` is gitignored and never committed
- Developers copy `.env.example` → `.env` and fill in their values

### Production

- Never use `.env` files in production
- Use environment variables set by the deployment platform
- Secrets stored in: GitHub Actions secrets, Docker secrets, or a secrets manager (HashiCorp Vault, AWS Secrets Manager)
- JWT secret: 256-bit random value, rotated every 90 days
- OAuth client secrets: managed through Google Cloud Console

### Rules

1. **Never commit secrets.** If a secret is accidentally committed, rotate it immediately.
2. **Never log secrets.** Secrets must never appear in logs, error messages, or stack traces.
3. **Never hardcode secrets.** Not even in tests. Use environment variables or test-specific config.
4. **`.env` files** are in `.gitignore`. Only `.env.example` is committed.

---

## Environment-Specific Configuration

### Backend Configuration Module

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

### Environment Detection

```typescript
export const isDev = config.env === 'development';
export const isTest = config.env === 'test';
export const isProd = config.env === 'production';
```

---

## .gitignore Rules

```
# Environment files
.env
.env.local
.env.production

# Database
*.db
*.db-journal
/data/

# Build output
dist/
build/
node_modules/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/
```

---

## Environment Variable Validation

On startup, validate that all required environment variables are set:

```typescript
const REQUIRED_VARS = ['JWT_SECRET', 'DATABASE_PATH'] as const;

export function validateEnv(): void {
  for (const variable of REQUIRED_VARS) {
    if (!process.env[variable]) {
      throw new Error(`Missing required environment variable: ${variable}`);
    }
  }
}
```

Fail fast: if a required variable is missing, the application should crash immediately with a clear error message.

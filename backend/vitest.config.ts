import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@workspace/shared': path.resolve(__dirname, '../shared'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret',
      ACTIVATION_COOLDOWN_SECONDS: '0',
      GOOGLE_CLIENT_ID: 'test-google-client-id',
      ALLOWED_EMAIL_DOMAINS: '@vnrvjiet.in',
      AUTH_RATE_LIMIT_MAX: '1000',
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:Harshik@13@localhost:5432/workspace_test',
    },
    fileParallelism: false,
    setupFiles: ['./tests/helpers/setupDb.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/db/seed.ts', 'src/db/migrate.ts', 'src/db/types.ts', 'src/index.ts'],
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50,
    },
  },
});

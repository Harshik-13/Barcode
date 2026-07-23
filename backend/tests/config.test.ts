import { describe, it, expect } from 'vitest';
import { config } from '../src/config';

describe('config', () => {
  it('should load values from environment', () => {
    expect(config.port).toBeGreaterThan(0);
    expect(typeof config.env).toBe('string');
    expect(config.database.path).toBeTruthy();
    expect(config.rateLimit.windowMs).toBeGreaterThan(0);
    expect(config.rateLimit.maxRequests).toBeGreaterThan(0);
    expect(Array.isArray(config.cors.origins)).toBe(true);
  });

  it('should have valid JWT configuration', () => {
    expect(config.jwt.expiryHours).toBeGreaterThan(0);
    expect(config.jwt.secret).toBeTruthy();
  });
});

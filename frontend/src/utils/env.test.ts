import { describe, it, expect } from 'vitest';
import { env, isDev, isProd } from './env';

describe('env', () => {
  it('should export env object with required properties', () => {
    expect(env).toHaveProperty('apiBaseUrl');
    expect(env).toHaveProperty('appEnv');
    expect(env).toHaveProperty('googleClientId');
  });

  it('should have string values', () => {
    expect(typeof env.apiBaseUrl).toBe('string');
    expect(typeof env.appEnv).toBe('string');
    expect(typeof env.googleClientId).toBe('string');
  });

  it('should default apiBaseUrl to localhost when empty', () => {
    expect(env.apiBaseUrl).toBeTruthy();
  });

  it('should export isDev and isProd boolean flags', () => {
    expect(typeof isDev).toBe('boolean');
    expect(typeof isProd).toBe('boolean');
    expect(isDev).not.toBe(isProd);
  });
});

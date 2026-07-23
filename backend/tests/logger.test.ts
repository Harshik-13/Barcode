import { describe, it, expect } from 'vitest';
import { logger } from '../src/utils/logger';

describe('logger', () => {
  it('should have correct service meta', () => {
    expect((logger as any).defaultMeta).toEqual({ service: 'workspace-api' });
  });

  it('should have console transport', () => {
    const transports = logger.transports;
    expect(transports.length).toBeGreaterThan(0);
  });

  it('should log without throwing', () => {
    expect(() => {
      logger.info('test message');
      logger.error('test error');
      logger.warn('test warning');
    }).not.toThrow();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../src/middleware/errorHandler';
import { AppError } from '../src/utils/errors';
import type { Request, Response } from 'express';

function createMocks() {
  const req = {} as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn();
  return { req, res, next };
}

describe('errorHandler', () => {
  it('should handle AppError with status code and error code', () => {
    const { req, res, next } = createMocks();
    const err = new AppError(400, 'VALIDATION_ERROR', 'Invalid input');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'VALIDATION_ERROR',
      message: 'Invalid input',
    });
  });

  it('should include details when present', () => {
    const { req, res, next } = createMocks();
    const err = new AppError(400, 'VALIDATION_ERROR', 'Invalid input', { field: 'email' });

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      error: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: { field: 'email' },
    });
  });

  it('should return 500 for unknown errors', () => {
    const { req, res, next } = createMocks();
    const err = new Error('unexpected');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  BusinessRuleError,
} from '../src/utils/errors';

describe('AppError', () => {
  it('should create a basic app error', () => {
    const err = new AppError(400, 'TEST_ERROR', 'test message', { key: 'value' });
    expect(err.statusCode).toBe(400);
    expect(err.errorCode).toBe('TEST_ERROR');
    expect(err.message).toBe('test message');
    expect(err.details).toEqual({ key: 'value' });
    expect(err.name).toBe('AppError');
  });

  it('should create error without details', () => {
    const err = new AppError(500, 'SERVER_ERROR', 'server error');
    expect(err.details).toBeUndefined();
  });
});

describe('NotFoundError', () => {
  it('should create 404 error', () => {
    const err = new NotFoundError('User');
    expect(err.statusCode).toBe(404);
    expect(err.errorCode).toBe('NOT_FOUND');
    expect(err.message).toBe('User not found');
  });
});

describe('UnauthorizedError', () => {
  it('should create 401 error', () => {
    const err = new UnauthorizedError('INVALID_TOKEN', 'Token expired');
    expect(err.statusCode).toBe(401);
    expect(err.errorCode).toBe('INVALID_TOKEN');
    expect(err.message).toBe('Token expired');
  });
});

describe('ForbiddenError', () => {
  it('should create 403 error', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.errorCode).toBe('INSUFFICIENT_PERMISSIONS');
  });
});

describe('ConflictError', () => {
  it('should create 409 error', () => {
    const err = new ConflictError('DUPLICATE_EMAIL', 'Email already exists');
    expect(err.statusCode).toBe(409);
    expect(err.errorCode).toBe('DUPLICATE_EMAIL');
  });
});

describe('ValidationError', () => {
  it('should create 400 error', () => {
    const err = new ValidationError('INVALID_INPUT', 'Name is required');
    expect(err.statusCode).toBe(400);
    expect(err.errorCode).toBe('INVALID_INPUT');
  });
});

describe('BusinessRuleError', () => {
  it('should create 422 error', () => {
    const err = new BusinessRuleError('STUDENT_ALREADY_IN_SESSION', 'Student already has an active session');
    expect(err.statusCode).toBe(422);
    expect(err.errorCode).toBe('STUDENT_ALREADY_IN_SESSION');
  });
});

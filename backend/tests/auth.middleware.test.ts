import { describe, it, expect, vi } from 'vitest';
import { requireRole, requireOwnership } from '../src/middleware/auth';
import type { Request, Response } from 'express';

function createMocks(user?: { userId: number; role: string }) {
  const req = { user } as Request;
  const res = {} as Response;
  res.status = vi.fn().mockReturnThis();
  res.json = vi.fn().mockReturnThis();
  const next = vi.fn();
  return { req, res, next };
}

describe('requireRole', () => {
  it('should call next if role matches', () => {
    const { req, res, next } = createMocks({ userId: 1, role: 'admin' });
    requireRole('admin')(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next if any role matches', () => {
    const { req, res, next } = createMocks({ userId: 1, role: 'faculty' });
    requireRole('admin', 'faculty')(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should return 403 if role does not match', () => {
    const { req, res, next } = createMocks({ userId: 1, role: 'student' });
    requireRole('admin')(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('should return 401 if no user', () => {
    const { req, res, next } = createMocks();
    requireRole('admin')(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

describe('requireOwnership', () => {
  it('should allow faculty to access any resource', () => {
    const { req, res, next } = createMocks({ userId: 1, role: 'faculty' });
    requireOwnership(() => 999)(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should allow admin to access any resource', () => {
    const { req, res, next } = createMocks({ userId: 1, role: 'admin' });
    requireOwnership(() => 999)(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should allow student to access own resource', () => {
    const { req, res, next } = createMocks({ userId: 1, role: 'student' });
    requireOwnership(() => 1)(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should deny student accessing other resource', () => {
    const { req, res, next } = createMocks({ userId: 1, role: 'student' });
    requireOwnership(() => 2)(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});

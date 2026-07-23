import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errors';
import { isValidEmail } from '../../../shared';

type ValidationRule = {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'integer';
  required?: boolean;
  min?: number;
  max?: number;
  message?: string;
};

function validateValue(value: unknown, rule: ValidationRule): string | null {
  if (value === undefined || value === null || value === '') {
    if (rule.required) return rule.message ?? `${rule.field} is required`;
    return null;
  }

  if (rule.type === 'email') {
    if (typeof value !== 'string' || !isValidEmail(value)) {
      return rule.message ?? `${rule.field} must be a valid email`;
    }
    return null;
  }

  if (rule.type === 'number' || rule.type === 'integer') {
    const num = typeof value === 'string' ? Number(value) : value;
    if (typeof num !== 'number' || isNaN(num)) {
      return rule.message ?? `${rule.field} must be a number`;
    }
    if (rule.type === 'integer' && !Number.isInteger(num)) {
      return rule.message ?? `${rule.field} must be an integer`;
    }
    if (rule.min !== undefined && num < rule.min) {
      return rule.message ?? `${rule.field} must be at least ${rule.min}`;
    }
    if (rule.max !== undefined && num > rule.max) {
      return rule.message ?? `${rule.field} must be at most ${rule.max}`;
    }
    return null;
  }

  if (rule.type === 'string') {
    if (typeof value !== 'string') {
      return rule.message ?? `${rule.field} must be a string`;
    }
    if (rule.min !== undefined && value.length < rule.min) {
      return rule.message ?? `${rule.field} must be at least ${rule.min} characters`;
    }
    if (rule.max !== undefined && value.length > rule.max) {
      return rule.message ?? `${rule.field} must be at most ${rule.max} characters`;
    }
    return null;
  }

  if (rule.type === 'boolean') {
    if (typeof value !== 'boolean') {
      return rule.message ?? `${rule.field} must be a boolean`;
    }
    return null;
  }

  return null;
}

export function validateBody(rules: ValidationRule[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    for (const rule of rules) {
      const error = validateValue(req.body[rule.field], rule);
      if (error) errors.push(error);
    }
    if (errors.length > 0) {
      next(new ValidationError('VALIDATION_ERROR', errors.join('; ')));
      return;
    }
    next();
  };
}

export function validateQuery(rules: ValidationRule[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    for (const rule of rules) {
      const error = validateValue(req.query[rule.field], rule);
      if (error) errors.push(error);
    }
    if (errors.length > 0) {
      next(new ValidationError('VALIDATION_ERROR', errors.join('; ')));
      return;
    }
    next();
  };
}

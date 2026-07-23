export type ValidationResult = { valid: true } | { valid: false; error: string };

export function required(value: unknown, fieldName: string): ValidationResult {
  if (value === undefined || value === null || value === '') {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
}

export function isString(value: unknown, fieldName: string): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  return { valid: true };
}

export function minLength(value: string, min: number, fieldName: string): ValidationResult {
  if (value.length < min) {
    return { valid: false, error: `${fieldName} must be at least ${min} characters` };
  }
  return { valid: true };
}

export function maxLength(value: string, max: number, fieldName: string): ValidationResult {
  if (value.length > max) {
    return { valid: false, error: `${fieldName} must be at most ${max} characters` };
  }
  return { valid: true };
}

export function isEmail(value: unknown, fieldName: string): ValidationResult {
  const strResult = isString(value, fieldName);
  if (!strResult.valid) return strResult;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value as string)) {
    return { valid: false, error: `${fieldName} must be a valid email` };
  }
  return { valid: true };
}

export function isNumber(value: unknown, fieldName: string): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }
  return { valid: true };
}

export function isInteger(value: unknown, fieldName: string): ValidationResult {
  const numResult = isNumber(value, fieldName);
  if (!numResult.valid) return numResult;
  if (!Number.isInteger(value)) {
    return { valid: false, error: `${fieldName} must be an integer` };
  }
  return { valid: true };
}

export function isBoolean(value: unknown, fieldName: string): ValidationResult {
  if (typeof value !== 'boolean') {
    return { valid: false, error: `${fieldName} must be a boolean` };
  }
  return { valid: true };
}

export function isOneOf<T>(value: T, allowed: readonly T[], fieldName: string): ValidationResult {
  if (!allowed.includes(value)) {
    return { valid: false, error: `${fieldName} must be one of: ${allowed.join(', ')}` };
  }
  return { valid: true };
}

export function validateAll(rules: ValidationResult[]): string[] {
  return rules.filter((r): r is { valid: false; error: string } => !r.valid).map((r) => r.error);
}

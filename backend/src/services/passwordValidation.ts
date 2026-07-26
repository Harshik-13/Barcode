import { ValidationError } from '../utils/errors';

const MIN_PASSWORD_LENGTH = 8;

const UPPERCASE_RE = /[A-Z]/;
const LOWERCASE_RE = /[a-z]/;
const DIGIT_RE = /\d/;
const SPECIAL_RE = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;

export function validateNewPassword(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError('WEAK_PASSWORD', `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!UPPERCASE_RE.test(password)) {
    throw new ValidationError('WEAK_PASSWORD', 'Password must contain at least one uppercase letter');
  }
  if (!LOWERCASE_RE.test(password)) {
    throw new ValidationError('WEAK_PASSWORD', 'Password must contain at least one lowercase letter');
  }
  if (!DIGIT_RE.test(password)) {
    throw new ValidationError('WEAK_PASSWORD', 'Password must contain at least one number');
  }
  if (!SPECIAL_RE.test(password)) {
    throw new ValidationError('WEAK_PASSWORD', 'Password must contain at least one special character');
  }
}

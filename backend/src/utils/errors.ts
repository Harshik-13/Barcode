export class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(404, 'NOT_FOUND', `${entity} not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(errorCode: string, message: string) {
    super(401, errorCode, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, 'INSUFFICIENT_PERMISSIONS', message);
  }
}

export class ConflictError extends AppError {
  constructor(errorCode: string, message: string) {
    super(409, errorCode, message);
  }
}

export class ValidationError extends AppError {
  constructor(errorCode: string, message: string) {
    super(400, errorCode, message);
  }
}

export class BusinessRuleError extends AppError {
  constructor(errorCode: string, message: string) {
    super(422, errorCode, message);
  }
}

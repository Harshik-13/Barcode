export const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin',
} as const;

export const SESSION_STATUS = {
  CREATED: 'created',
  ACTIVE: 'active',
  AWAITING_SUMMARY: 'awaiting_summary',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export const COMPLETION_REASON = {
  NORMAL: 'normal',
  AUTO_COMPLETED: 'auto_completed',
  MANUAL_EXIT: 'manual_exit',
  ADMIN_OVERRIDE: 'admin_override',
} as const;

export const NOTIFICATION_TYPE = {
  ENTRY: 'entry',
  EXIT: 'exit',
  REMINDER: 'reminder',
  COMPLETED: 'completed',
  AUTO_COMPLETED: 'auto_completed',
  STATUS_CHANGE: 'status_change',
  BROADCAST: 'broadcast',
} as const;

export const ACTOR_TYPE = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin',
  SYSTEM: 'system',
} as const;

export const STUDENT_STATUS = {
  INVITED: 'invited',
  ENROLLED: 'enrolled',
  SUSPENDED: 'suspended',
  DEPARTED: 'departed',
} as const;

export const STUDENT_SOURCE = {
  MANUAL: 'manual',
  EXCEL_IMPORT: 'excel_import',
} as const;

export const FACULTY_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
} as const;

export const ADMIN_STATUS = {
  ACTIVE: 'active',
  DEACTIVATED: 'deactivated',
} as const;

export const CATEGORY_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const ERROR_CODES = {
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_OWNED: 'RESOURCE_NOT_OWNED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  DOMAIN_NOT_ALLOWED: 'DOMAIN_NOT_ALLOWED',
  NOT_FOUND: 'NOT_FOUND',
  NO_ACTIVE_SESSION: 'NO_ACTIVE_SESSION',
  DUPLICATE_ROLL: 'DUPLICATE_ROLL',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  STUDENT_ALREADY_IN_SESSION: 'STUDENT_ALREADY_IN_SESSION',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const SCAN_RESULT = {
  SUCCESS_ENTRY: 'SUCCESS_ENTRY',
  SUCCESS_EXIT: 'SUCCESS_EXIT',
  SUMMARY_REQUIRED: 'SUMMARY_REQUIRED',
  INVALID_BARCODE: 'INVALID_BARCODE',
  STUDENT_NOT_FOUND: 'STUDENT_NOT_FOUND',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  DUPLICATE_SCAN: 'DUPLICATE_SCAN',
  INVALID_SESSION_STATE: 'INVALID_SESSION_STATE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type ScanResultCode = typeof SCAN_RESULT[keyof typeof SCAN_RESULT];

export const BRANCHES = [
  'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&ML', 'CS&IT',
  'AIML', 'DST', 'CSD', 'CST', 'CSBS', 'IOT', 'BCT',
] as const;

export const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

export const HOSTELS = [
  'BH1', 'BH2', 'BH3', 'BH4', 'BH5',
  'GH1', 'GH2', 'GH3', 'GH4', 'GH5',
] as const;

export const PROFILE_PICTURE = {
  MAX_SIZE_BYTES: 2 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
  UPLOAD_DIR: 'uploads/profiles',
} as const;

export const IMPORT = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ALLOWED_EXTENSIONS: ['.xlsx'],
  MAX_BATCH_SIZE: 500,
  MAX_ROWS: 5000,
} as const;

export const GRACE_PERIOD_MINUTES = 30;
export const AUTO_COMPLETE_CHECK_INTERVAL_MINUTES = 5;
export const POLLING_INTERVAL_MS = 30000;
export const JWT_EXPIRY_HOURS = 12;

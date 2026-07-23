"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_EXPIRY_HOURS = exports.POLLING_INTERVAL_MS = exports.AUTO_COMPLETE_CHECK_INTERVAL_MINUTES = exports.GRACE_PERIOD_MINUTES = exports.ERROR_CODES = exports.PAGINATION = exports.CATEGORY_STATUS = exports.ADMIN_STATUS = exports.FACULTY_STATUS = exports.STUDENT_STATUS = exports.ACTOR_TYPE = exports.NOTIFICATION_TYPE = exports.COMPLETION_REASON = exports.SESSION_STATUS = exports.ROLES = void 0;
exports.ROLES = {
    STUDENT: 'student',
    FACULTY: 'faculty',
    ADMIN: 'admin',
};
exports.SESSION_STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
    COMPLETED: 'completed',
};
exports.COMPLETION_REASON = {
    NORMAL: 'normal',
    AUTO_COMPLETED: 'auto_completed',
    MANUAL_EXIT: 'manual_exit',
    ADMIN_OVERRIDE: 'admin_override',
};
exports.NOTIFICATION_TYPE = {
    ENTRY: 'entry',
    EXIT: 'exit',
    REMINDER: 'reminder',
};
exports.ACTOR_TYPE = {
    STUDENT: 'student',
    FACULTY: 'faculty',
    ADMIN: 'admin',
    SYSTEM: 'system',
};
exports.STUDENT_STATUS = {
    ENROLLED: 'enrolled',
    SUSPENDED: 'suspended',
    DEPARTED: 'departed',
};
exports.FACULTY_STATUS = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    DEACTIVATED: 'deactivated',
};
exports.ADMIN_STATUS = {
    ACTIVE: 'active',
    DEACTIVATED: 'deactivated',
};
exports.CATEGORY_STATUS = {
    ACTIVE: 'active',
    ARCHIVED: 'archived',
};
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
exports.ERROR_CODES = {
    MISSING_TOKEN: 'MISSING_TOKEN',
    INVALID_TOKEN: 'INVALID_TOKEN',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    RESOURCE_NOT_OWNED: 'RESOURCE_NOT_OWNED',
    ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
    NOT_FOUND: 'NOT_FOUND',
    NO_ACTIVE_SESSION: 'NO_ACTIVE_SESSION',
    DUPLICATE_ROLL: 'DUPLICATE_ROLL',
    DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
    STUDENT_ALREADY_IN_SESSION: 'STUDENT_ALREADY_IN_SESSION',
    INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
};
exports.GRACE_PERIOD_MINUTES = 30;
exports.AUTO_COMPLETE_CHECK_INTERVAL_MINUTES = 5;
exports.POLLING_INTERVAL_MS = 30000;
exports.JWT_EXPIRY_HOURS = 12;
//# sourceMappingURL=index.js.map
export declare const ROLES: {
    readonly STUDENT: "student";
    readonly FACULTY: "faculty";
    readonly ADMIN: "admin";
};
export declare const SESSION_STATUS: {
    readonly PENDING: "pending";
    readonly ACTIVE: "active";
    readonly COMPLETED: "completed";
};
export declare const COMPLETION_REASON: {
    readonly NORMAL: "normal";
    readonly AUTO_COMPLETED: "auto_completed";
    readonly MANUAL_EXIT: "manual_exit";
    readonly ADMIN_OVERRIDE: "admin_override";
};
export declare const NOTIFICATION_TYPE: {
    readonly ENTRY: "entry";
    readonly EXIT: "exit";
    readonly REMINDER: "reminder";
};
export declare const ACTOR_TYPE: {
    readonly STUDENT: "student";
    readonly FACULTY: "faculty";
    readonly ADMIN: "admin";
    readonly SYSTEM: "system";
};
export declare const STUDENT_STATUS: {
    readonly ENROLLED: "enrolled";
    readonly SUSPENDED: "suspended";
    readonly DEPARTED: "departed";
};
export declare const FACULTY_STATUS: {
    readonly ACTIVE: "active";
    readonly SUSPENDED: "suspended";
    readonly DEACTIVATED: "deactivated";
};
export declare const ADMIN_STATUS: {
    readonly ACTIVE: "active";
    readonly DEACTIVATED: "deactivated";
};
export declare const CATEGORY_STATUS: {
    readonly ACTIVE: "active";
    readonly ARCHIVED: "archived";
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
};
export declare const ERROR_CODES: {
    readonly MISSING_TOKEN: "MISSING_TOKEN";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly RESOURCE_NOT_OWNED: "RESOURCE_NOT_OWNED";
    readonly ACCOUNT_INACTIVE: "ACCOUNT_INACTIVE";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly NO_ACTIVE_SESSION: "NO_ACTIVE_SESSION";
    readonly DUPLICATE_ROLL: "DUPLICATE_ROLL";
    readonly DUPLICATE_EMAIL: "DUPLICATE_EMAIL";
    readonly STUDENT_ALREADY_IN_SESSION: "STUDENT_ALREADY_IN_SESSION";
    readonly INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export declare const GRACE_PERIOD_MINUTES = 30;
export declare const AUTO_COMPLETE_CHECK_INTERVAL_MINUTES = 5;
export declare const POLLING_INTERVAL_MS = 30000;
export declare const JWT_EXPIRY_HOURS = 12;
//# sourceMappingURL=index.d.ts.map
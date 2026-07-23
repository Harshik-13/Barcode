"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
exports.clamp = clamp;
exports.truncate = truncate;
exports.parsePaginationParams = parsePaginationParams;
exports.generateRequestId = generateRequestId;
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function truncate(str, maxLength) {
    if (str.length <= maxLength)
        return str;
    return str.slice(0, maxLength) + '...';
}
function parsePaginationParams(page, limit, defaultPage = 1, defaultLimit = 20, maxLimit = 100) {
    const p = typeof page === 'string' ? parseInt(page, 10) : defaultPage;
    const l = typeof limit === 'string' ? parseInt(limit, 10) : defaultLimit;
    return {
        page: Math.max(1, isNaN(p) ? defaultPage : p),
        limit: clamp(isNaN(l) ? defaultLimit : l, 1, maxLimit),
    };
}
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
//# sourceMappingURL=index.js.map
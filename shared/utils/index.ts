export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function parsePaginationParams(
  page: unknown,
  limit: unknown,
  defaultPage = 1,
  defaultLimit = 20,
  maxLimit = 100
): { page: number; limit: number } {
  const p = typeof page === 'string' ? parseInt(page, 10) : defaultPage;
  const l = typeof limit === 'string' ? parseInt(limit, 10) : defaultLimit;
  return {
    page: Math.max(1, isNaN(p) ? defaultPage : p),
    limit: clamp(isNaN(l) ? defaultLimit : l, 1, maxLimit),
  };
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

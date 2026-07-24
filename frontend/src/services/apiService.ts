import { api } from './api';
import type {
  Student, Category, WorkspaceSession, ActivityLog,
  AuthResponse,
} from '@workspace/shared';

export interface DataResponse<T> {
  data: T;
}

export interface PaginatedDataResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SessionWithDetails extends WorkspaceSession {
  studentRoll?: string;
  studentName?: string;
  categoryName?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } }),
  logout: () =>
    api<{ message: string }>('/api/auth/logout', { method: 'POST' }),
  me: () =>
    api<{ id: number; name: string; email: string; role: string }>('/api/auth/me'),
};

export const categoriesApi = {
  list: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return api<DataResponse<Category[]>>(`/api/categories${params}`);
  },
  get: (id: number) =>
    api<DataResponse<Category>>(`/api/categories/${id}`),
  create: (name: string, description?: string) =>
    api<DataResponse<Category>>('/api/categories', { method: 'POST', body: { name, description } }),
  update: (id: number, name: string, description?: string) =>
    api<DataResponse<Category>>(`/api/categories/${id}`, { method: 'PUT', body: { name, description } }),
  archive: (id: number) =>
    api<DataResponse<Category>>(`/api/categories/${id}/archive`, { method: 'PATCH' }),
};

export const studentsApi = {
  list: (page = 1, limit = 20, status?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    return api<PaginatedDataResponse<Student>>(`/api/students?${params}`);
  },
  lookup: (q: string) =>
    api<DataResponse<Student>>(`/api/students/lookup?q=${encodeURIComponent(q)}`),
  search: (q: string) =>
    api<DataResponse<Student[]>>(`/api/students/search?q=${encodeURIComponent(q)}`),
  get: (id: number) =>
    api<DataResponse<Student>>(`/api/students/${id}`),
  getHistory: (id: number, page = 1, limit = 20) =>
    api<PaginatedDataResponse<SessionWithDetails>>(`/api/students/${id}/history?page=${page}&limit=${limit}`),
  create: (roll: string, name: string, email?: string) =>
    api<DataResponse<Student>>('/api/students', { method: 'POST', body: { roll, name, email } }),
  update: (id: number, name: string, email?: string) =>
    api<DataResponse<Student>>(`/api/students/${id}`, { method: 'PUT', body: { name, email } }),
  suspend: (id: number) =>
    api<DataResponse<Student>>(`/api/students/${id}/suspend`, { method: 'PATCH' }),
  depart: (id: number) =>
    api<DataResponse<Student>>(`/api/students/${id}/depart`, { method: 'PATCH' }),
};

export const sessionsApi = {
  list: (params?: { page?: number; limit?: number; studentId?: number; status?: string; dateFrom?: string; dateTo?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.studentId) searchParams.set('studentId', String(params.studentId));
      if (params.status) searchParams.set('status', params.status);
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    }
    return api<PaginatedDataResponse<SessionWithDetails>>(`/api/sessions?${searchParams}`);
  },
  getActive: (studentId: number) =>
    api<DataResponse<SessionWithDetails | null>>(`/api/sessions/active/${studentId}`),
  get: (id: number) =>
    api<DataResponse<SessionWithDetails>>(`/api/sessions/${id}`),
  create: (studentId: number) =>
    api<DataResponse<WorkspaceSession>>('/api/sessions', { method: 'POST', body: { studentId } }),
  start: (id: number) =>
    api<DataResponse<SessionWithDetails>>(`/api/sessions/${id}/start`, { method: 'PATCH' }),
  exit: (id: number, categoryId?: number) =>
    api<DataResponse<SessionWithDetails>>(`/api/sessions/${id}/exit`, { method: 'PATCH', body: { categoryId } }),
  manualExit: (id: number, reason: string, categoryId?: number) =>
    api<DataResponse<SessionWithDetails>>(`/api/sessions/${id}/manual-exit`, { method: 'PATCH', body: { reason, categoryId } }),
  complete: (id: number, summary: string) =>
    api<DataResponse<SessionWithDetails>>(`/api/sessions/${id}/complete`, { method: 'PATCH', body: { summary } }),
  archive: (id: number, reason?: string) =>
    api<DataResponse<SessionWithDetails>>(`/api/sessions/${id}/archive`, { method: 'PATCH', body: { reason } }),
};

export const activityLogsApi = {
  list: (params?: { page?: number; limit?: number; actorType?: string; action?: string; entityType?: string; dateFrom?: string; dateTo?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.actorType) searchParams.set('actorType', params.actorType);
      if (params.action) searchParams.set('action', params.action);
      if (params.entityType) searchParams.set('entityType', params.entityType);
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    }
    return api<PaginatedDataResponse<ActivityLog>>(`/api/activity-logs?${searchParams}`);
  },
  recent: (limit = 10) =>
    api<DataResponse<ActivityLog[]>>(`/api/activity-logs/recent?limit=${limit}`),
  get: (id: number) =>
    api<DataResponse<ActivityLog>>(`/api/activity-logs/${id}`),
};

export const scanApi = {
  submit: (barcode: string) =>
    api<DataResponse<{ code: string; message: string; sessionId: number; studentId: number; studentName: string; studentRoll: string; entryTime: string; exitTime: string | null; sessionStatus: string }>>('/api/scan', { method: 'POST', body: { barcode } }),
};

export interface NotificationItem {
  id: number;
  studentId: number;
  sessionId: number | null;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: (page = 1, limit = 20) =>
    api<PaginatedDataResponse<NotificationItem>>(`/api/notifications?page=${page}&limit=${limit}`),
  unreadCount: () =>
    api<DataResponse<{ count: number }>>('/api/notifications/unread-count'),
  markAsRead: (id: number) =>
    api<DataResponse<{ success: boolean }>>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () =>
    api<DataResponse<{ success: boolean }>>('/api/notifications/read-all', { method: 'PATCH' }),
};

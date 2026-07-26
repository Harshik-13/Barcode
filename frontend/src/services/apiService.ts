import { api, getAuthToken } from './api';
import { env } from '../utils/env';
import type {
  Student, Category, WorkspaceSession, ActivityLog,
  AuthResponse, ProfileData,
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
  durationSeconds: number | null;
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
  list: (page = 1, limit = 20, status?: string, search?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    if (search) params.set('q', search);
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
  create: (roll: string, name: string, branch?: string, section?: string) =>
    api<DataResponse<Student>>('/api/students', { method: 'POST', body: { roll, name, branch, section } }),
  update: (id: number, name: string, branch?: string, section?: string) =>
    api<DataResponse<Student>>(`/api/students/${id}`, { method: 'PUT', body: { name, branch, section } }),
  suspend: (id: number) =>
    api<DataResponse<Student>>(`/api/students/${id}/suspend`, { method: 'PATCH' }),
  depart: (id: number) =>
    api<DataResponse<Student>>(`/api/students/${id}/depart`, { method: 'PATCH' }),
};

export const sessionsApi = {
  stats: (studentId: number) =>
    api<DataResponse<SessionStats>>(`/api/sessions/stats/${studentId}`),
  review: (id: number, status: 'approved' | 'rejected', feedback?: string) =>
    api<DataResponse<SessionWithDetails>>(`/api/sessions/${id}/review`, { method: 'POST', body: { status, feedback } }),
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
  updateCategory: (id: number, categoryId: number) =>
    api<DataResponse<SessionWithDetails>>(`/api/sessions/${id}/category`, { method: 'PATCH', body: { categoryId } }),
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

export const activationApi = {
  start: (roll: string) =>
    api<DataResponse<{ message: string; emailDomain: string }>>('/api/activation/start', { method: 'POST', body: { roll } }),
  verifyOtp: (roll: string, otp: string) =>
    api<DataResponse<{ activationToken: string; message: string }>>('/api/activation/verify-otp', { method: 'POST', body: { roll, otp } }),
  setPassword: (activationToken: string, password: string) =>
    api<DataResponse<{ message: string }>>('/api/activation/set-password', { method: 'POST', body: { activationToken, password } }),
  resendOtp: (roll: string) =>
    api<DataResponse<{ message: string }>>('/api/activation/resend-otp', { method: 'POST', body: { roll } }),
  status: (roll: string) =>
    api<DataResponse<{ activated: boolean; name: string; emailDomain: string }>>('/api/activation/status', { method: 'POST', body: { roll } }),
};

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

export interface FacultyMember {
  id: number;
  email: string;
  name: string;
  status: string;
  createdAt: string;
}

export const facultyApi = {
  list: (params?: { status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    return api<DataResponse<FacultyMember[]>>(`/api/faculty?${searchParams}`);
  },
  get: (id: number) =>
    api<DataResponse<FacultyMember>>(`/api/faculty/${id}`),
  create: (email: string, name: string) =>
    api<DataResponse<FacultyMember>>('/api/faculty', { method: 'POST', body: { email, name } }),
  update: (id: number, name: string, email: string) =>
    api<DataResponse<FacultyMember>>(`/api/faculty/${id}`, { method: 'PUT', body: { name, email } }),
  deactivate: (id: number) =>
    api<DataResponse<FacultyMember>>(`/api/faculty/${id}/deactivate`, { method: 'PATCH' }),
  activate: (id: number) =>
    api<DataResponse<FacultyMember>>(`/api/faculty/${id}/activate`, { method: 'PATCH' }),
};

export interface DashboardStats {
  totalStudents: number;
  enrolledStudents: number;
  invitedStudents: number;
  activeFaculty: number;
  invitedFaculty: number;
  totalFaculty: number;
  activeCategories: number;
  activeSessions: number;
  awaitingSummary: number;
  todaySessions: number;
  recentLogs: number;
}

export const dashboardApi = {
  stats: () =>
    api<DataResponse<DashboardStats>>('/api/dashboard/stats'),
};

export interface SessionStats {
  totalSessions: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  sessionsByCategory: Array<{ categoryId: number | null; categoryName: string | null; count: number }>;
  sessionsByMonth: Array<{ month: string; count: number }>;
  currentStreak: number;
}

export interface LiveSessionInfo {
  id: number;
  studentId: number;
  studentRoll: string;
  studentName: string;
  entryTime: string;
  status: string;
}

export interface LiveSessionData {
  count: number;
  students: LiveSessionInfo[];
}

export const sessionsStatsApi = {
  live: () =>
    api<DataResponse<LiveSessionData>>('/api/sessions/stats/live'),
};

export interface CategoryUsage {
  usageCount: number;
  activeSessions: number;
  deletionAllowed: boolean;
  blockedReason: string | null;
}

export const profileApi = {
  get: () =>
    api<DataResponse<ProfileData>>('/api/profile'),
  update: (data: { name?: string; hostel?: string | null; branch?: string | null; section?: string | null }) =>
    api<DataResponse<ProfileData>>('/api/profile', { method: 'PATCH', body: data }),
  pictureUrl: (userId: number) =>
    `${env.apiBaseUrl}/api/profile/picture/${userId}`,
  uploadPicture: async (file: File): Promise<{ profilePicture: string }> => {
    const formData = new FormData();
    formData.append('picture', file);
    const token = getAuthToken();
    const response = await fetch(`${env.apiBaseUrl}/api/profile/picture`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'NETWORK_ERROR', message: 'Upload failed' }));
      throw err;
    }
    return response.json().then(r => r.data);
  },
  removePicture: async (): Promise<void> => {
    await api('/api/profile/picture', { method: 'DELETE' });
  },
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    api<{ message: string }>('/api/profile/change-password', {
      method: 'PATCH',
      body: { currentPassword, newPassword, confirmPassword },
    }),
};

export const facultyActivationApi = {
  start: (email: string) =>
    api<DataResponse<{ message: string }>>('/api/faculty-activation/start', { method: 'POST', body: { email } }),
  verifyOtp: (email: string, otp: string) =>
    api<DataResponse<{ activationToken: string; message: string }>>('/api/faculty-activation/verify-otp', { method: 'POST', body: { email, otp } }),
  setPassword: (activationToken: string, password: string) =>
    api<DataResponse<{ message: string }>>('/api/faculty-activation/set-password', { method: 'POST', body: { activationToken, password } }),
  resendOtp: (email: string) =>
    api<DataResponse<{ message: string }>>('/api/faculty-activation/resend-otp', { method: 'POST', body: { email } }),
  status: (email: string) =>
    api<DataResponse<{ activated: boolean; name: string }>>('/api/faculty-activation/status', { method: 'POST', body: { email } }),
};

import { api, getAuthToken } from './api';
import type {
  WorkspaceSession,
  Student,
  Category,
  Notification,
  ActivityLog,
  ProfileData,
} from '@workspace/shared';

// ─── Re-export shared types for consumers ────────────────────────────────────

export type {
  WorkspaceSession,
  Student,
  Category,
  Notification,
  ActivityLog,
  ProfileData,
};

// ─── Response Types ──────────────────────────────────────────────────────────

export interface PaginatedDataResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DataResponse<T> {
  data: T;
}

// ─── Extended Types ──────────────────────────────────────────────────────────

export interface SessionWithDetails extends WorkspaceSession {
  studentName?: string;
  studentRoll?: string;
  categoryName?: string;
  hostel?: string;
  machineName?: string;
  reviewStatus?: string;
  reviewFeedback?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  updatedAt?: string;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  totalDuration: number;
  totalDurationSeconds: number;
  averageDuration: number;
  averageDurationSeconds: number;
  thisWeek: number;
  thisMonth: number;
  currentStreak: number;
}

export interface NotificationItem extends Notification {}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalSessions: number;
  activeSessions: number;
  totalFaculty: number;
  activeFaculty: number;
  activeCategories?: number;
  awaitingSummary?: number;
  todaySessions?: number;
}

export interface FacultyMember {
  id: number;
  userId?: number;
  email: string;
  name: string;
  role?: string;
  status: string;
  invitedAt?: string;
  createdAt: string;
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

type Data<T> = { data: T };
type Paginated<T> = Data<T[]> & { pagination: { page: number; limit: number; total: number; totalPages: number } };

// ─── Sessions API ────────────────────────────────────────────────────────────

export const sessionsApi = {
  async list(params: {
    page?: number;
    limit?: number;
    studentId?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<Paginated<SessionWithDetails>> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.studentId) qs.set('studentId', String(params.studentId));
    if (params.status) qs.set('status', params.status);
    if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params.dateTo) qs.set('dateTo', params.dateTo);
    const q = qs.toString();
    return api(`/api/sessions${q ? `?${q}` : ''}`);
  },

  async get(id: number): Promise<Data<SessionWithDetails>> {
    return api(`/api/sessions/${id}`);
  },

  async getActive(studentId: number): Promise<Data<SessionWithDetails | null>> {
    return api(`/api/sessions/active/${studentId}`);
  },

  async stats(studentId: number): Promise<Data<SessionStats>> {
    return api(`/api/sessions/stats/${studentId}`);
  },

  async complete(id: number, summary: string, categoryId?: number): Promise<Data<SessionWithDetails>> {
    return api(`/api/sessions/${id}/complete`, {
      method: 'PATCH',
      body: { summary, ...(categoryId ? { categoryId } : {}) },
    });
  },

  async archive(id: number): Promise<Data<SessionWithDetails>> {
    return api(`/api/sessions/${id}/archive`, { method: 'PATCH' });
  },

  async review(id: number, status: 'approved' | 'rejected', feedback?: string): Promise<Data<SessionWithDetails>> {
    return api(`/api/sessions/${id}/review`, {
      method: 'POST',
      body: { status, ...(feedback ? { feedback } : {}) },
    });
  },

  async manualExit(id: number, reason: string): Promise<Data<SessionWithDetails>> {
    return api(`/api/sessions/${id}/manual-exit`, {
      method: 'PATCH',
      body: { reason },
    });
  },

  async updateCategory(id: number, categoryId: number): Promise<Data<SessionWithDetails>> {
    return api(`/api/sessions/${id}/category`, {
      method: 'PATCH',
      body: { categoryId },
    });
  },
};

// ─── Sessions Stats API ──────────────────────────────────────────────────────

export const sessionsStatsApi = {
  async live(): Promise<Data<{ count: number; students: { id: number; studentId: number; studentName: string; studentRoll: string; entryTime: string }[] }>> {
    return api('/api/sessions/stats/live');
  },
};

// ─── Students API ────────────────────────────────────────────────────────────

export const studentsApi = {
  async list(
    page = 1,
    limit = 20,
    status?: string,
    q?: string,
  ): Promise<Paginated<Student>> {
    const qs = new URLSearchParams();
    qs.set('page', String(page));
    qs.set('limit', String(limit));
    if (status) qs.set('status', status);
    if (q) qs.set('q', q);
    return api(`/api/students?${qs.toString()}`);
  },

  async search(q: string): Promise<Data<Student[]>> {
    return api(`/api/students/search?q=${encodeURIComponent(q)}`);
  },

  async getHistory(
    studentId: number,
    page = 1,
    limit = 10,
  ): Promise<Paginated<SessionWithDetails>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    return api(`/api/students/${studentId}/history?${qs.toString()}`);
  },

  async create(
    roll: string,
    name: string,
    branch?: string,
    section?: string,
  ): Promise<Data<Student>> {
    return api('/api/students', {
      method: 'POST',
      body: { roll, name, branch, section },
    });
  },

  async suspend(id: number): Promise<Data<Student>> {
    return api(`/api/students/${id}/suspend`, { method: 'PATCH' });
  },

  async depart(id: number): Promise<Data<Student>> {
    return api(`/api/students/${id}/depart`, { method: 'PATCH' });
  },
};

// ─── Categories API ──────────────────────────────────────────────────────────

export const categoriesApi = {
  async list(status?: string): Promise<Data<Category[]>> {
    const qs = status ? `?status=${status}` : '';
    return api(`/api/categories${qs}`);
  },

  async create(name: string, description?: string): Promise<Data<Category>> {
    return api('/api/categories', {
      method: 'POST',
      body: { name, description },
    });
  },

  async update(
    id: number,
    name: string,
    description?: string,
  ): Promise<Data<Category>> {
    return api(`/api/categories/${id}`, {
      method: 'PUT',
      body: { name, description },
    });
  },

  async archive(id: number): Promise<Data<Category>> {
    return api(`/api/categories/${id}/archive`, { method: 'PATCH' });
  },
};

// ─── Notifications API ───────────────────────────────────────────────────────

export const notificationsApi = {
  async list(
    page = 1,
    limit = 20,
  ): Promise<Paginated<NotificationItem>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    return api(`/api/notifications?${qs.toString()}`);
  },

  async unreadCount(): Promise<Data<{ count: number }>> {
    return api('/api/notifications/unread-count');
  },

  async markAsRead(id: number): Promise<Data<{ success: true }>> {
    return api(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllAsRead(): Promise<Data<{ success: true }>> {
    return api('/api/notifications/read-all', { method: 'PATCH' });
  },

  async facultyList(
    page = 1,
    limit = 20,
  ): Promise<Paginated<NotificationItem>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    return api(`/api/faculty-notifications?${qs.toString()}`);
  },

  async facultyMarkAsRead(id: number): Promise<Data<{ success: true }>> {
    return api(`/api/faculty-notifications/${id}/read`, { method: 'PATCH' });
  },
};

// ─── Faculty API ─────────────────────────────────────────────────────────────

export const facultyApi = {
  async list(params: { status?: string; search?: string } = {}): Promise<Data<FacultyMember[]>> {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.search) qs.set('search', params.search);
    const q = qs.toString();
    return api(`/api/faculty${q ? `?${q}` : ''}`);
  },

  async create(email: string, name: string): Promise<Data<FacultyMember>> {
    return api('/api/faculty', {
      method: 'POST',
      body: { email, name },
    });
  },

  async update(
    id: number,
    name: string,
    email: string,
  ): Promise<Data<FacultyMember>> {
    return api(`/api/faculty/${id}`, {
      method: 'PUT',
      body: { name, email },
    });
  },

  async deactivate(id: number): Promise<Data<FacultyMember>> {
    return api(`/api/faculty/${id}/deactivate`, { method: 'PATCH' });
  },

  async activate(id: number): Promise<Data<FacultyMember>> {
    return api(`/api/faculty/${id}/activate`, { method: 'PATCH' });
  },
};

// ─── Activity Logs API ───────────────────────────────────────────────────────

export const activityLogsApi = {
  async list(params: {
    page?: number;
    limit?: number;
    actorType?: string;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<Paginated<ActivityLog>> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.actorType) qs.set('actorType', params.actorType);
    if (params.action) qs.set('action', params.action);
    if (params.entityType) qs.set('entityType', params.entityType);
    if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params.dateTo) qs.set('dateTo', params.dateTo);
    const q = qs.toString();
    return api(`/api/activity-logs${q ? `?${q}` : ''}`);
  },
};

// ─── Dashboard API ───────────────────────────────────────────────────────────

export const dashboardApi = {
  async stats(): Promise<Data<DashboardStats>> {
    return api('/api/dashboard/stats');
  },
};

// ─── Profile API ─────────────────────────────────────────────────────────────

export const profileApi = {
  async get(): Promise<Data<ProfileData>> {
    return api('/api/profile');
  },

  async update(data: {
    name?: string;
    hostel?: string | null;
    branch?: string | null;
    section?: string | null;
  }): Promise<Data<ProfileData>> {
    return api('/api/profile', { method: 'PATCH', body: data });
  },

  async uploadPicture(file: File): Promise<Data<{ profilePicture: string }>> {
    const formData = new FormData();
    formData.append('picture', file);
    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const base = import.meta.env.VITE_API_BASE_URL || '';
    const res = await fetch(`${base}/api/profile/picture`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async removePicture(): Promise<Data<{ profilePicture: null }>> {
    return api('/api/profile/picture', { method: 'DELETE' });
  },

  pictureUrl(userId: number): string {
    const base = import.meta.env.VITE_API_BASE_URL || '';
    return `${base}/api/profile/picture/${userId}`;
  },
};

// ─── Scan API (re-export for convenience) ────────────────────────────────────

export { submitScan } from './scanService';

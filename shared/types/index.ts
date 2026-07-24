export type RoleName = 'student' | 'faculty' | 'admin';

export type SessionStatus = 'created' | 'active' | 'awaiting_summary' | 'completed' | 'archived';

export type CompletionReason = 'normal' | 'auto_completed' | 'manual_exit' | 'admin_override';

export type NotificationType = 'entry' | 'exit' | 'reminder';

export type ActorType = 'student' | 'faculty' | 'admin' | 'system';

export type StudentStatus = 'enrolled' | 'suspended' | 'departed';

export type FacultyStatus = 'active' | 'suspended' | 'deactivated';

export type AdminStatus = 'active' | 'deactivated';

export type CategoryStatus = 'active' | 'archived';

export interface Role {
  id: string;
  name: RoleName;
  createdAt: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  roleId: string;
  role?: Role;
  createdAt: string;
}

export interface Student {
  id: number;
  roll: string;
  name: string;
  email: string | null;
  status: StudentStatus;
  createdAt: string;
}

export interface Faculty {
  id: number;
  name: string;
  email: string;
  status: FacultyStatus;
  createdAt: string;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  status: AdminStatus;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  status: CategoryStatus;
  createdAt: string;
}

export interface WorkspaceSession {
  id: number;
  studentId: number;
  entryTime: string;
  exitTime: string | null;
  entryRecorderId: number;
  exitRecorderId: number | null;
  categoryId: number | null;
  status: SessionStatus;
  completionReason: CompletionReason | null;
  summary: string | null;
  isManualExit: boolean;
  manualExitReason: string | null;
  overrideReason: string | null;
  createdAt: string;
}

export interface Notification {
  id: number;
  studentId: number;
  sessionId: number | null;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  actorType: ActorType;
  actorId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    role: RoleName;
    email: string;
  };
}

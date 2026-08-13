export { api, setAuthToken, getAuthToken } from './api';
export { submitScan } from './scanService';
export type { ScanResult, ScanSuccessData, ScanRejectData, ScanResultCode } from './scanService';
export { enqueueScan, processQueue, getQueueSize, clearQueue } from './offlineQueue';
export {
  categoriesApi, studentsApi, sessionsApi, activityLogsApi,
  notificationsApi, sessionsStatsApi, dashboardApi, facultyApi, profileApi,
} from './apiService';
export type {
  DataResponse, PaginatedDataResponse, SessionWithDetails,
  NotificationItem, SessionStats, DashboardStats, FacultyMember,
} from './apiService';

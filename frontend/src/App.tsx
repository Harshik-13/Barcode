import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Layout } from './components/common/Layout';
import { ProtectedRoute, RoleRoute } from './components/common/ProtectedRoute';
import { Loading } from './components/common/Loading';
import { lazy, Suspense } from 'react';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Scanner = lazy(() => import('./pages/Scanner'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const SessionsPage = lazy(() => import('./pages/SessionsPage'));
const ActivityLogsPage = lazy(() => import('./pages/ActivityLogsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SessionDetailPage = lazy(() => import('./pages/SessionDetailPage'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const Forbidden = lazy(() => import('./pages/Forbidden'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Loading fullPage />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/forbidden" element={<Forbidden />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/scanner" element={<Scanner />} />
                  <Route path="/students" element={<RoleRoute roles={['admin']}><StudentsPage /></RoleRoute>} />
                  <Route path="/faculty-management" element={<RoleRoute roles={['admin']}><FacultyManagementPage /></RoleRoute>} />
                  <Route path="/categories" element={<RoleRoute roles={['admin']}><CategoriesPage /></RoleRoute>} />
                  <Route path="/sessions" element={<SessionsPage />} />
                  <Route path="/activity-logs" element={<RoleRoute roles={['admin']}><ActivityLogsPage /></RoleRoute>} />
                  <Route path="/notifications" element={<RoleRoute roles={['student']}><NotificationsPage /></RoleRoute>} />
                  <Route path="/sessions/:id" element={<SessionDetailPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

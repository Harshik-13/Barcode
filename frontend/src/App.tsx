import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Layout } from './components/common/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Loading } from './components/common/Loading';
import { lazy, Suspense } from 'react';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Scanner = lazy(() => import('./pages/Scanner'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const Forbidden = lazy(() => import('./pages/Forbidden'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/scanner" element={<Scanner />} />
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

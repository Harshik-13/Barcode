import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { setAuthToken, getAuthToken, api } from '../services/api';
import type { RoleName } from '@workspace/shared';

interface User {
  id: number;
  name: string;
  email: string;
  role: RoleName;
  studentId?: number;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const TOKEN_KEY = 'workspace_token';
const USER_KEY = 'workspace_user';

const AuthContext = createContext<AuthContextValue | null>(null);

function loadFromStorage(): { token: string | null; user: User | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      const user = JSON.parse(userStr) as User;
      setAuthToken(token);
      return { token, user };
    }
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  return { token: null, user: null };
}

function saveToStorage(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const saved = loadFromStorage();
    if (saved.token && saved.user) {
      setToken(saved.token);
      setUser(saved.user);

      api<{ id: number; name: string; email: string; role: RoleName; studentId?: number }>('/api/auth/me')
        .then((userData) => {
          const freshUser: User = { id: userData.id, name: userData.name, email: userData.email, role: userData.role, studentId: userData.studentId };
          setUser(freshUser);
          saveToStorage(saved.token!, freshUser);
        })
        .catch(() => {
          setUser(null);
          setToken(null);
          setAuthToken(null);
          clearStorage();
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      setIsInitializing(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      setToken(response.token);
      setUser(response.user);
      setAuthToken(response.token);
      saveToStorage(response.token, response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    const currentToken = getAuthToken();
    if (currentToken) {
      api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    setAuthToken(null);
    clearStorage();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isInitializing,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

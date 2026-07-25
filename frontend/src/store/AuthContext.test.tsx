import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { MemoryRouter } from 'react-router-dom';

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{auth.isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
      <span data-testid="auth-user">{auth.user ? auth.user.name : 'no-user'}</span>
      <span data-testid="auth-loading">{auth.isLoading ? 'loading' : 'not-loading'}</span>
    </div>
  );
}

describe('AuthContext', () => {
  it('should start unauthenticated with no saved data', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
      expect(screen.getByTestId('auth-user').textContent).toBe('no-user');
    });
  });

  it('should restore session from localStorage', async () => {
    const user = { id: 1, name: 'Test User', email: 'test@test.com', role: 'student' as const };
    localStorage.setItem('workspace_token', 'saved-token');
    localStorage.setItem('workspace_user', JSON.stringify(user));

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 1, name: 'Test User', email: 'test@test.com', role: 'student' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-user').textContent).toBe('Test User');
    });
  });

  it('should clear session on invalid token', async () => {
    const user = { id: 1, name: 'Test User', email: 'test@test.com', role: 'student' as const };
    localStorage.setItem('workspace_token', 'bad-token');
    localStorage.setItem('workspace_user', JSON.stringify(user));

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unauthorized'));

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
      expect(localStorage.getItem('workspace_token')).toBeNull();
    });
  });
});

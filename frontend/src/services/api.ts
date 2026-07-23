import { env } from '../utils/env';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: 'NETWORK_ERROR',
      message: 'An unexpected network error occurred',
    }));
    throw error;
  }

  return response.json() as Promise<T>;
}

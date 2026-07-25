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

async function fetchWithRetry(path: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(`${env.apiBaseUrl}${path}`, options);
      return response;
    } catch (err) {
      if (i < retries && err instanceof TypeError) {
        continue;
      }
      throw err;
    }
  }
  throw new TypeError('Failed to fetch');
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

  const response = await fetchWithRetry(path, {
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

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionInfo {
  endpoint: string;
  keys: PushSubscriptionKeys;
  userAgent?: string;
}

export async function getVapidPublicKey(): Promise<string> {
  const res = await api<{ data: { publicKey: string } }>('/api/push/vapid-key');
  return res.data.publicKey;
}

export async function subscribeToPush(subscription: PushSubscriptionInfo): Promise<void> {
  await api('/api/push/subscriptions', { method: 'POST', body: subscription });
}

export async function unsubscribeFromPush(endpoint: string): Promise<void> {
  const encodedEndpoint = encodeURIComponent(endpoint);
  await api(`/api/push/subscriptions/${encodedEndpoint}`, { method: 'DELETE' });
}

export async function getPushSubscriptions(): Promise<PushSubscriptionInfo[]> {
  const res = await api<{ data: PushSubscriptionInfo[] }>('/api/push/subscriptions');
  return res.data;
}

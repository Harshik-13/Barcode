import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, setAuthToken, getAuthToken } from './api';

const BASE_URL = 'http://localhost:8080';

beforeEach(() => {
  vi.restoreAllMocks();
  setAuthToken(null);
  vi.stubEnv('VITE_API_BASE_URL', BASE_URL);
});

describe('api()', () => {
  it('should make GET request and return JSON', async () => {
    const mockData = { id: 1, name: 'test' };
    fetchMock(200, mockData);

    const result = await api('/test');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/test`, expect.objectContaining({ method: 'GET' }));
  });

  it('should include auth token when set', async () => {
    setAuthToken('my-token');
    fetchMock(200, {});

    await api('/test');
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
    }));
  });

  it('should POST with JSON body', async () => {
    fetchMock(201, { data: { id: 1 } });
    const body = { name: 'hello' };

    await api('/test', { method: 'POST', body });
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(body),
    }));
  });

  it('should throw ApiError on non-ok response', async () => {
    fetchMock(400, { error: 'VALIDATION', message: 'Bad request' });

    await expect(api('/test')).rejects.toThrow('Bad request');
  });

  it('should throw fallback error on non-ok with invalid JSON', async () => {
    fetchMock(500, 'not json');

    await expect(api('/test')).rejects.toMatchObject({ error: 'NETWORK_ERROR' });
  });

  it('should retry on network error and succeed', async () => {
    const mockData = { ok: true };
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Network failure'))
      .mockResolvedValueOnce(new Response(JSON.stringify(mockData), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await api('/test');
    expect(result).toEqual(mockData);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('should retry and fail after exhausting retries', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network failure'));

    await expect(api('/test')).rejects.toThrow('Network failure');
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});

describe('setAuthToken / getAuthToken', () => {
  it('should store and retrieve token', () => {
    expect(getAuthToken()).toBeNull();
    setAuthToken('abc123');
    expect(getAuthToken()).toBe('abc123');
    setAuthToken(null);
    expect(getAuthToken()).toBeNull();
  });
});

function fetchMock(status: number, body: unknown) {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(bodyStr, {
      status,
      headers: status >= 200 && status < 300 ? { 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
    })
  );
}

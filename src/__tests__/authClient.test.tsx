import { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/store/authStore', () => ({
  useAuthStore: { getState: vi.fn() },
}));

import { authClient } from '@/api/authClient';
import { useAuthStore } from '@/store/authStore';

interface InterceptorHandler<I, O> {
  fulfilled: (input: I) => O | Promise<O>;
  rejected?: (error: unknown) => unknown;
}

const requestHandlers = (
  authClient.interceptors.request as unknown as {
    handlers: Array<InterceptorHandler<InternalAxiosRequestConfig, InternalAxiosRequestConfig>>;
  }
).handlers;

const responseHandlers = (
  authClient.interceptors.response as unknown as {
    handlers: Array<InterceptorHandler<unknown, unknown>>;
  }
).handlers;

const requestInterceptor = requestHandlers[0];
const responseInterceptor = responseHandlers[0];

function makeRequestConfig(): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
    method: 'get',
    url: '/api/test',
  } as InternalAxiosRequestConfig;
}

function makeMockState(overrides: {
  token?: string | null;
  refreshAccessToken?: () => Promise<boolean>;
  logout?: () => void;
} = {}) {
  return {
    token: overrides.token ?? null,
    refreshAccessToken: overrides.refreshAccessToken ?? vi.fn().mockResolvedValue(false),
    logout: overrides.logout ?? vi.fn(),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('authClient request interceptor', () => {
  it('adds Authorization header when token exists', async () => {
    vi.mocked(useAuthStore.getState).mockReturnValue(
      makeMockState({ token: 'tok-123' }) as never,
    );
    const cfg = makeRequestConfig();

    const out = await requestInterceptor.fulfilled(cfg);

    expect(out.headers.get('Authorization')).toBe('Bearer tok-123');
  });

  it('omits Authorization header when no token is set', async () => {
    vi.mocked(useAuthStore.getState).mockReturnValue(makeMockState() as never);
    const cfg = makeRequestConfig();

    const out = await requestInterceptor.fulfilled(cfg);

    expect(out.headers.has('Authorization')).toBe(false);
  });
});

describe('authClient response interceptor', () => {
  it('passes through on a successful response', async () => {
    const success = { status: 200, data: { ok: true } };
    const out = await responseInterceptor.fulfilled(success);
    expect(out).toEqual(success);
  });

  it('triggers refresh-and-retry on 401, then re-issues the request', async () => {
    const refreshAccessToken = vi.fn().mockResolvedValue(true);
    const logout = vi.fn();
    vi.mocked(useAuthStore.getState).mockReturnValue(
      makeMockState({ refreshAccessToken, logout }) as never,
    );

    const cfg = makeRequestConfig();
    const error = {
      response: { status: 401 },
      config: cfg,
    } as AxiosError;

    // After refresh succeeds, the interceptor calls authClient(cfg) — short-circuit
    // that retry by stubbing the request method.
    const requestSpy = vi
      .spyOn(authClient, 'request')
      .mockResolvedValue({ status: 200, data: { retried: true } } as never);

    await responseInterceptor.rejected!(error);

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
    expect(requestSpy).toHaveBeenCalledTimes(1);
    // _retry flag is set on the original config
    expect((cfg as { _retry?: boolean })._retry).toBe(true);
  });

  it('logs out and rejects when refresh fails', async () => {
    const refreshAccessToken = vi.fn().mockResolvedValue(false);
    const logout = vi.fn();
    vi.mocked(useAuthStore.getState).mockReturnValue(
      makeMockState({ refreshAccessToken, logout }) as never,
    );

    const error = {
      response: { status: 401 },
      config: makeRequestConfig(),
    } as AxiosError;

    await expect(responseInterceptor.rejected!(error)).rejects.toBe(error);

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('does not retry when _retry is already set (no infinite loop)', async () => {
    const refreshAccessToken = vi.fn();
    const logout = vi.fn();
    vi.mocked(useAuthStore.getState).mockReturnValue(
      makeMockState({ refreshAccessToken, logout }) as never,
    );

    const cfg = makeRequestConfig() as InternalAxiosRequestConfig & { _retry?: boolean };
    cfg._retry = true;
    const error = { response: { status: 401 }, config: cfg } as AxiosError;

    await expect(responseInterceptor.rejected!(error)).rejects.toBe(error);
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
  });

  it('rejects without refresh on non-401 errors', async () => {
    const refreshAccessToken = vi.fn();
    const logout = vi.fn();
    vi.mocked(useAuthStore.getState).mockReturnValue(
      makeMockState({ refreshAccessToken, logout }) as never,
    );

    const error = {
      response: { status: 500 },
      config: makeRequestConfig(),
    } as AxiosError;

    await expect(responseInterceptor.rejected!(error)).rejects.toBe(error);
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
  });
});

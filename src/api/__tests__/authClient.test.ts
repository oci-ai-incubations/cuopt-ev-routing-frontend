import { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authClient } from '@/api';
import { useAuthStore } from '@/store';

vi.mock('@/store/authStore', () => ({
  useAuthStore: { getState: vi.fn() },
}));

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

function makeConfig(url = '/api/test'): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
    method: 'get',
    url,
  } as InternalAxiosRequestConfig;
}

function makeState(
  overrides: {
    token?: string | null;
    refreshAccessToken?: () => Promise<boolean>;
    logout?: () => void;
  } = {},
) {
  return {
    token: overrides.token ?? null,
    refreshAccessToken: overrides.refreshAccessToken ?? vi.fn().mockResolvedValue(false),
    logout: overrides.logout ?? vi.fn(),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('request interceptor', () => {
  it('attaches Authorization header when token is present', async () => {
    vi.mocked(useAuthStore.getState).mockReturnValue(makeState({ token: 'my-token' }) as never);

    const out = await requestInterceptor.fulfilled(makeConfig());

    expect(out.headers.get('Authorization')).toBe('Bearer my-token');
  });

  it('leaves Authorization header absent when no token', async () => {
    vi.mocked(useAuthStore.getState).mockReturnValue(makeState() as never);

    const out = await requestInterceptor.fulfilled(makeConfig());

    expect(out.headers.has('Authorization')).toBe(false);
  });
});

describe('response interceptor', () => {
  it('passes successful responses through unchanged', async () => {
    const success = { status: 200, data: { ok: true } };

    const out = await responseInterceptor.fulfilled(success);

    expect(out).toEqual(success);
  });

  it('refreshes token and retries original request on 401', async () => {
    const refreshAccessToken = vi.fn().mockResolvedValue(true);

    vi.mocked(useAuthStore.getState).mockReturnValue(makeState({ refreshAccessToken }) as never);
    const requestSpy = vi.spyOn(authClient, 'request').mockResolvedValue({ status: 200 } as never);

    const cfg = makeConfig();
    const error = { response: { status: 401 }, config: cfg } as AxiosError;

    await responseInterceptor.rejected?.(error);

    expect(refreshAccessToken).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledOnce();
  });

  it('calls logout and rejects when refresh returns false', async () => {
    const refreshAccessToken = vi.fn().mockResolvedValue(false);
    const logout = vi.fn();

    vi.mocked(useAuthStore.getState).mockReturnValue(
      makeState({ refreshAccessToken, logout }) as never,
    );

    const error = { response: { status: 401 }, config: makeConfig() } as AxiosError;

    await expect(responseInterceptor.rejected?.(error)).rejects.toBe(error);

    expect(logout).toHaveBeenCalledOnce();
  });

  it('skips refresh when _retry flag is already set', async () => {
    const refreshAccessToken = vi.fn();

    vi.mocked(useAuthStore.getState).mockReturnValue(makeState({ refreshAccessToken }) as never);

    const cfg = { ...makeConfig(), _retry: true } as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const error = { response: { status: 401 }, config: cfg } as AxiosError;

    await expect(responseInterceptor.rejected?.(error)).rejects.toBe(error);

    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it('skips refresh on 401 from /auth/logout to prevent recursion', async () => {
    const refreshAccessToken = vi.fn();

    vi.mocked(useAuthStore.getState).mockReturnValue(makeState({ refreshAccessToken }) as never);

    const error = {
      response: { status: 401 },
      config: makeConfig('/auth/logout'),
    } as AxiosError;

    await expect(responseInterceptor.rejected?.(error)).rejects.toBe(error);

    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it('skips refresh on 401 from /auth/refresh to prevent recursion', async () => {
    const refreshAccessToken = vi.fn();

    vi.mocked(useAuthStore.getState).mockReturnValue(makeState({ refreshAccessToken }) as never);

    const error = {
      response: { status: 401 },
      config: makeConfig('/auth/refresh'),
    } as AxiosError;

    await expect(responseInterceptor.rejected?.(error)).rejects.toBe(error);

    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it('rejects non-401 errors without refresh attempt', async () => {
    const refreshAccessToken = vi.fn();

    vi.mocked(useAuthStore.getState).mockReturnValue(makeState({ refreshAccessToken }) as never);

    const error = { response: { status: 500 }, config: makeConfig() } as AxiosError;

    await expect(responseInterceptor.rejected?.(error)).rejects.toBe(error);

    expect(refreshAccessToken).not.toHaveBeenCalled();
  });
});

import { jwtDecode } from 'jwt-decode';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as authApi from '@/api';
import { useAuthStore } from '@/store';
import type { TokenResponse, User } from '@/types';

vi.mock('@/api/auth');
vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));

const sampleUser: User = {
  id: 42,
  email: 'a@b.test',
  name: 'A',
  role: 'user',
  is_active: true,
};

const sampleResponse: TokenResponse = {
  access_token: 'access-tok',
  refresh_token: 'refresh-tok',
  user: sampleUser,
};

function resetStore() {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
  });
}

beforeEach(() => {
  localStorage.clear();
  resetStore();
  vi.resetAllMocks();
});

afterEach(() => {
  resetStore();
  localStorage.clear();
});

describe('authStore.login', () => {
  it('populates state and returns success on valid credentials', async () => {
    vi.mocked(authApi.login).mockResolvedValue(sampleResponse);

    const result = await useAuthStore.getState().login('a@b.test', 'pw');

    expect(result).toEqual({ success: true });
    const state = useAuthStore.getState();

    expect(state.user).toEqual(sampleUser);
    expect(state.token).toBe('access-tok');
    expect(state.refreshToken).toBe('refresh-tok');
    expect(state.isAuthenticated).toBe(true);
  });

  it('clears state and returns error on failed login', async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      response: { data: { detail: 'Invalid email or password' } },
    });

    const result = await useAuthStore.getState().login('a@b.test', 'wrong');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email or password');
    const state = useAuthStore.getState();

    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('falls back to a generic error when the response has none', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('network down'));

    const result = await useAuthStore.getState().login('a@b.test', 'pw');

    expect(result.success).toBe(false);
    expect(result.error).toBe('network down');
  });
});

describe('authStore.register', () => {
  it('populates state on success', async () => {
    vi.mocked(authApi.register).mockResolvedValue(sampleResponse);

    const result = await useAuthStore
      .getState()
      .register({ email: 'a@b.test', password: 'pw', name: 'A' });

    expect(result.success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('returns the service error on failure', async () => {
    vi.mocked(authApi.register).mockRejectedValue({
      response: { data: { detail: 'Email taken' } },
    });

    const result = await useAuthStore
      .getState()
      .register({ email: 'a@b.test', password: 'pw', name: 'A' });

    expect(result).toEqual({ success: false, error: 'Email taken' });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('authStore.logout', () => {
  it('clears state and best-effort calls the logout endpoint', () => {
    useAuthStore.setState({
      user: sampleUser,
      token: 'access-tok',
      refreshToken: 'refresh-tok',
      isAuthenticated: true,
    });
    vi.mocked(authApi.logout).mockResolvedValue();

    useAuthStore.getState().logout();

    expect(authApi.logout).toHaveBeenCalledTimes(1);
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('does not throw when the logout endpoint fails', () => {
    useAuthStore.setState({
      user: sampleUser,
      token: 'access-tok',
      refreshToken: 'refresh-tok',
      isAuthenticated: true,
    });
    vi.mocked(authApi.logout).mockRejectedValue(new Error('boom'));

    expect(() => useAuthStore.getState().logout()).not.toThrow();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('authStore.refreshAccessToken', () => {
  it('updates the token on success', async () => {
    useAuthStore.setState({ refreshToken: 'r-old' });
    vi.mocked(authApi.refresh).mockResolvedValue({
      ...sampleResponse,
      access_token: 'new-tok',
      refresh_token: 'r-new',
    });

    const ok = await useAuthStore.getState().refreshAccessToken();

    expect(ok).toBe(true);
    expect(useAuthStore.getState().token).toBe('new-tok');
    expect(useAuthStore.getState().refreshToken).toBe('r-new');
  });

  it('returns false and clears state when refresh fails', async () => {
    useAuthStore.setState({
      user: sampleUser,
      token: 'access-tok',
      refreshToken: 'r-old',
      isAuthenticated: true,
    });
    vi.mocked(authApi.refresh).mockRejectedValue(new Error('rotated'));

    const ok = await useAuthStore.getState().refreshAccessToken();

    expect(ok).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('returns false immediately when there is no refresh token', async () => {
    const ok = await useAuthStore.getState().refreshAccessToken();

    expect(ok).toBe(false);
    expect(authApi.refresh).not.toHaveBeenCalled();
  });
});

describe('authStore.loadCurrentUser', () => {
  it('hydrates user on success', async () => {
    useAuthStore.setState({ token: 'access-tok' });
    vi.mocked(authApi.me).mockResolvedValue(sampleUser);

    const ok = await useAuthStore.getState().loadCurrentUser();

    expect(ok).toBe(true);
    expect(useAuthStore.getState().user).toEqual(sampleUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('clears state on failure', async () => {
    useAuthStore.setState({ token: 'bad-tok', isAuthenticated: true });
    vi.mocked(authApi.me).mockRejectedValue(new Error('401'));

    const ok = await useAuthStore.getState().loadCurrentUser();

    expect(ok).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('authStore.ssoLogin', () => {
  it('exchanges code, populates state, returns success', async () => {
    vi.mocked(authApi.exchangeSSOCode).mockResolvedValue(sampleResponse);

    const result = await useAuthStore
      .getState()
      .ssoLogin('oracle-idcs', 'code-abc', 'http://app/cb', 'state-xyz');

    expect(result.success).toBe(true);
    expect(useAuthStore.getState().token).toBe('access-tok');
    expect(authApi.exchangeSSOCode).toHaveBeenCalledWith(
      'oracle-idcs',
      'code-abc',
      'http://app/cb',
      'state-xyz',
    );
  });

  it('clears state and returns error on failure', async () => {
    vi.mocked(authApi.exchangeSSOCode).mockRejectedValue(new Error('bad code'));

    const result = await useAuthStore.getState().ssoLogin('idcs', 'x', 'http://app/cb', 'st');

    expect(result.success).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('authStore.setUserFromToken', () => {
  it('hydrates user from JWT claims', () => {
    vi.mocked(jwtDecode).mockReturnValue({
      sub: '7',
      email: 'sso@example.com',
      name: 'SSO User',
      role: 'admin',
    });

    useAuthStore.getState().setUserFromToken('fake.jwt.token');

    const state = useAuthStore.getState();

    expect(state.user).toEqual({
      id: 7,
      email: 'sso@example.com',
      name: 'SSO User',
      role: 'admin',
      is_active: true,
    });
    expect(state.token).toBe('fake.jwt.token');
    expect(state.isAuthenticated).toBe(true);
  });

  it('clears state on a malformed token', () => {
    vi.mocked(jwtDecode).mockImplementation(() => {
      throw new Error('bad jwt');
    });
    useAuthStore.setState({ isAuthenticated: true, token: 'old' });

    useAuthStore.getState().setUserFromToken('garbage');

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
  });
});

describe('authStore persistence', () => {
  it('writes to localStorage under the cuopt-auth key', async () => {
    vi.mocked(authApi.login).mockResolvedValue(sampleResponse);
    await useAuthStore.getState().login('a@b.test', 'pw');

    const raw = localStorage.getItem('cuopt-auth');

    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);

    expect(parsed.state.token).toBe('access-tok');
    expect(parsed.state.user.email).toBe('a@b.test');
  });
});

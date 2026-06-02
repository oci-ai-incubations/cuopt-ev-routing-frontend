import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  authClient,
  exchangeSSOCode,
  fetchPublicProviders,
  getAuthorizeUrl,
  login,
  logout,
  me,
  refresh,
  register,
} from '@/api';
import type { RegisterPayload, SSOProvider, TokenResponse, User } from '@/types';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('@/api/authClient', () => ({
  authClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  is_active: true,
};

const mockTokenResponse: TokenResponse = {
  access_token: 'access-token-abc',
  refresh_token: 'refresh-token-xyz',
  user: mockUser,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('login', () => {
  it('posts credentials and returns token response', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: mockTokenResponse });

    const result = await login('test@example.com', 'password123');

    expect(axios.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result).toEqual(mockTokenResponse);
  });

  it('propagates error on failed login', async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error('Unauthorized'));

    await expect(login('bad@example.com', 'wrong')).rejects.toThrow('Unauthorized');
  });
});

describe('register', () => {
  it('posts payload and returns token response', async () => {
    const payload: RegisterPayload = {
      email: 'new@example.com',
      password: 'pass',
      name: 'New User',
    };

    vi.mocked(axios.post).mockResolvedValue({ data: mockTokenResponse });

    const result = await register(payload);

    expect(axios.post).toHaveBeenCalledWith('/auth/register', payload);
    expect(result).toEqual(mockTokenResponse);
  });
});

describe('refresh', () => {
  it('posts refresh token and returns new token response', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: mockTokenResponse });

    const result = await refresh('old-refresh-token');

    expect(axios.post).toHaveBeenCalledWith('/auth/refresh', {
      refresh_token: 'old-refresh-token',
    });
    expect(result).toEqual(mockTokenResponse);
  });
});

describe('logout', () => {
  it('posts to logout via authClient', async () => {
    vi.mocked(authClient.post).mockResolvedValue({});

    await logout();

    expect(authClient.post).toHaveBeenCalledWith('/auth/logout');
  });
});

describe('me', () => {
  it('returns current user via authClient', async () => {
    vi.mocked(authClient.get).mockResolvedValue({ data: mockUser });

    const result = await me();

    expect(authClient.get).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual(mockUser);
  });
});

describe('fetchPublicProviders', () => {
  it('returns providers list on success', async () => {
    const providers: SSOProvider[] = [{ id: 1, type: 'oidc', name: 'Google', slug: 'google' }];

    vi.mocked(axios.get).mockResolvedValue({ data: providers });

    const result = await fetchPublicProviders();

    expect(axios.get).toHaveBeenCalledWith('/auth/sso/providers');
    expect(result).toEqual(providers);
  });

  it('returns empty array on network error', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));

    const result = await fetchPublicProviders();

    expect(result).toEqual([]);
  });
});

describe('getAuthorizeUrl', () => {
  it('calls authorize endpoint with slug and redirect_uri param', async () => {
    const response = {
      authorize_url: 'https://sso.example.com/auth',
      state: 'state-abc',
    };

    vi.mocked(authClient.get).mockResolvedValue({ data: response });

    const result = await getAuthorizeUrl('google', 'https://app.example.com/callback');

    expect(authClient.get).toHaveBeenCalledWith('/auth/sso/google/authorize', {
      params: { redirect_uri: 'https://app.example.com/callback' },
    });
    expect(result).toEqual(response);
  });
});

describe('exchangeSSOCode', () => {
  it('posts SSO code exchange payload and returns tokens', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: mockTokenResponse });

    const result = await exchangeSSOCode(
      'google',
      'auth-code-123',
      'https://app.example.com/callback',
      'state-abc',
    );

    expect(axios.post).toHaveBeenCalledWith('/auth/sso/google/token', {
      code: 'auth-code-123',
      redirect_uri: 'https://app.example.com/callback',
      state: 'state-abc',
    });
    expect(result).toEqual(mockTokenResponse);
  });
});

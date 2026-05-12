import axios from 'axios';

import { authClient } from '@/api/authClient';

import type {
  RegisterPayload,
  SSOAuthorizeResponse,
  SSOProvider,
  TokenResponse,
  User,
} from '@/types/auth';

// login / register / refresh use raw axios — they precede the existence
// of a Bearer token (or, for refresh, a valid one), and routing through
// authClient's 401-refresh interceptor would recurse on a bad refresh.

const AUTH_BASE = '/auth';

export async function login(email: string, password: string): Promise<TokenResponse> {
  const { data } = await axios.post<TokenResponse>(`${AUTH_BASE}/login`, {
    email,
    password,
  });
  return data;
}

export async function register(payload: RegisterPayload): Promise<TokenResponse> {
  const { data } = await axios.post<TokenResponse>(`${AUTH_BASE}/register`, payload);
  return data;
}

export async function refresh(refreshToken: string): Promise<TokenResponse> {
  const { data } = await axios.post<TokenResponse>(`${AUTH_BASE}/refresh`, {
    refresh_token: refreshToken,
  });
  return data;
}

export async function logout(): Promise<void> {
  await authClient.post(`${AUTH_BASE}/logout`);
}

export async function me(): Promise<User> {
  const { data } = await authClient.get<User>(`${AUTH_BASE}/me`);
  return data;
}

export async function fetchPublicProviders(): Promise<SSOProvider[]> {
  try {
    const { data } = await axios.get<SSOProvider[]>(`${AUTH_BASE}/sso/providers`);
    return data;
  } catch {
    return [];
  }
}

export async function getAuthorizeUrl(
  slug: string,
  redirectUri: string,
): Promise<SSOAuthorizeResponse> {
  const { data } = await authClient.get<SSOAuthorizeResponse>(
    `${AUTH_BASE}/sso/${slug}/authorize`,
    { params: { redirect_uri: redirectUri } },
  );
  return data;
}

export async function exchangeSSOCode(
  slug: string,
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const { data } = await axios.post<TokenResponse>(`${AUTH_BASE}/sso/${slug}/token`, {
    code,
    redirect_uri: redirectUri,
  });
  return data;
}

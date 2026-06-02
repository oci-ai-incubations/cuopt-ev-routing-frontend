import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/store';

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Bearer-injecting axios with one-shot 401 → refresh-and-retry. Login /
// register / refresh use raw axios (in api/auth.ts) since they precede the
// token's existence and routing them through here would cause interceptor
// recursion on 401s.
export const authClient: AxiosInstance = axios.create({ baseURL: '/' });

authClient.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().token;

  if (token) {
    cfg.headers.set('Authorization', `Bearer ${token}`);
  }

  return cfg;
});

// Endpoints whose 401s must not trigger the refresh-then-logout flow:
//   /auth/logout — a 401 here is expected when the token is already invalid;
//     re-triggering logout from the interceptor recurses infinitely (each
//     logout posts through authClient and re-enters this handler).
//   /auth/refresh — handled by api/auth.ts via raw axios, but be defensive.
//   /auth/login   — same reason.
function isAuthFlowEndpoint(url: string | undefined): boolean {
  if (!url) return false;

  return (
    url.endsWith('/auth/logout') || url.endsWith('/auth/refresh') || url.endsWith('/auth/login')
  );
}

authClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const cfg = error.config as RetryConfig | undefined;

    if (error.response?.status === 401 && cfg && !cfg._retry && !isAuthFlowEndpoint(cfg.url)) {
      cfg._retry = true;
      const refreshed = await useAuthStore.getState().refreshAccessToken();

      if (refreshed) {
        return authClient.request(cfg);
      }

      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);

import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { useAuthStore } from '@/store/authStore';

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Auth-aware axios instance.
 *
 * Use for any call that should carry the user's Bearer token.
 *
 * Behavior:
 * - Request interceptor injects `Authorization: Bearer <token>` when the
 *   auth store has a token.
 * - Response interceptor: on 401, attempts a single refresh-and-retry. If
 *   refresh fails, it calls `logout()` and rejects the original error.
 *
 * NOT used by `login`/`register`/`refresh` themselves — those endpoints
 * are how the token is created in the first place, so they go through raw
 * axios in `src/api/auth.ts`.
 */
export const authClient: AxiosInstance = axios.create({ baseURL: '/' });

authClient.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().token;
  if (token) {
    cfg.headers.set('Authorization', `Bearer ${token}`);
  }
  return cfg;
});

authClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const cfg = error.config as RetryConfig | undefined;
    if (error.response?.status === 401 && cfg && !cfg._retry) {
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

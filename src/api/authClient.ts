import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { useAuthStore } from '@/store/authStore';

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

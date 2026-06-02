import { jwtDecode } from 'jwt-decode';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import * as authApi from '@/api';
import type { AccessTokenClaims, LoginResult, RegisterPayload, User } from '@/types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<LoginResult>;
  register: (payload: RegisterPayload) => Promise<LoginResult>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  loadCurrentUser: () => Promise<boolean>;
  ssoLogin: (
    slug: string,
    code: string,
    redirectUri: string,
    state: string,
  ) => Promise<LoginResult>;
  setUserFromToken: (token: string) => void;
}

function extractError(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null) {
    const maybeAxios = err as {
      response?: { data?: { detail?: string; error?: string } };
      message?: string;
    };

    return (
      maybeAxios.response?.data?.detail ||
      maybeAxios.response?.data?.error ||
      maybeAxios.message ||
      fallback
    );
  }

  return fallback;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const data = await authApi.login(email, password);

          set({
            user: data.user,
            token: data.access_token,
            refreshToken: data.refresh_token ?? null,
            isAuthenticated: true,
          });

          return { success: true };
        } catch (err) {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false });

          return { success: false, error: extractError(err, 'Invalid email or password') };
        }
      },

      register: async (payload) => {
        try {
          const data = await authApi.register(payload);

          set({
            user: data.user,
            token: data.access_token,
            refreshToken: data.refresh_token ?? null,
            isAuthenticated: true,
          });

          return { success: true };
        } catch (err) {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false });

          return { success: false, error: extractError(err, 'Registration failed') };
        }
      },

      logout: () => {
        // Best-effort revoke; do not block UI on the call.
        authApi.logout().catch(() => {});
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false });

          return false;
        }

        try {
          const data = await authApi.refresh(refreshToken);

          set({
            token: data.access_token,
            refreshToken: data.refresh_token ?? get().refreshToken,
          });

          return true;
        } catch {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false });

          return false;
        }
      },

      loadCurrentUser: async () => {
        try {
          const user = await authApi.me();

          set({ user, isAuthenticated: true });

          return true;
        } catch {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false });

          return false;
        }
      },

      ssoLogin: async (slug, code, redirectUri, state) => {
        try {
          const data = await authApi.exchangeSSOCode(slug, code, redirectUri, state);

          set({
            user: data.user,
            token: data.access_token,
            refreshToken: data.refresh_token ?? null,
            isAuthenticated: true,
          });

          return { success: true };
        } catch (err) {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false });

          return { success: false, error: extractError(err, 'SSO authentication failed') };
        }
      },

      setUserFromToken: (token) => {
        try {
          const claims = jwtDecode<AccessTokenClaims>(token);

          set({
            user: {
              id: parseInt(claims.sub, 10),
              email: claims.email ?? '',
              name: claims.name ?? '',
              role: claims.role ?? 'user',
              is_active: true,
            },
            token,
            isAuthenticated: true,
          });
        } catch {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'cuopt-auth',
      version: 1,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../App';
import { useAuthStore } from '../store/authStore';

// Avoid hitting the network for the public-providers fetch on Login mount,
// for /auth/me on app mount when authenticated, and for /api/config from
// AppShell.
vi.mock('../api/auth', () => ({
  fetchPublicProviders: vi.fn().mockResolvedValue([]),
  getAuthorizeUrl: vi.fn(),
  exchangeSSOCode: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}));

vi.mock('../api/authClient', () => ({
  authClient: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn(),
    request: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

describe('App', () => {
  beforeEach(() => {
    // Default: unauthenticated.
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    // Wipe any persisted state across tests so we always start clean.
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated visitors to the login screen', async () => {
    renderApp();
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /sign in/i }),
      ).toBeInTheDocument();
    });
  });

  it('does not show the legacy AUTH_KEY localStorage entry after login flow refactor', () => {
    renderApp();
    expect(localStorage.getItem('cuopt_auth')).toBeNull();
  });
});

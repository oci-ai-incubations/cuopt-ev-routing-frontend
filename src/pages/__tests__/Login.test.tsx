import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as authApi from '@/api';
import { Login } from '@/pages';
import { useAuthStore } from '@/store';
import type { SSOAuthorizeResponse, SSOProvider, User } from '@/types';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/api/auth');

const sampleProviders: SSOProvider[] = [
  { id: 1, slug: 'oracle-idcs', name: 'Oracle IDCS', type: 'oidc' },
  { id: 2, slug: 'microsoft-entra', name: 'Microsoft Entra', type: 'oidc' },
];

function resetStore() {
  act(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });
}

// Renders Login and waits for the initial fetchPublicProviders effect to settle.
async function renderLogin() {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Login />
    </MemoryRouter>,
  );
  // findByRole retries until the element appears, flushing pending state updates
  // (including the setProviders call from the fetchPublicProviders useEffect).
  await screen.findByRole('button', { name: /sign in/i });
}

beforeEach(() => {
  vi.resetAllMocks();
  resetStore();
  sessionStorage.clear();
  vi.mocked(authApi.fetchPublicProviders).mockResolvedValue([]);
});

afterEach(() => {
  resetStore();
  sessionStorage.clear();
});

describe('Login page', () => {
  it('renders email + password fields and a Sign-in button', async () => {
    await renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('submits form, calls authStore.login, navigates to / on success', async () => {
    const user = userEvent.setup();
    const loginSpy = vi
      .spyOn(useAuthStore.getState(), 'login')
      .mockResolvedValue({ success: true });

    await renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'a@b.test');
    await user.type(screen.getByLabelText('Password'), 'pw');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith('a@b.test', 'pw');
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
  });

  it('shows the returned error inline on failed login', async () => {
    const user = userEvent.setup();

    vi.spyOn(useAuthStore.getState(), 'login').mockResolvedValue({
      success: false,
      error: 'Invalid email or password',
    });

    await renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'a@b.test');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('renders SSO buttons when fetchPublicProviders returns providers', async () => {
    vi.mocked(authApi.fetchPublicProviders).mockResolvedValue(sampleProviders);

    await renderLogin();
    // Wait for the SSO buttons which appear after providers load
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /sign in with oracle idcs/i })).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /sign in with microsoft entra/i }),
    ).toBeInTheDocument();
  });

  it('clicking an SSO button stores state and triggers redirect', async () => {
    const user = userEvent.setup();

    vi.mocked(authApi.fetchPublicProviders).mockResolvedValue(sampleProviders);

    const sso: SSOAuthorizeResponse = {
      authorize_url: 'https://idp.example/authorize?x=y',
      state: 'csrf-token-abc',
    };

    vi.mocked(authApi.getAuthorizeUrl).mockResolvedValue(sso);

    const original = window.location;
    const hrefSetter = vi.fn();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...original,
        get href() {
          return original.href;
        },
        set href(value: string) {
          hrefSetter(value);
        },
      },
    });

    try {
      await renderLogin();
      await user.click(await screen.findByRole('button', { name: /sign in with oracle idcs/i }));

      await waitFor(() => {
        expect(authApi.getAuthorizeUrl).toHaveBeenCalledWith(
          'oracle-idcs',
          expect.stringMatching(/\/sso\/callback\/oracle-idcs$/),
        );
        expect(sessionStorage.getItem('sso_state')).toBe('csrf-token-abc');
        expect(hrefSetter).toHaveBeenCalledWith('https://idp.example/authorize?x=y');
      });
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original });
    }
  });

  it('shows an error if getAuthorizeUrl fails', async () => {
    const user = userEvent.setup();

    vi.mocked(authApi.fetchPublicProviders).mockResolvedValue(sampleProviders);
    vi.mocked(authApi.getAuthorizeUrl).mockRejectedValue(new Error('boom'));

    await renderLogin();
    await user.click(await screen.findByRole('button', { name: /sign in with oracle idcs/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to start sso/i);
  });

  it('redirects to / when the user is already authenticated', async () => {
    const sampleUser: User = {
      id: 1,
      email: 'a@b.test',
      name: 'A',
      role: 'user',
      is_active: true,
    };

    act(() => {
      useAuthStore.setState({
        user: sampleUser,
        token: 'tok',
        refreshToken: 'r',
        isAuthenticated: true,
      });
    });

    render(
      <MemoryRouter
        initialEntries={['/login']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Login />
      </MemoryRouter>,
    );

    // The form is replaced by a Navigate — no Sign-in button rendered
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    });
  });
});

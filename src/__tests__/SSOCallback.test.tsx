import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SSOCallback from '@/pages/SSOCallback';
import { useAuthStore } from '@/store/authStore';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function resetStore() {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
  });
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/sso/callback/:slug" element={<SSOCallback />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  resetStore();
  sessionStorage.clear();
});

afterEach(() => {
  resetStore();
  sessionStorage.clear();
});

describe('SSOCallback page', () => {
  it('exchanges code on mount and navigates to / on success', async () => {
    sessionStorage.setItem('sso_state', 'csrf-1');
    const ssoLoginSpy = vi
      .spyOn(useAuthStore.getState(), 'ssoLogin')
      .mockResolvedValue({ success: true });

    renderAt('/sso/callback/oracle-idcs?code=abc&state=csrf-1');

    await waitFor(() => {
      expect(ssoLoginSpy).toHaveBeenCalledWith(
        'oracle-idcs',
        'abc',
        expect.stringMatching(/\/sso\/callback\/oracle-idcs$/),
        'csrf-1',
      );
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
    // sessionStorage cleared during exchange
    expect(sessionStorage.getItem('sso_state')).toBeNull();
  });

  it('shows an error when state does not match sessionStorage', async () => {
    sessionStorage.setItem('sso_state', 'expected');
    const ssoLoginSpy = vi.spyOn(useAuthStore.getState(), 'ssoLogin');

    renderAt('/sso/callback/oracle-idcs?code=abc&state=tampered');

    expect(await screen.findByRole('alert')).toHaveTextContent(/csrf|state mismatch/i);
    expect(ssoLoginSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /try signing in again/i })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('shows an error and Try-again link when ssoLogin fails', async () => {
    sessionStorage.setItem('sso_state', 'csrf-2');
    vi.spyOn(useAuthStore.getState(), 'ssoLogin').mockResolvedValue({
      success: false,
      error: 'IdP rejected the code',
    });

    renderAt('/sso/callback/oracle-idcs?code=abc&state=csrf-2');

    expect(await screen.findByRole('alert')).toHaveTextContent('IdP rejected the code');
    expect(screen.getByRole('link', { name: /try signing in again/i })).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('shows an error when code is missing', async () => {
    renderAt('/sso/callback/oracle-idcs');

    expect(await screen.findByRole('alert')).toHaveTextContent(/missing authorization code/i);
  });

  it('shows an error when sessionStorage CSRF state is absent (fresh-tab callback)', async () => {
    // No sessionStorage seed — simulates a fresh tab landing on the callback
    // URL with attacker-supplied code+state. Previously the check
    // short-circuited on the falsy expectedState; now it must fail closed.
    const ssoLoginSpy = vi.spyOn(useAuthStore.getState(), 'ssoLogin');

    renderAt('/sso/callback/oracle-idcs?code=abc&state=whatever');

    expect(await screen.findByRole('alert')).toHaveTextContent(/csrf|state mismatch/i);
    expect(ssoLoginSpy).not.toHaveBeenCalled();
  });
});

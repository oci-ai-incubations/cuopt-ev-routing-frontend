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
        <Route path="/auth/callback/:slug" element={<SSOCallback />} />
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

    renderAt('/auth/callback/oracle-idcs?code=abc&state=csrf-1');

    await waitFor(() => {
      expect(ssoLoginSpy).toHaveBeenCalledWith(
        'oracle-idcs',
        'abc',
        expect.stringMatching(/\/auth\/callback\/oracle-idcs$/),
      );
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
    // sessionStorage cleared during exchange
    expect(sessionStorage.getItem('sso_state')).toBeNull();
  });

  it('shows an error when state does not match sessionStorage', async () => {
    sessionStorage.setItem('sso_state', 'expected');
    const ssoLoginSpy = vi.spyOn(useAuthStore.getState(), 'ssoLogin');

    renderAt('/auth/callback/oracle-idcs?code=abc&state=tampered');

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

    renderAt('/auth/callback/oracle-idcs?code=abc&state=csrf-2');

    expect(await screen.findByRole('alert')).toHaveTextContent('IdP rejected the code');
    expect(screen.getByRole('link', { name: /try signing in again/i })).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('shows an error when code is missing', async () => {
    renderAt('/auth/callback/oracle-idcs');

    expect(await screen.findByRole('alert')).toHaveTextContent(/missing authorization code/i);
  });
});

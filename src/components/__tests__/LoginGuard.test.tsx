import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LoginGuard } from '@/components';
import { useAuthStore } from '@/store';
import type { User } from '@/types';

const sampleUser: User = {
  id: 1,
  email: 'a@b.test',
  name: 'A',
  role: 'user',
  is_active: true,
};

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

function renderWith(element: React.ReactNode) {
  return render(
    <MemoryRouter
      initialEntries={['/login']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/" element={<div>home-page</div>} />
        <Route path="/login" element={element} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => resetStore());
afterEach(() => resetStore());

describe('LoginGuard', () => {
  it('renders children when not authenticated', () => {
    renderWith(
      <LoginGuard>
        <div>login-form</div>
      </LoginGuard>,
    );
    expect(screen.getByText('login-form')).toBeInTheDocument();
  });

  it('redirects to / when authenticated', () => {
    act(() => {
      useAuthStore.setState({
        user: sampleUser,
        token: 't',
        refreshToken: 'r',
        isAuthenticated: true,
      });
    });

    renderWith(
      <LoginGuard>
        <div>login-form</div>
      </LoginGuard>,
    );
    expect(screen.queryByText('login-form')).not.toBeInTheDocument();
    expect(screen.getByText('home-page')).toBeInTheDocument();
  });
});

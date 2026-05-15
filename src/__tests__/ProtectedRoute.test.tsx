import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';

import type { User } from '@/types/auth';

const adminUser: User = {
  id: 1,
  email: 'admin@example.com',
  name: 'Admin',
  role: 'admin',
  is_active: true,
};

const normalUser: User = {
  id: 2,
  email: 'user@example.com',
  name: 'User',
  role: 'user',
  is_active: true,
};

function resetStore() {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
  });
}

function renderWith(initialPath: string, element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>login-page</div>} />
        <Route path="/" element={<div>home-page</div>} />
        <Route path="/secret" element={element} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => resetStore());
afterEach(() => resetStore());

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    useAuthStore.setState({
      user: normalUser,
      token: 't',
      refreshToken: 'r',
      isAuthenticated: true,
    });

    renderWith(
      '/secret',
      <ProtectedRoute>
        <div>protected-content</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('protected-content')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderWith(
      '/secret',
      <ProtectedRoute>
        <div>protected-content</div>
      </ProtectedRoute>,
    );
    expect(screen.queryByText('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('login-page')).toBeInTheDocument();
  });

  it('honors requiredRole — allowed role renders children', () => {
    useAuthStore.setState({
      user: adminUser,
      token: 't',
      refreshToken: 'r',
      isAuthenticated: true,
    });

    renderWith(
      '/secret',
      <ProtectedRoute requiredRole="admin">
        <div>admin-content</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('admin-content')).toBeInTheDocument();
  });

  it('honors requiredRole — disallowed role redirects to /', () => {
    useAuthStore.setState({
      user: normalUser,
      token: 't',
      refreshToken: 'r',
      isAuthenticated: true,
    });

    renderWith(
      '/secret',
      <ProtectedRoute requiredRole="admin">
        <div>admin-content</div>
      </ProtectedRoute>,
    );
    expect(screen.queryByText('admin-content')).not.toBeInTheDocument();
    expect(screen.getByText('home-page')).toBeInTheDocument();
  });

  it('accepts an array of allowed roles', () => {
    useAuthStore.setState({
      user: normalUser,
      token: 't',
      refreshToken: 'r',
      isAuthenticated: true,
    });

    renderWith(
      '/secret',
      <ProtectedRoute requiredRole={['admin', 'user']}>
        <div>multi-role-content</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('multi-role-content')).toBeInTheDocument();
  });
});

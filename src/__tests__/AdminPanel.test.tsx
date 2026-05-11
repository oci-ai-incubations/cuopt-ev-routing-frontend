import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminPanel } from '@/components/Admin/auth/AdminPanel';
import { useAuthStore } from '@/store/authStore';

import type { User } from '@/types/auth';

vi.mock('@/components/Admin/AdminPage', () => ({
  AdminPage: () => <div>config-tab-content</div>,
}));
vi.mock('@/components/Admin/auth/UserManagement', () => ({
  UserManagement: () => <div>users-tab-content</div>,
}));
vi.mock('@/components/Admin/auth/RolesPermissions', () => ({
  RolesPermissions: () => <div>roles-tab-content</div>,
}));
vi.mock('@/components/Admin/auth/Groups', () => ({
  Groups: () => <div>groups-tab-content</div>,
}));
vi.mock('@/components/Admin/auth/IdentityProviders', () => ({
  IdentityProviders: () => <div>providers-tab-content</div>,
}));
vi.mock('@/components/Admin/auth/CollectionPermissions', () => ({
  CollectionPermissions: () => <div>collections-tab-content</div>,
}));
vi.mock('@/components/Admin/auth/AuditLog', () => ({
  AuditLog: () => <div>audit-tab-content</div>,
}));

const adminUser: User = {
  id: 1,
  email: 'a@e.com',
  name: 'Admin',
  role: 'admin',
  is_active: true,
};

const nonAdminUser: User = {
  id: 2,
  email: 'u@e.com',
  name: 'User',
  role: 'user',
  is_active: true,
};

function setUser(user: User | null) {
  useAuthStore.setState({
    user,
    token: user ? 'tok' : null,
    refreshToken: user ? 'rtok' : null,
    isAuthenticated: !!user,
  });
}

beforeEach(() => setUser(adminUser));
afterEach(() => setUser(null));

describe('AdminPanel', () => {
  it('renders all 7 tabs for admin role and shows the Configuration tab by default', () => {
    render(<AdminPanel />);
    expect(screen.getByRole('tab', { name: /configuration/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^users$/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /roles & permissions/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /groups/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /identity providers/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /collection permissions/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /audit log/i })).toBeInTheDocument();
    expect(screen.getByText('config-tab-content')).toBeInTheDocument();
  });

  it('switches tabs on click', async () => {
    render(<AdminPanel />);
    await userEvent.click(screen.getByRole('tab', { name: /^users$/i }));
    expect(screen.getByText('users-tab-content')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /audit log/i }));
    expect(screen.getByText('audit-tab-content')).toBeInTheDocument();
  });

  it('hides auth-admin tabs when role is not admin', () => {
    setUser(nonAdminUser);
    render(<AdminPanel />);
    expect(screen.getByRole('tab', { name: /configuration/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /^users$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /audit log/i })).not.toBeInTheDocument();
  });
});

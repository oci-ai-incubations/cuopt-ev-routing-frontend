import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminPanel } from '@/components';
import { useAuthStore } from '@/store';
import type { PackAuthModel, User } from '@/types';

const { fetchPackModelMock } = vi.hoisted(() => ({
  fetchPackModelMock: vi.fn<() => Promise<PackAuthModel>>(),
}));

vi.mock('@/api/admin', () => ({
  fetchPackModel: fetchPackModelMock,
}));
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
vi.mock('@/components/Admin/auth/ApiKeysPanel', () => ({
  ApiKeysPanel: () => <div>api-keys-tab-content</div>,
}));
vi.mock('@/components/Admin/auth/FeatureFlagsPanel', () => ({
  FeatureFlagsPanel: () => <div>features-tab-content</div>,
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

const CUOPT_MODEL: PackAuthModel = {
  pack_id: 'cuopt',
  roles: ['admin', 'user', 'reader'],
  permissions: [
    'cuopt.solve',
    'cuopt.view',
    'admin.users.manage',
    'admin.config.write',
    'admin.features.toggle',
    'admin.audit.view',
  ],
  role_permissions: {},
};

const PAAS_RAG_MODEL: PackAuthModel = {
  pack_id: 'paas_rag',
  roles: ['admin', 'user', 'reader', 'pending'],
  permissions: [
    'admin.users.manage',
    'admin.roles.manage',
    'admin.groups.manage',
    'admin.providers.manage',
    'admin.collections.manage',
    'admin.audit.view',
  ],
  role_permissions: {},
};

const BASE_MODEL: PackAuthModel = {
  pack_id: 'base',
  roles: ['admin', 'user'],
  permissions: ['admin.users.manage', 'admin.audit.view'],
  role_permissions: {},
};

function setUser(user: User | null) {
  act(() => {
    useAuthStore.setState({
      user,
      token: user ? 'tok' : null,
      refreshToken: user ? 'rtok' : null,
      isAuthenticated: !!user,
    });
  });
}

// Render AdminPanel and flush the async fetchPackModel effect.
async function renderPanel() {
  await act(async () => {
    render(<AdminPanel />);
  });
}

beforeEach(() => {
  setUser(adminUser);
  fetchPackModelMock.mockReset();
});
afterEach(() => setUser(null));

describe('AdminPanel — dynamic tabs', () => {
  it('cuopt model: Configuration / Users / API Keys / Feature Flags / Audit Log', async () => {
    fetchPackModelMock.mockResolvedValue(CUOPT_MODEL);
    await renderPanel();
    await waitFor(() => expect(screen.getByRole('tab', { name: /^users$/i })).toBeInTheDocument());
    expect(screen.getByRole('tab', { name: /configuration/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /api keys/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /feature flags/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /audit log/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /roles & permissions/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /^groups$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /identity providers/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /collection permissions/i })).not.toBeInTheDocument();
  });

  it('paas_rag model: full RBAC tab set (no cuopt-only tabs)', async () => {
    fetchPackModelMock.mockResolvedValue(PAAS_RAG_MODEL);
    await renderPanel();
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: /roles & permissions/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole('tab', { name: /^users$/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^groups$/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /identity providers/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /collection permissions/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /audit log/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /api keys/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /feature flags/i })).not.toBeInTheDocument();
  });

  it('base model: only Configuration / Users / Audit Log', async () => {
    fetchPackModelMock.mockResolvedValue(BASE_MODEL);
    await renderPanel();
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: /audit log/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole('tab', { name: /configuration/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^users$/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /roles & permissions/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /api keys/i })).not.toBeInTheDocument();
  });

  it('non-admin user sees only Configuration regardless of pack model', async () => {
    setUser(nonAdminUser);
    fetchPackModelMock.mockResolvedValue(CUOPT_MODEL);
    await renderPanel();
    expect(screen.getByRole('tab', { name: /configuration/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /^users$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /api keys/i })).not.toBeInTheDocument();
  });

  it('switches tabs on click', async () => {
    fetchPackModelMock.mockResolvedValue(CUOPT_MODEL);
    await renderPanel();
    await waitFor(() => expect(screen.getByRole('tab', { name: /api keys/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('tab', { name: /api keys/i }));
    expect(screen.getByText('api-keys-tab-content')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /feature flags/i }));
    expect(screen.getByText('features-tab-content')).toBeInTheDocument();
  });

  it('shows error if pack model fetch fails (still renders Configuration)', async () => {
    fetchPackModelMock.mockRejectedValue(new Error('boom'));
    await renderPanel();
    await waitFor(() => expect(screen.getByText(/could not load pack model/i)).toBeInTheDocument());
    expect(screen.getByRole('tab', { name: /configuration/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /^users$/i })).not.toBeInTheDocument();
  });
});

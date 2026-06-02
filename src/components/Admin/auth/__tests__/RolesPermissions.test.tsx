import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createRole, deleteRole, listPermissions, listRoles, setRolePermissions } from '@/api';
import { RolesPermissions } from '@/components';
import type { Permission, Role } from '@/types';

vi.mock('@/api/admin', () => ({
  listRoles: vi.fn(),
  createRole: vi.fn(),
  deleteRole: vi.fn(),
  listPermissions: vi.fn(),
  setRolePermissions: vi.fn(),
}));

const ROLES: Role[] = [
  {
    id: 1,
    name: 'admin',
    description: 'Built-in admin',
    is_system: true,
    permissions: ['users:list'],
  },
  { id: 2, name: 'editor', description: 'Custom editor', is_system: false, permissions: [] },
];

const PERMS: Permission[] = [
  { id: 1, codename: 'users:list', description: 'List users', resource_type: null },
  { id: 2, codename: 'users:update', description: 'Update users', resource_type: null },
];

beforeEach(() => {
  vi.mocked(listRoles).mockResolvedValue(ROLES);
  vi.mocked(listPermissions).mockResolvedValue(PERMS);
  vi.mocked(createRole).mockResolvedValue({
    id: 99,
    name: 'newrole',
    description: '',
    is_system: false,
    permissions: [],
  });
  vi.mocked(deleteRole).mockResolvedValue(undefined);
  vi.mocked(setRolePermissions).mockResolvedValue(ROLES[1]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('RolesPermissions', () => {
  it('lists roles and shows system badge', async () => {
    render(<RolesPermissions />);
    await waitFor(() => expect(screen.getByText('admin')).toBeInTheDocument());
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('editor')).toBeInTheDocument();
  });

  it('opens the create-role modal and submits', async () => {
    render(<RolesPermissions />);
    await waitFor(() => screen.getByText('admin'));
    await userEvent.click(screen.getByRole('button', { name: /create role/i }));
    const nameInput = screen.getByPlaceholderText('e.g. editor');

    await userEvent.type(nameInput, 'newrole');
    await userEvent.click(screen.getByRole('button', { name: /^create$/i }));
    await waitFor(() =>
      expect(createRole).toHaveBeenCalledWith({ name: 'newrole', description: '' }),
    );
  });

  it('deletes a custom role', async () => {
    render(<RolesPermissions />);
    await waitFor(() => screen.getByText('editor'));
    await userEvent.click(screen.getByRole('button', { name: /delete editor/i }));
    await waitFor(() => expect(deleteRole).toHaveBeenCalledWith(2));
  });
});

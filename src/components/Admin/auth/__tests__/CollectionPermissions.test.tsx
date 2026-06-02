import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteCollectionPermission,
  listCollectionPermissions,
  listUsers,
  setCollectionPermission,
} from '@/api';
import { CollectionPermissions } from '@/components';
import type { AdminUser, CollectionPermission } from '@/types';

vi.mock('@/api/admin', () => ({
  listUsers: vi.fn(),
  listCollectionPermissions: vi.fn(),
  setCollectionPermission: vi.fn(),
  deleteCollectionPermission: vi.fn(),
}));

const USERS: AdminUser[] = [
  { id: 1, email: 'a@e.com', name: 'Admin', role: 'admin', is_active: true, created_at: '' },
  { id: 2, email: 'r@e.com', name: 'Rita Reader', role: 'reader', is_active: true, created_at: '' },
];

const PERMS: CollectionPermission[] = [
  {
    id: 100,
    user_id: 2,
    collection_id: 'cuopt-routes',
    permission_level: 'read',
    user_email: 'r@e.com',
  },
];

beforeEach(() => {
  vi.mocked(listUsers).mockResolvedValue(USERS);
  vi.mocked(listCollectionPermissions).mockResolvedValue(PERMS);
  vi.mocked(setCollectionPermission).mockResolvedValue(PERMS[0]);
  vi.mocked(deleteCollectionPermission).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('CollectionPermissions', () => {
  it('loads collection permissions after entering an ID', async () => {
    render(<CollectionPermissions />);
    await waitFor(() => screen.getByPlaceholderText('e.g. cuopt-routes'));
    const input = screen.getByPlaceholderText('e.g. cuopt-routes');

    await userEvent.type(input, 'cuopt-routes');
    await userEvent.click(screen.getByRole('button', { name: /^load$/i }));
    await waitFor(() => expect(listCollectionPermissions).toHaveBeenCalledWith('cuopt-routes'));
    expect(await screen.findByText('r@e.com')).toBeInTheDocument();
  });

  it('revokes an existing permission', async () => {
    render(<CollectionPermissions />);
    const input = await screen.findByPlaceholderText('e.g. cuopt-routes');

    await userEvent.type(input, 'cuopt-routes');
    await userEvent.click(screen.getByRole('button', { name: /^load$/i }));
    const row = await screen.findByTestId('perm-row-100');
    const revoke = row.querySelector('button');

    expect(revoke).not.toBeNull();
    await userEvent.click(revoke as HTMLButtonElement);
    await waitFor(() => expect(deleteCollectionPermission).toHaveBeenCalledWith('cuopt-routes', 2));
  });
});

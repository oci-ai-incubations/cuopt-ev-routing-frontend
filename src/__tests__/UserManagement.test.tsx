import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserManagement } from '@/components/Admin/auth/UserManagement';

vi.mock('@/api/admin', () => ({
  listUsers: vi.fn(),
  updateUser: vi.fn(),
}));

import { listUsers, updateUser } from '@/api/admin';

import type { AdminUser } from '@/types/admin';

const USERS: AdminUser[] = [
  { id: 1, email: 'a@e.com', name: 'Admin User', role: 'admin', is_active: true, created_at: '' },
  { id: 2, email: 'p@e.com', name: 'Pending Person', role: 'pending', is_active: false, created_at: '' },
];

const mockedList = vi.mocked(listUsers);
const mockedUpdate = vi.mocked(updateUser);

beforeEach(() => {
  mockedList.mockResolvedValue(USERS);
  mockedUpdate.mockImplementation(async (id, patch) => ({
    ...USERS.find((u) => u.id === id)!,
    ...patch,
  }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('UserManagement', () => {
  it('lists users from the API', async () => {
    render(<UserManagement />);
    await waitFor(() => expect(screen.getByText('Admin User')).toBeInTheDocument());
    expect(screen.getByText('Pending Person')).toBeInTheDocument();
  });

  it('promotes a pending user via the role selector', async () => {
    render(<UserManagement />);
    await waitFor(() => screen.getByTestId('user-row-2'));
    const select = screen.getAllByRole('combobox')[1] as HTMLSelectElement;
    await userEvent.selectOptions(select, 'user');
    await waitFor(() => expect(mockedUpdate).toHaveBeenCalledWith(2, { role: 'user' }));
  });

  it('toggles active status', async () => {
    render(<UserManagement />);
    await waitFor(() => screen.getByTestId('user-row-1'));
    const deactivate = screen.getByRole('button', { name: /deactivate/i });
    await userEvent.click(deactivate);
    await waitFor(() =>
      expect(mockedUpdate).toHaveBeenCalledWith(1, { is_active: false }),
    );
  });
});

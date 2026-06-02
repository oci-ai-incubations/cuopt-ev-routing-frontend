import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGroup, listGroupMembers, listGroupRoles, listGroups, listRoles } from '@/api';
import { Groups } from '@/components';
import type { Group } from '@/types';

vi.mock('@/api/admin', () => ({
  listGroups: vi.fn(),
  createGroup: vi.fn(),
  listGroupMembers: vi.fn(),
  listGroupRoles: vi.fn(),
  listRoles: vi.fn(),
  addGroupMember: vi.fn(),
  removeGroupMember: vi.fn(),
  setGroupRoles: vi.fn(),
}));

const GROUPS: Group[] = [
  { id: 10, name: 'engineering', display_name: 'Engineering', source: 'local' },
];

beforeEach(() => {
  vi.mocked(listGroups).mockResolvedValue(GROUPS);
  vi.mocked(listGroupMembers).mockResolvedValue([]);
  vi.mocked(listGroupRoles).mockResolvedValue([]);
  vi.mocked(listRoles).mockResolvedValue([]);
  vi.mocked(createGroup).mockResolvedValue({
    id: 11,
    name: 'sales',
    display_name: 'Sales',
    source: 'local',
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Groups', () => {
  it('renders groups list with source badge', async () => {
    render(<Groups />);
    await waitFor(() => expect(screen.getByText('Engineering')).toBeInTheDocument());
    expect(screen.getByText('local')).toBeInTheDocument();
  });

  it('opens and submits the create-group modal', async () => {
    render(<Groups />);
    await waitFor(() => screen.getByText('Engineering'));
    await userEvent.click(screen.getByRole('button', { name: /create group/i }));
    const input = screen.getByPlaceholderText('e.g. engineering');

    await userEvent.type(input, 'sales');
    await userEvent.click(screen.getByRole('button', { name: /^create$/i }));
    await waitFor(() => expect(createGroup).toHaveBeenCalledWith('sales'));
  });

  it('selects a group and loads members + roles', async () => {
    render(<Groups />);
    await waitFor(() => screen.getByText('Engineering'));
    await userEvent.click(screen.getByTestId('group-row-10'));
    await waitFor(() => expect(listGroupMembers).toHaveBeenCalledWith(10));
    expect(listGroupRoles).toHaveBeenCalledWith(10);
  });
});

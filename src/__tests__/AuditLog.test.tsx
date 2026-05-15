import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditLog } from '@/components/Admin/auth/AuditLog';

vi.mock('@/api/admin', () => ({
  queryAuditLog: vi.fn(),
  exportAuditLog: vi.fn(),
}));

import { exportAuditLog, queryAuditLog } from '@/api/admin';

import type { AuditLogEntry } from '@/types/admin';

const ENTRIES: AuditLogEntry[] = [
  {
    id: 1,
    timestamp: '2026-05-11T03:39:06Z',
    event_type: 'login',
    actor_email: 'a@e.com',
    target: '',
    result: 'success',
  },
  {
    id: 2,
    timestamp: '2026-05-11T03:39:10Z',
    event_type: 'login_failed',
    actor_email: 'b@e.com',
    target: '',
    result: 'failure',
  },
];

beforeEach(() => {
  vi.mocked(queryAuditLog).mockResolvedValue({ items: ENTRIES, total: 2 });
  vi.mocked(exportAuditLog).mockResolvedValue(new Blob(['[]'], { type: 'application/json' }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AuditLog', () => {
  it('queries on mount and renders entries', async () => {
    render(<AuditLog />);
    await waitFor(() => expect(queryAuditLog).toHaveBeenCalled());
    expect(await screen.findByText('a@e.com')).toBeInTheDocument();
    expect(screen.getByText('b@e.com')).toBeInTheDocument();
  });

  it('triggers an export', async () => {
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
    render(<AuditLog />);
    await waitFor(() => screen.getByText('a@e.com'));
    await userEvent.click(screen.getByRole('button', { name: /export/i }));
    await waitFor(() => expect(exportAuditLog).toHaveBeenCalled());
    URL.createObjectURL = origCreate;
    URL.revokeObjectURL = origRevoke;
  });
});

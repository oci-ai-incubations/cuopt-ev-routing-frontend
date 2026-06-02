import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createProvider, listClaimMappings, listProviders, updateProvider } from '@/api';
import { IdentityProviders } from '@/components';
import type { IdentityProvider } from '@/types';

vi.mock('@/api/admin', () => ({
  listProviders: vi.fn(),
  createProvider: vi.fn(),
  updateProvider: vi.fn(),
  deleteProvider: vi.fn(),
  listClaimMappings: vi.fn(),
  createClaimMapping: vi.fn(),
  deleteClaimMapping: vi.fn(),
}));

const PROVIDERS: IdentityProvider[] = [
  {
    id: 1,
    name: 'Oracle IDCS',
    type: 'oidc',
    slug: 'oracle-idcs',
    is_active: true,
    config: {},
  },
];

beforeEach(() => {
  vi.mocked(listProviders).mockResolvedValue(PROVIDERS);
  vi.mocked(listClaimMappings).mockResolvedValue([]);
  vi.mocked(createProvider).mockResolvedValue({
    id: 2,
    name: 'Entra',
    type: 'oidc',
    slug: 'entra',
    is_active: true,
    config: {},
  });
  vi.mocked(updateProvider).mockImplementation(async (_id, patch) => ({
    ...PROVIDERS[0],
    ...(patch as Partial<IdentityProvider>),
  }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('IdentityProviders', () => {
  it('lists providers with type and slug', async () => {
    render(<IdentityProviders />);
    await waitFor(() => expect(screen.getByText('Oracle IDCS')).toBeInTheDocument());
    expect(screen.getByText('OIDC')).toBeInTheDocument();
    expect(screen.getByText('/oracle-idcs')).toBeInTheDocument();
  });

  it('toggles a provider active flag', async () => {
    render(<IdentityProviders />);
    await waitFor(() => screen.getByText('Oracle IDCS'));
    const toggle = screen.getByRole('switch', { name: /active/i });

    await userEvent.click(toggle);
    await waitFor(() => expect(updateProvider).toHaveBeenCalledWith(1, { is_active: false }));
  });

  it('expands a provider to fetch claim mappings', async () => {
    render(<IdentityProviders />);
    await waitFor(() => screen.getByText('Oracle IDCS'));
    await userEvent.click(screen.getByTestId('provider-row-1'));
    await waitFor(() => expect(listClaimMappings).toHaveBeenCalledWith(1));
  });
});

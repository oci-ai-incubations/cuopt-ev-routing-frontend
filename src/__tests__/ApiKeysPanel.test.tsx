import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiKeysPanel } from '@/components/Admin/auth/ApiKeysPanel';

import type { InstanceConfig } from '@/types/admin';

const { fetchInstanceConfigMock, updateApiKeysMock } = vi.hoisted(() => ({
  fetchInstanceConfigMock: vi.fn<() => Promise<InstanceConfig>>(),
  updateApiKeysMock: vi.fn<(payload: Record<string, string>) => Promise<InstanceConfig>>(),
}));

vi.mock('@/api/admin', () => ({
  fetchInstanceConfig: fetchInstanceConfigMock,
  updateApiKeys: updateApiKeysMock,
}));

const BLANK: InstanceConfig = {
  google_maps_api_key: '',
  openweathermap_api_key: '',
  genai_chat_enabled: true,
  weather_enabled: true,
  sso_enabled: false,
  updated_at: '2026-05-11T00:00:00Z',
  updated_by: null,
};

const REDACTED: InstanceConfig = {
  ...BLANK,
  google_maps_api_key: '***',
  openweathermap_api_key: '***',
};

beforeEach(() => {
  fetchInstanceConfigMock.mockReset();
  updateApiKeysMock.mockReset();
});

describe('ApiKeysPanel', () => {
  it('shows "(not configured)" placeholders when both keys are unset', async () => {
    fetchInstanceConfigMock.mockResolvedValue(BLANK);
    render(<ApiKeysPanel />);
    await waitFor(() => expect(screen.getByText(/google maps api key/i)).toBeInTheDocument());
    expect(screen.getAllByPlaceholderText('(not configured)')).toHaveLength(2);
  });

  it('shows "*** (set)" placeholders when keys are configured', async () => {
    fetchInstanceConfigMock.mockResolvedValue(REDACTED);
    render(<ApiKeysPanel />);
    await waitFor(() =>
      expect(screen.getAllByPlaceholderText(/\*\*\* \(set/i)).toHaveLength(2),
    );
  });

  it('Save button disabled when no fields are typed', async () => {
    fetchInstanceConfigMock.mockResolvedValue(BLANK);
    render(<ApiKeysPanel />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled(),
    );
  });

  it('only includes typed fields in PATCH payload', async () => {
    fetchInstanceConfigMock.mockResolvedValue(BLANK);
    updateApiKeysMock.mockResolvedValue({ ...BLANK, google_maps_api_key: '***' });
    render(<ApiKeysPanel />);
    await waitFor(() =>
      expect(screen.getAllByPlaceholderText('(not configured)')).toHaveLength(2),
    );

    // Google Maps input is the first one (form lists it first)
    const gmInput = screen.getAllByPlaceholderText('(not configured)')[0] as HTMLInputElement;
    await userEvent.type(gmInput, 'NEW-MAPS-KEY');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(updateApiKeysMock).toHaveBeenCalledTimes(1));
    expect(updateApiKeysMock).toHaveBeenCalledWith({ google_maps_api_key: 'NEW-MAPS-KEY' });
    // openweathermap_api_key should NOT be in payload (user didn't type it)
    expect(updateApiKeysMock.mock.calls[0][0]).not.toHaveProperty('openweathermap_api_key');
  });

  it('renders error when save fails', async () => {
    fetchInstanceConfigMock.mockResolvedValue(BLANK);
    updateApiKeysMock.mockRejectedValue(new Error('Save broken'));
    render(<ApiKeysPanel />);
    await waitFor(() =>
      expect(screen.getAllByPlaceholderText('(not configured)')).toHaveLength(2),
    );
    await userEvent.type(
      screen.getAllByPlaceholderText('(not configured)')[0],
      'x',
    );
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(screen.getByText(/save broken/i)).toBeInTheDocument());
  });
});

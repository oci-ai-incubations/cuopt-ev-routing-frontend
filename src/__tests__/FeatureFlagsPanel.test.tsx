import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FeatureFlagsPanel } from '@/components/Admin/auth/FeatureFlagsPanel';

import type { FeatureFlagsUpdate, InstanceConfig } from '@/types/admin';

const { fetchInstanceConfigMock, updateFeaturesMock } = vi.hoisted(() => ({
  fetchInstanceConfigMock: vi.fn<() => Promise<InstanceConfig>>(),
  updateFeaturesMock: vi.fn<(payload: FeatureFlagsUpdate) => Promise<InstanceConfig>>(),
}));

vi.mock('@/api/admin', () => ({
  fetchInstanceConfig: fetchInstanceConfigMock,
  updateFeatures: updateFeaturesMock,
}));

const DEFAULT: InstanceConfig = {
  google_maps_api_key: '',
  openweathermap_api_key: '',
  genai_chat_enabled: true,
  weather_enabled: true,
  sso_enabled: false,
  updated_at: '2026-05-11T00:00:00Z',
  updated_by: null,
};

beforeEach(() => {
  fetchInstanceConfigMock.mockReset();
  updateFeaturesMock.mockReset();
});

describe('FeatureFlagsPanel', () => {
  it('renders three switches reflecting current state', async () => {
    fetchInstanceConfigMock.mockResolvedValue(DEFAULT);
    render(<FeatureFlagsPanel />);
    await waitFor(() => expect(screen.getAllByRole('switch')).toHaveLength(3));
    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toHaveAttribute('aria-checked', 'true'); // genai
    expect(switches[1]).toHaveAttribute('aria-checked', 'true'); // weather
    expect(switches[2]).toHaveAttribute('aria-checked', 'false'); // sso
  });

  it('toggling a switch PATCHes only that field', async () => {
    fetchInstanceConfigMock.mockResolvedValue(DEFAULT);
    updateFeaturesMock.mockResolvedValue({ ...DEFAULT, genai_chat_enabled: false });
    render(<FeatureFlagsPanel />);
    await waitFor(() => expect(screen.getAllByRole('switch')).toHaveLength(3));

    const switches = screen.getAllByRole('switch');
    await userEvent.click(switches[0]); // GenAI toggle

    await waitFor(() => expect(updateFeaturesMock).toHaveBeenCalledTimes(1));
    expect(updateFeaturesMock).toHaveBeenCalledWith({ genai_chat_enabled: false });
  });

  it('renders error when PATCH fails', async () => {
    fetchInstanceConfigMock.mockResolvedValue(DEFAULT);
    updateFeaturesMock.mockRejectedValue(new Error('Update broken'));
    render(<FeatureFlagsPanel />);
    await waitFor(() => expect(screen.getAllByRole('switch')).toHaveLength(3));
    await userEvent.click(screen.getAllByRole('switch')[2]); // SSO toggle
    await waitFor(() => expect(screen.getByText(/update broken/i)).toBeInTheDocument());
  });
});

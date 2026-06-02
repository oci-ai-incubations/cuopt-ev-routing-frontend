import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/data/locationData', () => ({
  SCENARIO_PRESETS: [{ id: 'belron', name: 'Belron Field Service', jobTypes: [] }],
  getCountryByCode: vi.fn(() => ({
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    licensePlateExample: 'AB12 CDE',
    cities: [{ id: 'london', name: 'London', timezone: 'Europe/London' }],
    currency: { code: 'GBP', symbol: '£', position: 'before' },
  })),
}));

vi.mock('@/store/configStore', () => ({
  useConfigStore: vi.fn(),
}));

vi.mock('@/components/Admin/RegionSettings', () => ({
  RegionSettings: () => <div data-testid="region-settings" />,
}));
vi.mock('@/components/Admin/MapDefaults', () => ({
  MapDefaults: () => <div data-testid="map-defaults" />,
}));
vi.mock('@/components/Admin/BusinessDefaults', () => ({
  BusinessDefaults: () => <div data-testid="business-defaults" />,
}));
vi.mock('@/components/Admin/ScenarioPresets', () => ({
  ScenarioPresets: () => <div data-testid="scenario-presets" />,
}));

import { AdminPage } from '@/components/Admin/AdminPage';
import { useConfigStore } from '@/store/configStore';

const resetToDefaults = vi.fn();

const mockConfig = {
  countryCode: 'GB',
  cityId: 'london',
  defaultVehicles: 12,
  activeScenario: 'belron',
  currency: { symbol: '£', code: 'GBP', position: 'before' },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useConfigStore).mockReturnValue({
    config: mockConfig,
    setCountry: vi.fn(),
    setCity: vi.fn(),
    setDistanceUnit: vi.fn(),
    setTimeFormat: vi.fn(),
    setVehicleLabelType: vi.fn(),
    setDefaultVehicles: vi.fn(),
    setDefaultShiftHours: vi.fn(),
    setWorkingHours: vi.fn(),
    setDefaultCenter: vi.fn(),
    setDefaultZoom: vi.fn(),
    setServiceRadius: vi.fn(),
    setActiveScenario: vi.fn(),
    setUseScenarioJobTypes: vi.fn(),
    setUseScenarioRevenue: vi.fn(),
    setUseScenarioMetrics: vi.fn(),
    resetToDefaults,
  } as never);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('AdminPage', () => {
  it('renders the Configuration Settings heading', () => {
    render(<AdminPage />);
    expect(screen.getByText('Configuration Settings')).toBeInTheDocument();
  });

  it('renders Save and Reset buttons', () => {
    render(<AdminPage />);
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('renders all four section stubs', () => {
    render(<AdminPage />);
    expect(screen.getByTestId('region-settings')).toBeInTheDocument();
    expect(screen.getByTestId('map-defaults')).toBeInTheDocument();
    expect(screen.getByTestId('business-defaults')).toBeInTheDocument();
    expect(screen.getByTestId('scenario-presets')).toBeInTheDocument();
  });

  it('shows configuration summary with region and fleet data', () => {
    render(<AdminPage />);
    expect(screen.getByText('Region')).toBeInTheDocument();
    expect(screen.getByText('Fleet Size')).toBeInTheDocument();
    expect(screen.getByText('12 vehicles')).toBeInTheDocument();
  });

  it('shows "Saved" immediately after clicking Save', () => {
    vi.useFakeTimers();
    render(<AdminPage />);
    // fireEvent.click is synchronous — no internal delays that conflict with fake timers
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('reverts Save button label back to "Save" after 2 seconds', () => {
    vi.useFakeTimers();
    render(<AdminPage />);
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('calls resetToDefaults and shows "Saved" when Reset is confirmed', () => {
    vi.useFakeTimers();
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    render(<AdminPage />);
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(resetToDefaults).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('does not call resetToDefaults when Reset dialog is cancelled', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));
    const user = userEvent.setup();

    render(<AdminPage />);
    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(resetToDefaults).not.toHaveBeenCalled();
  });

  it('renders the info banner about browser persistence', () => {
    render(<AdminPage />);
    expect(screen.getByText(/automatically saved to your browser/i)).toBeInTheDocument();
  });
});

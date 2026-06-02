import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RegionSettings } from '@/components';
import type { AppConfig } from '@/store';

vi.mock('@/data/locationData', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();

  return {
    ...actual,
    COUNTRIES: [
      {
        code: 'GB',
        name: 'United Kingdom',
        flag: '🇬🇧',
        cities: [
          { id: 'london', name: 'London', timezone: 'Europe/London' },
          { id: 'manchester', name: 'Manchester', timezone: 'Europe/London' },
        ],
      },
      {
        code: 'US',
        name: 'United States',
        flag: '🇺🇸',
        cities: [{ id: 'nyc', name: 'New York', timezone: 'America/New_York' }],
      },
    ],
  };
});

const config = {
  countryCode: 'GB',
  cityId: 'london',
  currency: { symbol: '£', code: 'GBP', position: 'before' },
  dateFormat: 'DD/MM/YYYY',
  distanceUnit: 'km',
  timeFormat: '24h',
} as AppConfig;

const cities = [
  { id: 'london', name: 'London', timezone: 'Europe/London' },
  { id: 'manchester', name: 'Manchester', timezone: 'Europe/London' },
];

describe('RegionSettings', () => {
  it('renders section title', () => {
    render(
      <RegionSettings
        config={config}
        cities={cities}
        onCountryChange={vi.fn()}
        onCityChange={vi.fn()}
        onDistanceUnitChange={vi.fn()}
        onTimeFormatChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Region Settings')).toBeInTheDocument();
  });

  it('shows current country in the Country select trigger button', () => {
    render(
      <RegionSettings
        config={config}
        cities={cities}
        onCountryChange={vi.fn()}
        onCityChange={vi.fn()}
        onDistanceUnitChange={vi.fn()}
        onTimeFormatChange={vi.fn()}
      />,
    );
    // The trigger is a button — use button role to avoid ambiguity with hidden <option>
    expect(screen.getByRole('button', { name: /united kingdom/i })).toBeInTheDocument();
  });

  it('calls onCountryChange when a country is selected', async () => {
    const onCountryChange = vi.fn();
    const user = userEvent.setup();

    render(
      <RegionSettings
        config={config}
        cities={cities}
        onCountryChange={onCountryChange}
        onCityChange={vi.fn()}
        onDistanceUnitChange={vi.fn()}
        onTimeFormatChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /united kingdom/i }));
    await user.click(screen.getByRole('button', { name: /united states/i }));
    expect(onCountryChange).toHaveBeenCalledWith('US');
  });

  it('calls onCityChange when a city is selected', async () => {
    const onCityChange = vi.fn();
    const user = userEvent.setup();

    render(
      <RegionSettings
        config={config}
        cities={cities}
        onCountryChange={vi.fn()}
        onCityChange={onCityChange}
        onDistanceUnitChange={vi.fn()}
        onTimeFormatChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /london/i }));
    await user.click(screen.getByRole('button', { name: /manchester/i }));
    expect(onCityChange).toHaveBeenCalledWith('manchester');
  });

  it('displays currency symbol+code, date format, and timezone', () => {
    render(
      <RegionSettings
        config={config}
        cities={cities}
        onCountryChange={vi.fn()}
        onCityChange={vi.fn()}
        onDistanceUnitChange={vi.fn()}
        onTimeFormatChange={vi.fn()}
      />,
    );
    expect(screen.getByText('£ GBP')).toBeInTheDocument();
    expect(screen.getByText('DD/MM/YYYY')).toBeInTheDocument();
    expect(screen.getByText('Europe/London')).toBeInTheDocument();
  });

  it('calls onDistanceUnitChange when a distance radio is clicked', async () => {
    const onDistanceUnitChange = vi.fn();
    const user = userEvent.setup();

    render(
      <RegionSettings
        config={config}
        cities={cities}
        onCountryChange={vi.fn()}
        onCityChange={vi.fn()}
        onDistanceUnitChange={onDistanceUnitChange}
        onTimeFormatChange={vi.fn()}
      />,
    );
    await user.click(screen.getByText('Miles'));
    expect(onDistanceUnitChange).toHaveBeenCalledWith('miles');
  });

  it('calls onTimeFormatChange when a time format radio is clicked', async () => {
    const onTimeFormatChange = vi.fn();
    const user = userEvent.setup();

    render(
      <RegionSettings
        config={config}
        cities={cities}
        onCountryChange={vi.fn()}
        onCityChange={vi.fn()}
        onDistanceUnitChange={vi.fn()}
        onTimeFormatChange={onTimeFormatChange}
      />,
    );
    await user.click(screen.getByText('12-hour'));
    expect(onTimeFormatChange).toHaveBeenCalledWith('12h');
  });

  it('shows "UTC" timezone when no city matches the current cityId', () => {
    render(
      <RegionSettings
        config={{ ...config, cityId: 'unknown-city' }}
        cities={cities}
        onCountryChange={vi.fn()}
        onCityChange={vi.fn()}
        onDistanceUnitChange={vi.fn()}
        onTimeFormatChange={vi.fn()}
      />,
    );
    expect(screen.getByText('UTC')).toBeInTheDocument();
  });
});

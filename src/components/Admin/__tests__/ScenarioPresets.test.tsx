import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ScenarioPresets } from '@/components';
import type { AppConfig } from '@/store';

vi.mock('@/data/locationData', () => ({
  SCENARIO_PRESETS: [
    {
      id: 'belron',
      name: 'Belron Field Service',
      jobTypes: [
        {
          id: 'replacement',
          label: 'Windshield Replacement',
          duration: 90,
          revenue: 350,
          defaultPercentage: 50,
          color: '#F59E0B',
        },
        {
          id: 'chip_repair',
          label: 'Chip Repair',
          duration: 45,
          revenue: 85,
          defaultPercentage: 25,
          color: '#10B981',
        },
      ],
    },
    { id: 'logistics', name: 'Last-Mile Logistics', jobTypes: [] },
  ],
}));

const baseConfig = {
  activeScenario: 'logistics',
  scenarioJobTypes: [],
  useScenarioJobTypes: true,
  useScenarioRevenue: false,
  useScenarioMetrics: true,
  currency: { symbol: '£', code: 'GBP', position: 'before' },
  countryCode: 'GB',
  cityId: 'london',
  distanceUnit: 'km',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  defaultCenter: { lat: 51.5074, lng: -0.1278 },
  defaultZoom: 11,
  serviceRadius: 40,
  defaultVehicles: 12,
  defaultShiftHours: 8,
  workingHoursStart: '08:00',
  workingHoursEnd: '18:00',
  vehicleLabelType: 'license_plate',
  dispatcherHourlyRate: 25,
} as AppConfig;

const belronConfig: AppConfig = {
  ...baseConfig,
  activeScenario: 'belron',
  scenarioJobTypes: [
    {
      id: 'replacement',
      label: 'Windshield Replacement',
      duration: 90,
      revenue: 350,
      defaultPercentage: 50,
      color: '#F59E0B',
    },
    {
      id: 'chip_repair',
      label: 'Chip Repair',
      duration: 45,
      revenue: 85,
      defaultPercentage: 25,
      color: '#10B981',
    },
  ],
} as AppConfig;

// ToggleField buttons use the 'rounded-full' class; the Section header and Select trigger do not.
function getToggleButtons() {
  return screen.getAllByRole('button').filter((b) => b.classList.contains('rounded-full'));
}

describe('ScenarioPresets', () => {
  it('renders section title', () => {
    render(
      <ScenarioPresets
        config={baseConfig}
        onScenarioChange={vi.fn()}
        onUseJobTypesChange={vi.fn()}
        onUseRevenueChange={vi.fn()}
        onUseMetricsChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Scenario Presets')).toBeInTheDocument();
  });

  it('shows the currently active scenario in the select trigger button', () => {
    render(
      <ScenarioPresets
        config={baseConfig}
        onScenarioChange={vi.fn()}
        onUseJobTypesChange={vi.fn()}
        onUseRevenueChange={vi.fn()}
        onUseMetricsChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /last-mile logistics/i })).toBeInTheDocument();
  });

  it('calls onScenarioChange when a scenario is selected', async () => {
    const onScenarioChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ScenarioPresets
        config={baseConfig}
        onScenarioChange={onScenarioChange}
        onUseJobTypesChange={vi.fn()}
        onUseRevenueChange={vi.fn()}
        onUseMetricsChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /last-mile logistics/i }));
    await user.click(screen.getByRole('button', { name: /belron field service/i }));
    expect(onScenarioChange).toHaveBeenCalledWith('belron');
  });

  it('renders three toggle field labels', () => {
    render(
      <ScenarioPresets
        config={baseConfig}
        onScenarioChange={vi.fn()}
        onUseJobTypesChange={vi.fn()}
        onUseRevenueChange={vi.fn()}
        onUseMetricsChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Use Scenario Job Types')).toBeInTheDocument();
    expect(screen.getByText('Use Scenario Revenue Values')).toBeInTheDocument();
    expect(screen.getByText('Use Scenario Business Metrics')).toBeInTheDocument();
  });

  it('calls onUseJobTypesChange when the job types toggle is clicked', async () => {
    const onUseJobTypesChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ScenarioPresets
        config={baseConfig}
        onScenarioChange={vi.fn()}
        onUseJobTypesChange={onUseJobTypesChange}
        onUseRevenueChange={vi.fn()}
        onUseMetricsChange={vi.fn()}
      />,
    );
    // useScenarioJobTypes=true → clicking calls onChange(false)
    await user.click(getToggleButtons()[0]);
    expect(onUseJobTypesChange).toHaveBeenCalledWith(false);
  });

  it('calls onUseRevenueChange when the revenue toggle is clicked', async () => {
    const onUseRevenueChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ScenarioPresets
        config={baseConfig}
        onScenarioChange={vi.fn()}
        onUseJobTypesChange={vi.fn()}
        onUseRevenueChange={onUseRevenueChange}
        onUseMetricsChange={vi.fn()}
      />,
    );
    // useScenarioRevenue=false → clicking calls onChange(true)
    await user.click(getToggleButtons()[1]);
    expect(onUseRevenueChange).toHaveBeenCalledWith(true);
  });

  it('calls onUseMetricsChange when the metrics toggle is clicked', async () => {
    const onUseMetricsChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ScenarioPresets
        config={baseConfig}
        onScenarioChange={vi.fn()}
        onUseJobTypesChange={vi.fn()}
        onUseRevenueChange={vi.fn()}
        onUseMetricsChange={onUseMetricsChange}
      />,
    );
    // useScenarioMetrics=true → clicking calls onChange(false)
    await user.click(getToggleButtons()[2]);
    expect(onUseMetricsChange).toHaveBeenCalledWith(false);
  });

  it('shows Belron job types panel when active scenario is "belron"', () => {
    render(
      <ScenarioPresets
        config={belronConfig}
        onScenarioChange={vi.fn()}
        onUseJobTypesChange={vi.fn()}
        onUseRevenueChange={vi.fn()}
        onUseMetricsChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Belron Job Types')).toBeInTheDocument();
    expect(screen.getByText('Windshield Replacement')).toBeInTheDocument();
    expect(screen.getByText('Chip Repair')).toBeInTheDocument();
  });

  it('does not show Belron job types panel for non-belron scenarios', () => {
    render(
      <ScenarioPresets
        config={baseConfig}
        onScenarioChange={vi.fn()}
        onUseJobTypesChange={vi.fn()}
        onUseRevenueChange={vi.fn()}
        onUseMetricsChange={vi.fn()}
      />,
    );
    expect(screen.queryByText('Belron Job Types')).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BusinessDefaults } from '@/components';
import type { AppConfig } from '@/store';

const config = {
  defaultVehicles: 12,
  defaultShiftHours: 8,
  workingHoursStart: '08:00',
  workingHoursEnd: '18:00',
  vehicleLabelType: 'license_plate',
} as AppConfig;

describe('BusinessDefaults', () => {
  it('renders section title', () => {
    render(
      <BusinessDefaults
        config={config}
        licensePlateExample="AB12 CDE"
        onVehiclesChange={vi.fn()}
        onShiftHoursChange={vi.fn()}
        onWorkingHoursChange={vi.fn()}
        onVehicleLabelTypeChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Business Defaults')).toBeInTheDocument();
  });

  it('renders default vehicles and shift duration inputs with current values', () => {
    render(
      <BusinessDefaults
        config={config}
        licensePlateExample="AB12 CDE"
        onVehiclesChange={vi.fn()}
        onShiftHoursChange={vi.fn()}
        onWorkingHoursChange={vi.fn()}
        onVehicleLabelTypeChange={vi.fn()}
      />,
    );
    const inputs = screen.getAllByRole('spinbutton');

    expect(inputs[0]).toHaveValue(12); // vehicles
    expect(inputs[1]).toHaveValue(8); // shift hours
  });

  it('calls onVehiclesChange when vehicle count is changed', () => {
    const onVehiclesChange = vi.fn();

    render(
      <BusinessDefaults
        config={config}
        licensePlateExample="AB12 CDE"
        onVehiclesChange={onVehiclesChange}
        onShiftHoursChange={vi.fn()}
        onWorkingHoursChange={vi.fn()}
        onVehicleLabelTypeChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '8' } });
    expect(onVehiclesChange).toHaveBeenCalledWith(8);
  });

  it('calls onShiftHoursChange when shift duration is changed', () => {
    const onShiftHoursChange = vi.fn();

    render(
      <BusinessDefaults
        config={config}
        licensePlateExample="AB12 CDE"
        onVehiclesChange={vi.fn()}
        onShiftHoursChange={onShiftHoursChange}
        onWorkingHoursChange={vi.fn()}
        onVehicleLabelTypeChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '10' } });
    expect(onShiftHoursChange).toHaveBeenCalledWith(10);
  });

  it('renders working hours start and end time inputs', () => {
    render(
      <BusinessDefaults
        config={config}
        licensePlateExample="AB12 CDE"
        onVehiclesChange={vi.fn()}
        onShiftHoursChange={vi.fn()}
        onWorkingHoursChange={vi.fn()}
        onVehicleLabelTypeChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Working Hours Start')).toBeInTheDocument();
    expect(screen.getByText('Working Hours End')).toBeInTheDocument();
  });

  it('calls onWorkingHoursChange(newStart, currentEnd) when start time changes', () => {
    const onWorkingHoursChange = vi.fn();

    render(
      <BusinessDefaults
        config={config}
        licensePlateExample="AB12 CDE"
        onVehiclesChange={vi.fn()}
        onShiftHoursChange={vi.fn()}
        onWorkingHoursChange={onWorkingHoursChange}
        onVehicleLabelTypeChange={vi.fn()}
      />,
    );
    const [startInput] = screen.getAllByDisplayValue(/^\d{2}:\d{2}$/);

    fireEvent.change(startInput, { target: { value: '09:00' } });
    expect(onWorkingHoursChange).toHaveBeenCalledWith('09:00', config.workingHoursEnd);
  });

  it('calls onWorkingHoursChange(currentStart, newEnd) when end time changes', () => {
    const onWorkingHoursChange = vi.fn();

    render(
      <BusinessDefaults
        config={config}
        licensePlateExample="AB12 CDE"
        onVehiclesChange={vi.fn()}
        onShiftHoursChange={vi.fn()}
        onWorkingHoursChange={onWorkingHoursChange}
        onVehicleLabelTypeChange={vi.fn()}
      />,
    );
    const timeInputs = screen.getAllByDisplayValue(/^\d{2}:\d{2}$/);

    fireEvent.change(timeInputs[1], { target: { value: '17:00' } });
    expect(onWorkingHoursChange).toHaveBeenCalledWith(config.workingHoursStart, '17:00');
  });

  it('renders vehicle label radio group with license plate example', () => {
    render(
      <BusinessDefaults
        config={config}
        licensePlateExample="AB12 CDE"
        onVehiclesChange={vi.fn()}
        onShiftHoursChange={vi.fn()}
        onWorkingHoursChange={vi.fn()}
        onVehicleLabelTypeChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Vehicle Labels')).toBeInTheDocument();
    expect(screen.getByText(/AB12 CDE/)).toBeInTheDocument();
  });

  it('calls onVehicleLabelTypeChange when a radio option is clicked', async () => {
    const onVehicleLabelTypeChange = vi.fn();
    const user = userEvent.setup();

    render(
      <BusinessDefaults
        config={config}
        licensePlateExample="AB12 CDE"
        onVehiclesChange={vi.fn()}
        onShiftHoursChange={vi.fn()}
        onWorkingHoursChange={vi.fn()}
        onVehicleLabelTypeChange={onVehicleLabelTypeChange}
      />,
    );
    await user.click(screen.getByText(/Generic/i));
    expect(onVehicleLabelTypeChange).toHaveBeenCalledWith('generic');
  });
});

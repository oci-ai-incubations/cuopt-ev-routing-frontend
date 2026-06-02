import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MapDefaults } from '@/components';
import type { AppConfig } from '@/store';

const config = {
  defaultCenter: { lat: 51.5074, lng: -0.1278 },
  defaultZoom: 11,
  serviceRadius: 40,
} as AppConfig;

describe('MapDefaults', () => {
  it('renders section title', () => {
    render(
      <MapDefaults
        config={config}
        onCenterChange={vi.fn()}
        onZoomChange={vi.fn()}
        onRadiusChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Map Defaults')).toBeInTheDocument();
  });

  it('shows current latitude and longitude values', () => {
    render(
      <MapDefaults
        config={config}
        onCenterChange={vi.fn()}
        onZoomChange={vi.fn()}
        onRadiusChange={vi.fn()}
      />,
    );
    const inputs = screen.getAllByRole('spinbutton');

    expect(inputs[0]).toHaveValue(51.5074);
    expect(inputs[1]).toHaveValue(-0.1278);
  });

  it('calls onCenterChange(newLat, currentLng) when latitude changes', () => {
    const onCenterChange = vi.fn();

    render(
      <MapDefaults
        config={config}
        onCenterChange={onCenterChange}
        onZoomChange={vi.fn()}
        onRadiusChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '52' } });
    expect(onCenterChange).toHaveBeenCalledWith(52, config.defaultCenter.lng);
  });

  it('calls onCenterChange(currentLat, newLng) when longitude changes', () => {
    const onCenterChange = vi.fn();

    render(
      <MapDefaults
        config={config}
        onCenterChange={onCenterChange}
        onZoomChange={vi.fn()}
        onRadiusChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '2' } });
    expect(onCenterChange).toHaveBeenCalledWith(config.defaultCenter.lat, 2);
  });

  it('calls onZoomChange when zoom level changes', () => {
    const onZoomChange = vi.fn();

    render(
      <MapDefaults
        config={config}
        onCenterChange={vi.fn()}
        onZoomChange={onZoomChange}
        onRadiusChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getAllByRole('spinbutton')[2], { target: { value: '13' } });
    expect(onZoomChange).toHaveBeenCalledWith(13);
  });

  it('calls onRadiusChange when service radius changes', () => {
    const onRadiusChange = vi.fn();

    render(
      <MapDefaults
        config={config}
        onCenterChange={vi.fn()}
        onZoomChange={vi.fn()}
        onRadiusChange={onRadiusChange}
      />,
    );
    fireEvent.change(screen.getAllByRole('spinbutton')[3], { target: { value: '60' } });
    expect(onRadiusChange).toHaveBeenCalledWith(60);
  });

  it('renders "km" unit label for service radius', () => {
    render(
      <MapDefaults
        config={config}
        onCenterChange={vi.fn()}
        onZoomChange={vi.fn()}
        onRadiusChange={vi.fn()}
      />,
    );
    expect(screen.getByText('km')).toBeInTheDocument();
  });

  it('renders hint labels for all four fields', () => {
    render(
      <MapDefaults
        config={config}
        onCenterChange={vi.fn()}
        onZoomChange={vi.fn()}
        onRadiusChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Center point latitude')).toBeInTheDocument();
    expect(screen.getByText('Center point longitude')).toBeInTheDocument();
    expect(screen.getByText('Map zoom level (1-20)')).toBeInTheDocument();
    expect(screen.getByText('Default service area radius')).toBeInTheDocument();
  });
});

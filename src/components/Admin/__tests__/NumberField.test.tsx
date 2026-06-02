import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NumberField } from '@/components';

describe('NumberField', () => {
  it('renders label and input with current value', () => {
    render(<NumberField label="Vehicles" value={5} onChange={vi.fn()} />);
    expect(screen.getByText('Vehicles')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(5);
  });

  it('calls onChange with parsed number on input change', () => {
    const onChange = vi.fn();

    render(<NumberField label="Count" value={3} onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '10' } });
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('renders hint text when provided', () => {
    render(<NumberField label="Zoom" value={11} onChange={vi.fn()} hint="Map zoom level (1-20)" />);
    expect(screen.getByText('Map zoom level (1-20)')).toBeInTheDocument();
  });

  it('does not render hint when omitted', () => {
    render(<NumberField label="Zoom" value={11} onChange={vi.fn()} />);
    expect(screen.queryByText(/zoom level/i)).not.toBeInTheDocument();
  });

  it('renders unit label when provided', () => {
    render(<NumberField label="Radius" value={40} onChange={vi.fn()} unit="km" />);
    expect(screen.getByText('km')).toBeInTheDocument();
  });

  it('does not render unit when omitted', () => {
    render(<NumberField label="Count" value={5} onChange={vi.fn()} />);
    expect(screen.queryByText('km')).not.toBeInTheDocument();
  });

  it('forwards min, max, and step to the input element', () => {
    render(
      <NumberField label="Duration" value={4} onChange={vi.fn()} min={1} max={100} step={0.5} />,
    );
    const input = screen.getByRole('spinbutton');

    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '100');
    expect(input).toHaveAttribute('step', '0.5');
  });

  it('calls onChange(0) when input is cleared (Number("") === 0)', () => {
    const onChange = vi.fn();

    render(<NumberField label="Count" value={5} onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(0);
  });
});

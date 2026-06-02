import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ToggleField } from '@/components';

describe('ToggleField', () => {
  it('renders the label', () => {
    render(<ToggleField label="Use Job Types" checked={false} onChange={vi.fn()} />);
    expect(screen.getByText('Use Job Types')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <ToggleField
        label="Feature"
        description="Enables the feature"
        checked={false}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Enables the feature')).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    render(<ToggleField label="Feature" checked={false} onChange={vi.fn()} />);
    expect(screen.queryByText(/enables/i)).not.toBeInTheDocument();
  });

  it('calls onChange(true) when unchecked toggle is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ToggleField label="Feature" checked={false} onChange={onChange} />);
    await user.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange(false) when checked toggle is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ToggleField label="Feature" checked onChange={onChange} />);
    await user.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('applies active colour class when checked', () => {
    const { rerender } = render(<ToggleField label="F" checked onChange={vi.fn()} />);

    expect(screen.getByRole('button').className).toMatch(/oracle-red/);

    rerender(<ToggleField label="F" checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole('button').className).not.toMatch(/oracle-red/);
  });
});

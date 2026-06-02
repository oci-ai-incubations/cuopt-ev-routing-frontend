import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SelectField } from '@/components';

const options = [
  { value: 'gb', label: '🇬🇧 United Kingdom' },
  { value: 'us', label: '🇺🇸 United States' },
  { value: 'de', label: '🇩🇪 Germany' },
];

describe('SelectField', () => {
  it('renders the label', () => {
    render(<SelectField label="Country" value="gb" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Country')).toBeInTheDocument();
  });

  it('shows the currently selected option in the trigger button', () => {
    render(<SelectField label="Country" value="us" onChange={vi.fn()} options={options} />);
    // The trigger is a button that displays the current option label
    expect(screen.getByRole('button', { name: /united states/i })).toBeInTheDocument();
  });

  it('opens dropdown and calls onChange when an option is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<SelectField label="Country" value="gb" onChange={onChange} options={options} />);
    // Open the dropdown
    await user.click(screen.getByRole('button', { name: /united kingdom/i }));
    // Pick an option from the open dropdown
    await user.click(screen.getByRole('button', { name: /united states/i }));
    expect(onChange).toHaveBeenCalledWith('us');
  });

  it('renders hint when provided', () => {
    render(
      <SelectField
        label="Country"
        value="gb"
        onChange={vi.fn()}
        options={options}
        hint="Select your operating region"
      />,
    );
    expect(screen.getByText('Select your operating region')).toBeInTheDocument();
  });

  it('does not render hint when omitted', () => {
    render(<SelectField label="Country" value="gb" onChange={vi.fn()} options={options} />);
    expect(screen.queryByText(/select your/i)).not.toBeInTheDocument();
  });

  it('prefixes icon to option label when option has icon property', () => {
    const iconOptions = [{ value: 'gb', label: 'United Kingdom', icon: '🇬🇧' }];

    render(<SelectField label="Country" value="gb" onChange={vi.fn()} options={iconOptions} />);
    // The trigger should show "🇬🇧 United Kingdom"
    expect(screen.getByRole('button', { name: /🇬🇧 United Kingdom/i })).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RadioGroup } from '@/components';

const options = [
  { value: 'km', label: 'Kilometers' },
  { value: 'miles', label: 'Miles' },
];

describe('RadioGroup', () => {
  it('renders the group label and all option labels', () => {
    render(<RadioGroup label="Distance Units" value="km" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Distance Units')).toBeInTheDocument();
    expect(screen.getByText('Kilometers')).toBeInTheDocument();
    expect(screen.getByText('Miles')).toBeInTheDocument();
  });

  it('calls onChange with the option value when an option is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<RadioGroup label="Distance Units" value="km" onChange={onChange} options={options} />);
    await user.click(screen.getByText('Miles'));
    expect(onChange).toHaveBeenCalledWith('miles');
  });

  it('renders the selection indicator only for the current value', () => {
    const { rerender } = render(
      <RadioGroup label="Units" value="km" onChange={vi.fn()} options={options} />,
    );
    // The selected button has a filled inner circle (rendered as a div); unselected does not
    const buttons = screen.getAllByRole('button');
    const kmButton = buttons.find((b) => b.textContent?.includes('Kilometers'));
    const milesButton = buttons.find((b) => b.textContent?.includes('Miles'));

    expect(kmButton).toBeDefined();
    expect(milesButton).toBeDefined();

    expect(kmButton?.className).toMatch(/oracle-red/);
    expect(milesButton?.className).not.toMatch(/oracle-red/);

    rerender(<RadioGroup label="Units" value="miles" onChange={vi.fn()} options={options} />);
    const buttonsAfter = screen.getAllByRole('button');
    const kmButtonAfter = buttonsAfter.find((b) => b.textContent?.includes('Kilometers'));
    const milesButtonAfter = buttonsAfter.find((b) => b.textContent?.includes('Miles'));

    expect(milesButtonAfter?.className).toMatch(/oracle-red/);
    expect(kmButtonAfter?.className).not.toMatch(/oracle-red/);
  });

  it('renders all options from the options array', () => {
    const threeOptions = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
      { value: 'c', label: 'Gamma' },
    ];

    render(<RadioGroup label="Group" value="a" onChange={vi.fn()} options={threeOptions} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });
});

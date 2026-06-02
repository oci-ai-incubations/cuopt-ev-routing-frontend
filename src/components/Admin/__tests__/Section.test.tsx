import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Section } from '@/components';

describe('Section', () => {
  it('renders title and icon', () => {
    render(
      <Section title="Map Defaults" icon={<span data-testid="icon" />}>
        <div>child content</div>
      </Section>,
    );
    expect(screen.getByText('Map Defaults')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('shows children when expanded by default', () => {
    render(
      <Section title="Section" icon={<span />}>
        <div>visible content</div>
      </Section>,
    );
    expect(screen.getByText('visible content')).toBeInTheDocument();
  });

  it('hides children when defaultExpanded is false', () => {
    render(
      <Section title="Section" icon={<span />} defaultExpanded={false}>
        <div>hidden content</div>
      </Section>,
    );
    expect(screen.queryByText('hidden content')).not.toBeInTheDocument();
  });

  it('toggles children visibility when header button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Section title="Toggle Me" icon={<span />}>
        <div>toggle content</div>
      </Section>,
    );
    expect(screen.getByText('toggle content')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(screen.queryByText('toggle content')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('toggle content')).toBeInTheDocument();
  });

  it('expands from collapsed state on click', async () => {
    const user = userEvent.setup();

    render(
      <Section title="Collapsed" icon={<span />} defaultExpanded={false}>
        <div>now visible</div>
      </Section>,
    );
    expect(screen.queryByText('now visible')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('now visible')).toBeInTheDocument();
  });
});

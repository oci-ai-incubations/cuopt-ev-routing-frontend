import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from '../components/Header';

describe('Header', () => {
  it('renders the title', () => {
    render(<Header title="Test App" />);
    expect(screen.getByText('Test App')).toBeInTheDocument();
  });

  it('renders the subtitle when provided', () => {
    render(<Header title="Test App" subtitle="OCI AI Accelerator" />);
    expect(screen.getByText('OCI AI Accelerator')).toBeInTheDocument();
  });

  it('renders the Oracle logo', () => {
    render(<Header title="Test App" />);
    const logo = screen.getByAltText('Oracle Logo');
    expect(logo).toBeInTheDocument();
    expect(logo.tagName).toBe('IMG');
  });
});

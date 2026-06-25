import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EcoSphere from '../EcoSphere';

describe('EcoSphere', () => {
  it('renders correctly with default values', () => {
    render(<EcoSphere />);
    expect(screen.getByText('My EcoSphere')).toBeInTheDocument();
    expect(screen.getByText('Thriving EcoSphere')).toBeInTheDocument();
  });

  it('calculates 100% health for footprints below the target threshold', () => {
    render(<EcoSphere netFootprint={1500} baselineFootprint={8000} />);
    expect(screen.getByText('100% Health')).toBeInTheDocument();
    expect(screen.getByText('Thriving EcoSphere')).toBeInTheDocument();
  });

  it('calculates 0% health for footprints exceeding the baseline threshold', () => {
    render(<EcoSphere netFootprint={10000} baselineFootprint={8000} />);
    // When baseline is 8000, Math.max(12000, 8000) makes the threshold 12000
    // Let's test with footprint at or above 12000
    render(<EcoSphere netFootprint={13000} baselineFootprint={8000} />);
    expect(screen.getByText('0% Health')).toBeInTheDocument();
    expect(screen.getByText('Critical EcoSphere')).toBeInTheDocument();
  });

  it('calculates intermediate health and maps to correct status label', () => {
    // Range is minTarget(2000) to maxThreshold(12000) = 10000 range.
    // Net footprint of 7000 is exactly in the middle (50% health)
    render(<EcoSphere netFootprint={7000} baselineFootprint={8000} />);
    expect(screen.getByText('50% Health')).toBeInTheDocument();
    expect(screen.getByText('Balanced EcoSphere')).toBeInTheDocument();
  });

  it('renders Degraded status for health between 15% and 40%', () => {
    // 2000 + 70% of 10000 = 9000 (gives 30% health)
    render(<EcoSphere netFootprint={9000} baselineFootprint={8000} />);
    expect(screen.getByText('30% Health')).toBeInTheDocument();
    expect(screen.getByText('Degraded EcoSphere')).toBeInTheDocument();
  });
});

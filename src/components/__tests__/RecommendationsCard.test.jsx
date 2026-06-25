/**
 * Component Tests for RecommendationsCard
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecommendationsCard from '../RecommendationsCard';

describe('RecommendationsCard', () => {
  it('renders the card title "Personalized Reduction Plan"', () => {
    render(<RecommendationsCard recommendations={[]} onOpenCalculator={vi.fn()} />);
    expect(screen.getByText('Personalized Reduction Plan')).toBeInTheDocument();
  });

  it('shows prompt when no recommendations are provided', () => {
    render(<RecommendationsCard recommendations={[]} onOpenCalculator={vi.fn()} />);
    expect(screen.getByText(/We need your profile details/)).toBeInTheDocument();
    expect(screen.getByText('Start Estimation')).toBeInTheDocument();
  });

  it('"Start Estimation" button calls onOpenCalculator', async () => {
    const mockOpen = vi.fn();
    const user = userEvent.setup();
    render(<RecommendationsCard recommendations={[]} onOpenCalculator={mockOpen} />);
    
    await user.click(screen.getByText('Start Estimation'));
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  it('renders recommendation items when provided', () => {
    const recs = [
      { id: 'rec_1', category: 'transport', impact: 'High', title: 'Switch to EV', text: 'Reduce commute emissions', savings: 1500 },
      { id: 'rec_2', category: 'energy', impact: 'Medium', title: 'Green Energy', text: 'Use renewable tariff', savings: 800 }
    ];
    render(<RecommendationsCard recommendations={recs} onOpenCalculator={vi.fn()} />);
    
    expect(screen.getByText('Switch to EV')).toBeInTheDocument();
    expect(screen.getByText('Green Energy')).toBeInTheDocument();
  });

  it('displays impact badges correctly', () => {
    const recs = [
      { id: 'rec_1', category: 'transport', impact: 'High', title: 'Test', text: 'Test', savings: 500 }
    ];
    render(<RecommendationsCard recommendations={recs} onOpenCalculator={vi.fn()} />);
    expect(screen.getByText('High Impact')).toBeInTheDocument();
  });

  it('displays savings values', () => {
    const recs = [
      { id: 'rec_1', category: 'transport', impact: 'High', title: 'Test', text: 'Test', savings: 1500 }
    ];
    render(<RecommendationsCard recommendations={recs} onOpenCalculator={vi.fn()} />);
    expect(screen.getByText('-1,500 kg CO₂/yr')).toBeInTheDocument();
  });

  it('shows info footer when recommendations exist', () => {
    const recs = [
      { id: 'rec_1', category: 'transport', impact: 'High', title: 'Test', text: 'Test', savings: 100 }
    ];
    render(<RecommendationsCard recommendations={recs} onOpenCalculator={vi.fn()} />);
    expect(screen.getByText(/Recommendations are prioritized/)).toBeInTheDocument();
  });

  it('does not show info footer when no recommendations', () => {
    render(<RecommendationsCard recommendations={[]} onOpenCalculator={vi.fn()} />);
    expect(screen.queryByText(/Recommendations are prioritized/)).not.toBeInTheDocument();
  });
});

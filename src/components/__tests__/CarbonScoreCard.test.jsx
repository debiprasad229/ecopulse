/**
 * Component Tests for CarbonScoreCard
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CarbonScoreCard from '../CarbonScoreCard';

describe('CarbonScoreCard', () => {
  const defaultProps = {
    netFootprint: 5000,
    baseline: 8000,
    xp: 150,
    completedHabits: {},
    history: [],
    onClearHistory: vi.fn(),
    challengeStats: {}
  };

  it('renders the card title "Carbon Scoreboard"', () => {
    render(<CarbonScoreCard {...defaultProps} />);
    expect(screen.getByText('Carbon Scoreboard')).toBeInTheDocument();
  });

  it('displays net footprint value', () => {
    render(<CarbonScoreCard {...defaultProps} />);
    expect(screen.getByText('5,000')).toBeInTheDocument();
  });

  it('displays footprint in metric tons', () => {
    render(<CarbonScoreCard {...defaultProps} />);
    expect(screen.getByText(/5\.0 metric tons/)).toBeInTheDocument();
  });

  it('shows reduction badge when footprint is below baseline', () => {
    render(<CarbonScoreCard {...defaultProps} netFootprint={4000} baseline={8000} />);
    expect(screen.getByText(/50% Reduction/)).toBeInTheDocument();
  });

  it('shows "Steady at Baseline" when footprint equals baseline', () => {
    render(<CarbonScoreCard {...defaultProps} netFootprint={8000} baseline={8000} />);
    expect(screen.getByText(/Steady at Baseline/)).toBeInTheDocument();
  });

  it('shows increase badge when footprint exceeds baseline', () => {
    render(<CarbonScoreCard {...defaultProps} netFootprint={9000} baseline={8000} />);
    expect(screen.getByText(/Increase/)).toBeInTheDocument();
  });

  it('shows "Under the 2,000 kg" message when target achieved', () => {
    render(<CarbonScoreCard {...defaultProps} netFootprint={1500} />);
    expect(screen.getByText(/Under the 2,000 kg/i)).toBeInTheDocument();
  });

  it('shows reduction needed when above target', () => {
    render(<CarbonScoreCard {...defaultProps} netFootprint={5000} />);
    expect(screen.getByText(/Needs to reduce by/)).toBeInTheDocument();
    expect(screen.getByText(/3,000 kg/)).toBeInTheDocument();
  });

  it('displays XP points', () => {
    render(<CarbonScoreCard {...defaultProps} xp={150} />);
    expect(screen.getByText('150 XP')).toBeInTheDocument();
  });

  it('displays badge count text', () => {
    render(<CarbonScoreCard {...defaultProps} xp={150} />);
    // At 150 XP: Eco Seedling (always) + Eco Guardian (100xp) = 2 badges
    expect(screen.getByText(/2 Active achievements/)).toBeInTheDocument();
  });

  it('renders history entries when history has multiple items', () => {
    const history = [
      { timestamp: 'Jun 15, 10:00 AM', footprint: 5000 },
      { timestamp: 'Jun 14, 09:00 AM', footprint: 6000 }
    ];
    render(<CarbonScoreCard {...defaultProps} history={history} />);
    expect(screen.getByText('Calculation History')).toBeInTheDocument();
    expect(screen.getByText('Jun 15, 10:00 AM')).toBeInTheDocument();
  });

  it('Clear History button calls onClearHistory', async () => {
    const mockClear = vi.fn();
    const history = [
      { timestamp: 'Jun 15', footprint: 5000 },
      { timestamp: 'Jun 14', footprint: 6000 }
    ];
    const user = userEvent.setup();
    render(<CarbonScoreCard {...defaultProps} history={history} onClearHistory={mockClear} />);
    
    await user.click(screen.getByText('Clear History'));
    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  it('does not show history section with only one entry', () => {
    const history = [{ timestamp: 'Jun 15', footprint: 5000 }];
    render(<CarbonScoreCard {...defaultProps} history={history} />);
    expect(screen.queryByText('Calculation History')).not.toBeInTheDocument();
  });
});

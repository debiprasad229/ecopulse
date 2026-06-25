import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CarbonPersonalityCard from '../CarbonPersonalityCard';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
  __esModule: true
}));

describe('CarbonPersonalityCard', () => {
  const mockPersonality = {
    key: 'minimalist',
    name: 'Minimalist Eco-Warrior',
    badgeClass: 'badge-minimalist',
    sustainabilityScore: 85,
    description: 'You tread lightly on the Earth with low consumption and high awareness.',
    strengths: ['Low electricity consumption', 'Efficient diet choice'],
    weaknesses: ['Slightly high transport emissions'],
    opportunities: ['Offset transport emissions', 'Unplug idle electronics'],
    challenge: {
      text: 'Switch to a green energy tariff or plant a tree this month.',
      xpReward: 50
    }
  };

  const defaultProps = {
    personality: mockPersonality,
    setXp: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders nothing when personality prop is null', () => {
    const { container } = render(<CarbonPersonalityCard personality={null} setXp={defaultProps.setXp} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders basic details of the personality card', () => {
    render(<CarbonPersonalityCard {...defaultProps} />);
    expect(screen.getByText('Carbon Personality Profile')).toBeInTheDocument();
    expect(screen.getByText('Minimalist Eco-Warrior')).toBeInTheDocument();
    expect(screen.getByText(mockPersonality.description)).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders strengths, weaknesses, and opportunities lists', () => {
    render(<CarbonPersonalityCard {...defaultProps} />);
    expect(screen.getByText('Low electricity consumption')).toBeInTheDocument();
    expect(screen.getByText('Slightly high transport emissions')).toBeInTheDocument();
    expect(screen.getByText('Offset transport emissions')).toBeInTheDocument();
  });

  it('renders different sustainability scores with correct colors', () => {
    const { rerender } = render(<CarbonPersonalityCard {...defaultProps} />);
    
    // 85% score - Green
    expect(screen.getByText('85%')).toHaveStyle({ color: 'var(--accent-green)' });

    // 60% score - Blue
    rerender(<CarbonPersonalityCard {...defaultProps} personality={{ ...mockPersonality, sustainabilityScore: 60 }} />);
    expect(screen.getByText('60%')).toHaveStyle({ color: 'var(--accent-blue)' });

    // 40% score - Orange
    rerender(<CarbonPersonalityCard {...defaultProps} personality={{ ...mockPersonality, sustainabilityScore: 40 }} />);
    expect(screen.getByText('40%')).toHaveStyle({ color: 'var(--accent-orange)' });

    // 20% score - Red
    rerender(<CarbonPersonalityCard {...defaultProps} personality={{ ...mockPersonality, sustainabilityScore: 20 }} />);
    expect(screen.getByText('20%')).toHaveStyle({ color: 'var(--danger)' });
  });

  it('allows claiming the challenge and awards XP', async () => {
    const user = userEvent.setup();
    render(<CarbonPersonalityCard {...defaultProps} />);
    
    const claimBtn = screen.getByRole('button', { name: /Complete Challenge/i });
    expect(claimBtn).not.toBeDisabled();
    
    await user.click(claimBtn);
    
    expect(defaultProps.setXp).toHaveBeenCalledTimes(1);
    expect(claimBtn).toHaveTextContent('✓ Challenge Completed');
    expect(claimBtn).toBeDisabled();
    
    // Verify persistence
    expect(localStorage.getItem(`ecopulse_claimed_challenge_${mockPersonality.key}`)).toBe('true');
  });

  it('loads claimed state from localStorage', () => {
    localStorage.setItem(`ecopulse_claimed_challenge_${mockPersonality.key}`, 'true');
    render(<CarbonPersonalityCard {...defaultProps} />);
    
    const claimBtn = screen.getByRole('button', { name: /Challenge Completed/i });
    expect(claimBtn).toBeDisabled();
  });
});

/**
 * Component Tests for HabitTrackerCard
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HabitTrackerCard from '../HabitTrackerCard';

describe('HabitTrackerCard', () => {
  const defaultProps = {
    setXp: vi.fn(),
    completedHabits: {},
    setCompletedHabits: vi.fn(),
    habitSavings: 0,
    setHabitSavings: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the card title "Daily Green Actions"', () => {
    render(<HabitTrackerCard {...defaultProps} />);
    expect(screen.getByText('Daily Green Actions')).toBeInTheDocument();
  });

  it('renders all 5 habits', () => {
    render(<HabitTrackerCard {...defaultProps} />);
    expect(screen.getByText('Commute Green')).toBeInTheDocument();
    expect(screen.getByText('Plant-Based Day')).toBeInTheDocument();
    expect(screen.getByText('Phantom Power Sweep')).toBeInTheDocument();
    expect(screen.getByText('Air-Dry Laundry')).toBeInTheDocument();
    expect(screen.getByText('Cold Quick Shower')).toBeInTheDocument();
  });

  it('each habit has a checkbox with proper aria-label', () => {
    render(<HabitTrackerCard {...defaultProps} />);
    expect(screen.getByLabelText(/Mark habit "Commute Green" as completed/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mark habit "Plant-Based Day" as completed/)).toBeInTheDocument();
  });

  it('checking a habit calls setXp and setCompletedHabits', async () => {
    const user = userEvent.setup();
    render(<HabitTrackerCard {...defaultProps} />);
    
    const checkbox = screen.getByLabelText(/Mark habit "Commute Green" as completed/);
    await user.click(checkbox);
    
    expect(defaultProps.setXp).toHaveBeenCalledTimes(1);
    expect(defaultProps.setCompletedHabits).toHaveBeenCalledTimes(1);
    expect(defaultProps.setHabitSavings).toHaveBeenCalledTimes(1);
  });

  it('displays XP reward for each habit', () => {
    render(<HabitTrackerCard {...defaultProps} />);
    expect(screen.getByText('+25 XP')).toBeInTheDocument(); // Commute Green
    expect(screen.getByText('+30 XP')).toBeInTheDocument(); // Plant-Based Day
  });

  it('displays session habit reduction total', () => {
    render(<HabitTrackerCard {...defaultProps} habitSavings={520} />);
    expect(screen.getByText(/-520 kg CO₂e\/yr/)).toBeInTheDocument();
  });

  it('shows habit as completed when in completedHabits', () => {
    const { container } = render(
      <HabitTrackerCard {...defaultProps} completedHabits={{ commute_green: 1 }} />
    );
    const completedItem = container.querySelector('.habit-item.completed');
    expect(completedItem).toBeInTheDocument();
  });

  it('does not trigger confetti when reduced-motion is active', async () => {
    const confetti = (await import('canvas-confetti')).default;
    confetti.mockClear();
    document.body.classList.add('reduced-motion');
    
    const user = userEvent.setup();
    render(<HabitTrackerCard {...defaultProps} />);
    
    const checkbox = screen.getByLabelText(/Mark habit "Commute Green" as completed/);
    await user.click(checkbox);
    
    expect(confetti).not.toHaveBeenCalled();
    document.body.classList.remove('reduced-motion');
  });
});

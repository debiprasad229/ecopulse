/**
 * Component Tests for OnboardingWizard
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingWizard from '../OnboardingWizard';

describe('OnboardingWizard', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
  });

  it('renders the wizard dialog', () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Calculate Your Baseline')).toBeInTheDocument();
  });

  it('starts on Step 1 of 4', () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('renders transport step with commute distance input', () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    expect(screen.getByText('How do you commute?')).toBeInTheDocument();
    expect(screen.getByLabelText(/Weekly Commute Distance/)).toBeInTheDocument();
  });

  it('renders transport type radio buttons with proper ARIA roles', () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    const radiogroup = screen.getByRole('radiogroup', { name: /Primary Mode of Transport/ });
    expect(radiogroup).toBeInTheDocument();
    const radios = within(radiogroup).getAllByRole('radio');
    expect(radios.length).toBe(5);
  });

  it('back button is disabled on first step', () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    const backBtn = screen.getByText(/Back/i).closest('button');
    expect(backBtn).toBeDisabled();
  });

  it('navigates to step 2 when Continue is clicked', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    await user.click(screen.getByText(/Continue/i));
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    expect(screen.getByText('Do you fly?')).toBeInTheDocument();
  });

  it('navigates back from step 2 to step 1', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    await user.click(screen.getByText(/Continue/i));
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    
    await user.click(screen.getByText(/Back/i));
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('shows validation error when commute distance is empty', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    const input = screen.getByLabelText(/Weekly Commute Distance/);
    await user.clear(input);
    await user.click(screen.getByText(/Continue/i));
    
    expect(screen.getByText(/Please enter a weekly commute distance/i)).toBeInTheDocument();
  });

  it('can navigate through all 4 steps to the final step', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    // Step 1 → 2
    await user.click(screen.getByText(/Continue/i));
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    
    // Step 2 → 3
    await user.click(screen.getByText(/Continue/i));
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
    
    // Step 3 → 4
    await user.click(screen.getByText(/Continue/i));
    expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
    expect(screen.getByText('Lifestyle & Diet Choices')).toBeInTheDocument();
  });

  it('final step shows "Calculate" button instead of "Continue"', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    // Navigate to step 4
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByText(/Continue/i));
    }
    
    // The button text is 'Calculate' (the heading 'Calculate Your Baseline' also exists)
    const calcBtn = screen.getByRole('button', { name: /Calculate/i });
    expect(calcBtn).toBeInTheDocument();
  });

  it('calls onComplete with correct data shape on final submit', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    // Navigate all the way through
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByText(/Continue/i));
    }
    
    // Click Calculate button (not the heading)
    await user.click(screen.getByRole('button', { name: /Calculate/i }));
    
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    const callArg = mockOnComplete.mock.calls[0][0];
    expect(callArg).toHaveProperty('commuteDistance');
    expect(callArg).toHaveProperty('transportType');
    expect(callArg).toHaveProperty('flightHours');
    expect(callArg).toHaveProperty('electricityKwh');
    expect(callArg).toHaveProperty('greenEnergyShare');
    expect(callArg).toHaveProperty('heatingSource');
    expect(callArg).toHaveProperty('dietType');
    expect(callArg).toHaveProperty('shoppingHabit');
    expect(callArg).toHaveProperty('recycles');
  });

  it('progress bar updates as steps advance', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);
    
    const progressFill = document.querySelector('.progress-bar-fill');
    expect(progressFill).toBeInTheDocument();
    
    const initialWidth = progressFill.style.width;
    await user.click(screen.getByText(/Continue/i));
    expect(progressFill.style.width).not.toBe(initialWidth);
  });

  it('shows validation errors on flights and energy steps', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // Step 1 -> 2
    await user.click(screen.getByText(/Continue/i));
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();

    // Clear flights input and try to continue
    const flightInput = screen.getByLabelText(/Annual Flight Duration/);
    await user.clear(flightInput);
    await user.click(screen.getByText(/Continue/i));
    expect(screen.getByText(/Please enter your annual flight hours/i)).toBeInTheDocument();

    // Fill flights and continue to Step 3
    await user.type(flightInput, '10');
    await user.click(screen.getByText(/Continue/i));
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();

    // Clear electricity input and try to continue
    const electricityInput = screen.getByLabelText(/Monthly Electricity Usage/);
    await user.clear(electricityInput);
    await user.click(screen.getByText(/Continue/i));
    expect(screen.getByText(/Please enter your monthly electricity usage/i)).toBeInTheDocument();
  });

  it('handles custom choices across all steps and submits correct values', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // Step 1: Select "Hybrid EV" and commute distance
    const hybridRadio = screen.getByRole('radio', { name: /Hybrid Car/i });
    await user.click(hybridRadio);
    const commuteInput = screen.getByLabelText(/Weekly Commute Distance/);
    await user.clear(commuteInput);
    await user.type(commuteInput, '120');
    await user.click(screen.getByText(/Continue/i));

    // Step 2: Set flights to 15 hours
    const flightInput = screen.getByLabelText(/Annual Flight Duration/);
    await user.clear(flightInput);
    await user.type(flightInput, '15');
    await user.click(screen.getByText(/Continue/i));

    // Step 3: Set electricity, green energy, and heating source
    const electricityInput = screen.getByLabelText(/Monthly Electricity Usage/);
    await user.clear(electricityInput);
    await user.type(electricityInput, '320');

    // Change slider value
    const greenEnergySlider = screen.getByLabelText(/Green Renewable Share/i);
    fireEvent.change(greenEnergySlider, { target: { value: '45' } });

    // Select natural gas heating
    const heatPumpRadio = screen.getByRole('radio', { name: /Heat Pump/i });
    await user.click(heatPumpRadio);
    await user.click(screen.getByText(/Continue/i));

    // Step 4: Choose vegetarian, minimalist, and check recycles
    const vegRadio = screen.getByRole('radio', { name: /Vegetarian/i });
    await user.click(vegRadio);
    const minRadio = screen.getByRole('radio', { name: /Minimalist/i });
    await user.click(minRadio);

    const recyclesCheck = screen.getByLabelText(/I actively sort and recycle/i);
    if (!recyclesCheck.checked) {
      await user.click(recyclesCheck);
    }

    // Submit form
    await user.click(screen.getByRole('button', { name: /Calculate/i }));

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    expect(mockOnComplete).toHaveBeenCalledWith({
      commuteDistance: 120,
      transportType: 'hybrid',
      flightHours: 15,
      electricityKwh: 320,
      greenEnergyShare: 45,
      heatingSource: 'heatpump',
      dietType: 'vegetarian',
      shoppingHabit: 'minimalist',
      recycles: true
    });
  });
});

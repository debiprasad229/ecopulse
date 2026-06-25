/**
 * Component Tests for CarbonScannerCard
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CarbonScannerCard from '../CarbonScannerCard';

// Mock scannerEngine methods
vi.mock('../../utils/scannerEngine', () => ({
  parseDocumentLocally: vi.fn().mockReturnValue({
    documentType: 'electricity_bill',
    confidence: 90,
    extractedText: 'Simulated bill scan text',
    parsedData: {
      usageValue: 300,
      unit: 'kWh',
      details: 'Mock Utility Company'
    },
    calculatedCarbon: 114
  }),
  parseDocumentWithGemini: vi.fn()
}));

describe('CarbonScannerCard', () => {
  const mockInputs = {
    commuteDistance: 30,
    transportType: 'gasoline',
    flightHours: 5,
    electricityKwh: 200,
    greenEnergyShare: 0,
    heatingSource: 'gas',
    dietType: 'lowMeat',
    shoppingHabit: 'average',
    recycles: true
  };

  const mockUpdateInputs = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly in idle state', () => {
    render(<CarbonScannerCard inputs={mockInputs} onUpdateInputs={mockUpdateInputs} />);
    expect(screen.getByText('Smart Carbon Scanner')).toBeInTheDocument();
    expect(screen.getByText('Drag & Drop Receipt or Bill')).toBeInTheDocument();
  });

  it('simulates file upload scanning state', async () => {
    const { container } = render(<CarbonScannerCard inputs={mockInputs} onUpdateInputs={mockUpdateInputs} />);
    
    // Create a mock file
    const file = new File(['Invoice Usage: 350 kWh'], 'electricity.txt', { type: 'text/plain' });
    
    // Trigger upload
    const input = container.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    // Should enter scanning state
    expect(screen.getByText('Extracting invoice data...')).toBeInTheDocument();

    // After simulated timeout, should resolve to success state
    await waitFor(() => {
      expect(screen.getByText('electricity.txt')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('300 kWh')).toBeInTheDocument();
    expect(screen.getByText('+114 kg CO₂e')).toBeInTheDocument();
  });

  it('allows editing extracted values manually', async () => {
    const user = userEvent.setup();
    const { container } = render(<CarbonScannerCard inputs={mockInputs} onUpdateInputs={mockUpdateInputs} />);
    
    const file = new File(['Invoice Usage: 300 kWh'], 'electricity.txt', { type: 'text/plain' });
    const input = container.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('electricity.txt')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click Edit button
    await user.click(screen.getByText('Edit values'));

    // Input field should appear
    const numberInput = screen.getByRole('spinbutton');
    expect(numberInput).toBeInTheDocument();
    expect(numberInput.value).toBe('300');

    // Change value
    await user.clear(numberInput);
    await user.type(numberInput, '450');

    // Expected Carbon should update: 450 * 0.38 = 171 kg
    expect(screen.getByText('+171 kg CO₂e')).toBeInTheDocument();
  });

  it('triggers updateInputs when dashboard sync button is clicked', async () => {
    const user = userEvent.setup();
    // Mock window.alert
    const originalAlert = window.alert;
    window.alert = vi.fn();

    const { container } = render(<CarbonScannerCard inputs={mockInputs} onUpdateInputs={mockUpdateInputs} />);
    
    const file = new File(['Invoice Usage: 300 kWh'], 'electricity.txt', { type: 'text/plain' });
    const input = container.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('electricity.txt')).toBeInTheDocument();
    }, { timeout: 3000 });

    await user.click(screen.getByText('Sync to Dashboard'));

    expect(mockUpdateInputs).toHaveBeenCalledTimes(1);
    expect(mockUpdateInputs.mock.calls[0][0].electricityKwh).toBe(300);

    // Restore alert
    window.alert = originalAlert;
  });

  it('handles reset state correctly', async () => {
    const user = userEvent.setup();
    const { container } = render(<CarbonScannerCard inputs={mockInputs} onUpdateInputs={mockUpdateInputs} />);
    
    const file = new File(['Invoice Usage: 300 kWh'], 'electricity.txt', { type: 'text/plain' });
    const input = container.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('electricity.txt')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Reset/Trash icon click
    const trashBtn = screen.getByTitle('Delete File');
    await user.click(trashBtn);

    // Should return to upload dropzone
    expect(screen.getByText('Drag & Drop Receipt or Bill')).toBeInTheDocument();
  });
});

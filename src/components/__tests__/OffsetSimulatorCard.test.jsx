/**
 * Component Tests for OffsetSimulatorCard
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OffsetSimulatorCard from '../OffsetSimulatorCard';

describe('OffsetSimulatorCard', () => {
  const defaultProps = {
    offsets: { treesPlanted: 10, cleanEnergyFund: 50, plasticRemoved: 20 },
    setOffsets: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the card title "Carbon Offset Simulator"', () => {
    render(<OffsetSimulatorCard {...defaultProps} />);
    expect(screen.getByText('Carbon Offset Simulator')).toBeInTheDocument();
  });

  it('renders 3 range sliders with ARIA labels', () => {
    render(<OffsetSimulatorCard {...defaultProps} />);
    expect(screen.getByLabelText('Plant Native Trees slider')).toBeInTheDocument();
    expect(screen.getByLabelText('Clean Energy Projects funding slider')).toBeInTheDocument();
    expect(screen.getByLabelText('Ocean Plastic Cleanup slider')).toBeInTheDocument();
  });

  it('displays current offset values', () => {
    render(<OffsetSimulatorCard {...defaultProps} />);
    expect(screen.getByText('10 Trees')).toBeInTheDocument();
    expect(screen.getByText('$50 USD')).toBeInTheDocument();
    expect(screen.getByText('20 kg')).toBeInTheDocument();
  });

  it('displays total offsets correctly', () => {
    // 10*22 + 50*5 + 20*2 = 220 + 250 + 40 = 510
    render(<OffsetSimulatorCard {...defaultProps} />);
    expect(screen.getByText(/-510 kg CO₂e\/yr/)).toBeInTheDocument();
  });

  it('slider change calls setOffsets', () => {
    let state = { treesPlanted: 10, cleanEnergyFund: 50, plasticRemoved: 20 };
    const setOffsets = vi.fn(updater => {
      state = updater(state);
    });
    render(<OffsetSimulatorCard offsets={state} setOffsets={setOffsets} />);
    const treeSlider = screen.getByLabelText('Plant Native Trees slider');
    fireEvent.change(treeSlider, { target: { value: '25', name: 'treesPlanted' } });
    expect(setOffsets).toHaveBeenCalled();
    expect(state.treesPlanted).toBe(25);
  });

  it('shows car equivalency info when offset > 0', () => {
    render(<OffsetSimulatorCard {...defaultProps} />);
    expect(screen.getByText(/Equivalent to removing/)).toBeInTheDocument();
  });

  it('hides equivalency when all offsets are zero', () => {
    render(<OffsetSimulatorCard 
      offsets={{ treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 }} 
      setOffsets={vi.fn()} 
    />);
    expect(screen.queryByText(/Equivalent to removing/)).not.toBeInTheDocument();
  });

  it('slider change defaults to 0 on invalid input', () => {
    let state = { treesPlanted: 10, cleanEnergyFund: 50, plasticRemoved: 20 };
    const setOffsets = vi.fn(updater => {
      state = updater(state);
    });
    render(<OffsetSimulatorCard offsets={state} setOffsets={setOffsets} />);
    const treeSlider = screen.getByLabelText('Plant Native Trees slider');
    
    treeSlider.type = 'text';
    fireEvent.change(treeSlider, { target: { value: 'invalid', name: 'treesPlanted' } });
    expect(state.treesPlanted).toBe(0);
  });
});

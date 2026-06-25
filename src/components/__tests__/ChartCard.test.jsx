/**
 * Component Tests for ChartCard
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChartCard from '../ChartCard';

describe('ChartCard', () => {
  const mockCategories = { transport: 3000, energy: 2000, diet: 1500, shopping: 500 };

  it('renders "No emissions" message when total is 0', () => {
    render(<ChartCard categories={{ transport: 0, energy: 0, diet: 0, shopping: 0 }} />);
    expect(screen.getByText(/No emissions calculated/i)).toBeInTheDocument();
  });

  it('renders the card title "Emission Breakdown"', () => {
    render(<ChartCard categories={mockCategories} />);
    expect(screen.getByText('Emission Breakdown')).toBeInTheDocument();
  });

  it('renders donut chart SVG with aria-label', () => {
    render(<ChartCard categories={mockCategories} />);
    const svg = screen.getByLabelText('Emission pie chart breakdown');
    expect(svg).toBeInTheDocument();
  });

  it('renders all 4 legend items', () => {
    render(<ChartCard categories={mockCategories} />);
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('Home Energy')).toBeInTheDocument();
    expect(screen.getByText('Diet & Food')).toBeInTheDocument();
    expect(screen.getByText('Shopping & Waste')).toBeInTheDocument();
  });

  it('displays total value in center text', () => {
    render(<ChartCard categories={mockCategories} />);
    const total = 3000 + 2000 + 1500 + 500;
    expect(screen.getByText(total.toLocaleString())).toBeInTheDocument();
  });

  it('legend items have keyboard-accessible ARIA labels', () => {
    render(<ChartCard categories={mockCategories} />);
    expect(screen.getByLabelText('Highlight Transport emissions')).toBeInTheDocument();
    expect(screen.getByLabelText('Highlight Home Energy emissions')).toBeInTheDocument();
  });

  it('donut segments have descriptive ARIA labels', () => {
    render(<ChartCard categories={mockCategories} />);
    const transportSegment = screen.getByLabelText(/Category Transport/);
    expect(transportSegment).toBeInTheDocument();
  });

  it('focusing a legend item shows that category in center', () => {
    render(<ChartCard categories={mockCategories} />);
    const legendItem = screen.getByLabelText('Highlight Transport emissions');
    fireEvent.focus(legendItem);
    // center text should now show Transport
    expect(screen.getByText('Transport (43%)')).toBeInTheDocument();
  });

  it('shows hover instruction text', () => {
    render(<ChartCard categories={mockCategories} />);
    expect(screen.getByText(/Hover over the donut segments/i)).toBeInTheDocument();
  });

  it('triggers hover and keyboard focus on donut segments', () => {
    render(<ChartCard categories={mockCategories} />);
    const transportSegment = screen.getByLabelText(/Category Transport/);
    
    // Mouse enter
    fireEvent.mouseEnter(transportSegment);
    expect(screen.getByText('Transport (43%)')).toBeInTheDocument();

    // Mouse leave
    fireEvent.mouseLeave(transportSegment);
    expect(screen.getByText('Total (100%)')).toBeInTheDocument();

    // Keydown Enter on segment
    fireEvent.keyDown(transportSegment, { key: 'Enter' });
    expect(screen.getByText('Transport (43%)')).toBeInTheDocument();

    // Keydown Space on segment
    fireEvent.keyDown(transportSegment, { key: ' ' });
    expect(screen.getByText('Transport (43%)')).toBeInTheDocument();

    // Focus segment
    fireEvent.focus(transportSegment);
    expect(screen.getByText('Transport (43%)')).toBeInTheDocument();

    // Blur segment
    fireEvent.blur(transportSegment);
    expect(screen.getByText('Total (100%)')).toBeInTheDocument();

    // Keydown ArrowDown on segment (should do nothing)
    fireEvent.keyDown(transportSegment, { key: 'ArrowDown' });
    expect(screen.getByText('Total (100%)')).toBeInTheDocument();
  });

  it('triggers keyboard interaction on legend items', () => {
    render(<ChartCard categories={mockCategories} />);
    const legendItem = screen.getByLabelText('Highlight Transport emissions');

    // Mouse enter / leave legend
    fireEvent.mouseEnter(legendItem);
    expect(screen.getByText('Transport (43%)')).toBeInTheDocument();
    fireEvent.mouseLeave(legendItem);
    expect(screen.getByText('Total (100%)')).toBeInTheDocument();

    // Focus / blur legend
    fireEvent.focus(legendItem);
    expect(screen.getByText('Transport (43%)')).toBeInTheDocument();
    fireEvent.blur(legendItem);
    expect(screen.getByText('Total (100%)')).toBeInTheDocument();

    // Keydown Space on legend
    fireEvent.keyDown(legendItem, { key: ' ' });
    expect(screen.getByText('Transport (43%)')).toBeInTheDocument();

    // Keydown Enter on legend
    fireEvent.keyDown(legendItem, { key: 'Enter' });
    expect(screen.getByText('Transport (43%)')).toBeInTheDocument();

    // Keydown ArrowDown on legend (should do nothing)
    fireEvent.keyDown(legendItem, { key: 'ArrowDown' });
  });
});

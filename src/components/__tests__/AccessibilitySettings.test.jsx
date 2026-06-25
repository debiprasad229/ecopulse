/**
 * Component Tests for AccessibilitySettings
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccessibilitySettings from '../AccessibilitySettings';

describe('AccessibilitySettings', () => {
  const defaultProps = {
    highContrast: false,
    setHighContrast: vi.fn(),
    fontSize: 'normal',
    setFontSize: vi.fn(),
    reducedMotion: false,
    setReducedMotion: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the toggle button with proper ARIA attributes', () => {
    render(<AccessibilitySettings {...defaultProps} />);
    const btn = screen.getByLabelText('Accessibility Settings');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-haspopup', 'true');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens dropdown when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<AccessibilitySettings {...defaultProps} />);
    
    await user.click(screen.getByLabelText('Accessibility Settings'));
    expect(screen.getByText('Accessibility Settings', { selector: 'h4' })).toBeInTheDocument();
    expect(screen.getByLabelText('Accessibility Settings')).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes dropdown when toggle button is clicked again', async () => {
    const user = userEvent.setup();
    render(<AccessibilitySettings {...defaultProps} />);
    
    const btn = screen.getByLabelText('Accessibility Settings');
    await user.click(btn); // open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    await user.click(btn); // close
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup();
    render(<AccessibilitySettings {...defaultProps} />);
    
    await user.click(screen.getByLabelText('Accessibility Settings'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('high contrast toggle calls setHighContrast', async () => {
    const user = userEvent.setup();
    render(<AccessibilitySettings {...defaultProps} />);
    
    await user.click(screen.getByLabelText('Accessibility Settings'));
    const checkbox = screen.getByLabelText('Toggle High Contrast Mode');
    await user.click(checkbox);
    
    expect(defaultProps.setHighContrast).toHaveBeenCalledTimes(1);
  });

  it('font size selector calls setFontSize', async () => {
    const user = userEvent.setup();
    render(<AccessibilitySettings {...defaultProps} />);
    
    await user.click(screen.getByLabelText('Accessibility Settings'));
    const select = screen.getByLabelText('Select text scaling size');
    await user.selectOptions(select, 'large');
    
    expect(defaultProps.setFontSize).toHaveBeenCalledWith('large');
  });

  it('reduced motion toggle calls setReducedMotion', async () => {
    const user = userEvent.setup();
    render(<AccessibilitySettings {...defaultProps} />);
    
    await user.click(screen.getByLabelText('Accessibility Settings'));
    const checkbox = screen.getByLabelText('Toggle Reduced Motion');
    await user.click(checkbox);
    
    expect(defaultProps.setReducedMotion).toHaveBeenCalledTimes(1);
  });

  it('shows checked state for high contrast when prop is true', () => {
    render(<AccessibilitySettings {...defaultProps} highContrast={true} />);
    // Need to open the dropdown first
    fireEvent.click(screen.getByLabelText('Accessibility Settings'));
    const checkbox = screen.getByLabelText('Toggle High Contrast Mode');
    expect(checkbox).toBeChecked();
  });

  it('shows correct font size selection when prop is "large"', () => {
    render(<AccessibilitySettings {...defaultProps} fontSize="large" />);
    fireEvent.click(screen.getByLabelText('Accessibility Settings'));
    const select = screen.getByLabelText('Select text scaling size');
    expect(select.value).toBe('large');
  });
});

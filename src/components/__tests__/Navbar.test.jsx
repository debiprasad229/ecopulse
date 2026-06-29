import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../Navbar';

describe('Navbar', () => {
  const defaultProps = {
    isOpen: false,
    setIsOpen: vi.fn(),
    currentRoute: 'dashboard'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation links in desktop view', () => {
    render(<Navbar {...defaultProps} />);
    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Analytics')[0]).toBeInTheDocument();
    expect(screen.getAllByText('AI Coach')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Challenges')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Profile')[0]).toBeInTheDocument();
  });

  it('adds scrolled class to navigation bar on scroll', () => {
    render(<Navbar {...defaultProps} />);
    const nav = screen.getByRole('navigation');
    expect(nav).not.toHaveClass('scrolled');

    // Simulate scroll past 20px
    window.scrollY = 30;
    fireEvent.scroll(window);
    
    expect(nav).toHaveClass('scrolled');

    // Scroll back to 0
    window.scrollY = 0;
    fireEvent.scroll(window);
    expect(nav).not.toHaveClass('scrolled');
  });

  it('toggles mobile menu when overlay or close button is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<Navbar {...defaultProps} isOpen={true} />);
    
    // Close button
    const closeBtn = screen.getByRole('button', { name: /close menu/i });
    await user.click(closeBtn);
    expect(defaultProps.setIsOpen).toHaveBeenCalledWith(false);

    // Overlay
    const overlay = container.querySelector('.mobile-drawer-overlay');
    await user.click(overlay);
    expect(defaultProps.setIsOpen).toHaveBeenCalledWith(false);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../Navbar';

describe('Navbar', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      category: 'Achievements',
      title: 'New badge unlocked',
      description: 'You unlocked a badge',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: 'notif-2',
      category: 'Challenges',
      title: 'Daily challenge completed',
      description: 'Completed challenge',
      timestamp: new Date().toISOString(),
      read: true
    }
  ];

  const defaultProps = {
    isOpen: false,
    setIsOpen: vi.fn(),
    notifications: mockNotifications,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearNotification: vi.fn(),
    clearAllNotifications: vi.fn()
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

  it('renders notification bell and unread badge count', () => {
    render(<Navbar {...defaultProps} />);
    
    // Bell button check
    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    expect(bellBtn).toBeInTheDocument();

    // Badge showing unread count of 1 (since 1 notification is unread)
    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
  });

  it('toggles notifications dropdown menu on click', async () => {
    const user = userEvent.setup();
    render(<Navbar {...defaultProps} />);

    // Initially dropdown is not in the document
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();

    // Click bell to open
    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    await user.click(bellBtn);

    // Dropdown header and items are visible
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('New badge unlocked')).toBeInTheDocument();
    expect(screen.getByText('Daily challenge completed')).toBeInTheDocument();

    // Click bell again to close
    await user.click(bellBtn);
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('triggers markAsRead when unread checkmark action is clicked', async () => {
    const user = userEvent.setup();
    render(<Navbar {...defaultProps} />);

    // Open dropdown
    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    await user.click(bellBtn);

    // Click check mark button for unread item
    const markReadBtn = screen.getByTitle('Mark as read');
    await user.click(markReadBtn);

    expect(defaultProps.markAsRead).toHaveBeenCalledWith('notif-1');
  });

  it('triggers clearNotification when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<Navbar {...defaultProps} />);

    // Open dropdown
    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    await user.click(bellBtn);

    // Click clear button for first item
    const clearBtn = screen.getAllByTitle('Clear notification')[0];
    await user.click(clearBtn);

    expect(defaultProps.clearNotification).toHaveBeenCalledWith('notif-1');
  });

  it('triggers markAllAsRead and clearAllNotifications', async () => {
    const user = userEvent.setup();
    render(<Navbar {...defaultProps} />);

    // Open dropdown
    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    await user.click(bellBtn);

    // Mark all as read click
    const markAllBtn = screen.getByRole('button', { name: /mark all as read/i });
    await user.click(markAllBtn);
    expect(defaultProps.markAllAsRead).toHaveBeenCalled();

    // Clear all click
    const clearAllBtn = screen.getByRole('button', { name: /clear all/i });
    await user.click(clearAllBtn);
    expect(defaultProps.clearAllNotifications).toHaveBeenCalled();
  });
});

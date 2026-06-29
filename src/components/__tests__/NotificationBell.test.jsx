import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from '../NotificationBell';

describe('NotificationBell', () => {
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
    notifications: mockNotifications,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearNotification: vi.fn(),
    clearAllNotifications: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification bell and unread badge count', () => {
    render(<NotificationBell {...defaultProps} />);
    
    // Bell button check
    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    expect(bellBtn).toBeInTheDocument();

    // Badge showing unread count of 1 (since 1 notification is unread)
    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
  });

  it('toggles notifications dropdown menu on click', async () => {
    const user = userEvent.setup();
    render(<NotificationBell {...defaultProps} />);

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
    render(<NotificationBell {...defaultProps} />);

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
    render(<NotificationBell {...defaultProps} />);

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
    render(<NotificationBell {...defaultProps} />);

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

import { useState, useEffect, useRef } from 'react';
import {
  Bell, BellOff, Trash2, Check, CheckCheck,
  Award, Zap, TrendingDown, Sparkles, Info, X
} from 'lucide-react';

const CATEGORY_CONFIG = {
  'Achievements': { icon: Award, color: 'var(--accent-purple)', bg: 'rgba(139, 92, 246, 0.08)' },
  'Challenges': { icon: Zap, color: 'var(--accent-orange)', bg: 'rgba(245, 158, 11, 0.08)' },
  'Carbon Score Updates': { icon: TrendingDown, color: 'var(--accent-green)', bg: 'rgba(16, 185, 129, 0.08)' },
  'AI Recommendations': { icon: Sparkles, color: 'var(--accent-blue)', bg: 'rgba(6, 182, 212, 0.08)' },
  'System Updates': { icon: Info, color: 'var(--text-muted)', bg: 'rgba(255, 255, 255, 0.04)' }
};

export default function NotificationBell({
  notifications = [],
  markAsRead,
  markAllAsRead,
  clearNotification,
  clearAllNotifications
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className={`notification-bell-btn ${dropdownOpen ? 'active' : ''}`}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={dropdownOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {dropdownOpen && (
        <div className="notifications-dropdown animate-dropdown" style={{ top: '120%' }}>
          <div className="dropdown-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="dropdown-title">Notifications</h3>
              {unreadCount > 0 && (
                <span className="unread-count-badge">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                <CheckCheck size={14} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          <div className="dropdown-body">
            {notifications.length === 0 ? (
              <div className="notifications-empty-state">
                <div className="empty-state-icon-holder">
                  <BellOff size={28} />
                </div>
                <p className="empty-title">All caught up!</p>
                <p className="empty-desc">No notifications to display.</p>
              </div>
            ) : (
              ['AI Recommendations', 'Achievements', 'Challenges', 'Carbon Score Updates', 'System Updates'].map(category => {
                const categoryNotifs = notifications.filter(n => n.category === category);
                if (categoryNotifs.length === 0) return null;

                const config = CATEGORY_CONFIG[category] || { icon: Info, color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' };
                const IconComponent = config.icon;

                return (
                  <div key={category} className="notification-category-group">
                    <div className="category-group-header">
                      <IconComponent size={13} style={{ color: config.color }} />
                      <span>{category}</span>
                    </div>
                    <div className="category-group-list">
                      {categoryNotifs.map(notif => (
                        <div
                          key={notif.id}
                          className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                        >
                          <div
                            className="notif-icon-wrapper"
                            style={{ color: config.color, background: config.bg }}
                          >
                            <IconComponent size={14} />
                          </div>

                          <div className="notif-content">
                            <div className="notif-title-row">
                              <h4 className="notif-item-title">{notif.title}</h4>
                              <span className="notif-time">{formatTime(notif.timestamp)}</span>
                            </div>
                            <p className="notif-item-desc">{notif.description}</p>
                          </div>

                          <div className="notif-actions">
                            {!notif.read && (
                              <button
                                className="notif-action-btn mark-read"
                                onClick={() => markAsRead(notif.id)}
                                title="Mark as read"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              className="notif-action-btn clear-notif"
                              onClick={() => clearNotification(notif.id)}
                              title="Clear notification"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="dropdown-footer">
              <button
                className="clear-all-btn"
                onClick={clearAllNotifications}
              >
                <Trash2 size={13} />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

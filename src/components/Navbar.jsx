import { useState, useEffect, useRef } from 'react';
import { 
  X, BarChart3, Globe, ScanLine, Brain, Activity, 
  Bell, BellOff, Trash2, Check, CheckCheck, 
  Award, Zap, TrendingDown, Sparkles, Info, User 
} from 'lucide-react';

const CATEGORY_CONFIG = {
  'Achievements': { icon: Award, color: 'var(--accent-purple)', bg: 'rgba(139, 92, 246, 0.08)' },
  'Challenges': { icon: Zap, color: 'var(--accent-orange)', bg: 'rgba(245, 158, 11, 0.08)' },
  'Carbon Score Updates': { icon: TrendingDown, color: 'var(--accent-green)', bg: 'rgba(16, 185, 129, 0.08)' },
  'AI Recommendations': { icon: Sparkles, color: 'var(--accent-blue)', bg: 'rgba(6, 182, 212, 0.08)' },
  'System Updates': { icon: Info, color: 'var(--text-muted)', bg: 'rgba(255, 255, 255, 0.04)' }
};

export default function Navbar({ 
  isOpen, 
  setIsOpen,
  notifications = [],
  markAsRead,
  markAllAsRead,
  clearNotification,
  clearAllNotifications,
  currentRoute = 'dashboard'
}) {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle sticky blur effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

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

  const navLinks = [
    { name: 'Dashboard', href: '#dashboard', icon: <Activity size={18} /> },
    { name: 'Analytics', href: '#analytics', icon: <BarChart3 size={18} /> },
    { name: 'AI Coach', href: '#ai-coach', icon: <Brain size={18} /> },
    { name: 'Challenges', href: '#challenges', icon: <Zap size={18} /> },
    { name: 'Profile', href: '#profile', icon: <User size={18} /> },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Sticky Navbar */}
      <nav className={`top-navbar ${scrolled ? 'scrolled' : ''}`} role="navigation">
        <div className="navbar-container">

          {/* Desktop Links */}
          <div className="desktop-nav-links">
            {navLinks.map((link) => {
              const routeName = link.href.replace('#', '');
              const isActive = currentRoute === routeName;
              return (
                <a 
                  key={link.name} 
                  href={link.href} 
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </a>
              );
            })}
          </div>



        </div>
      </nav>

      {/* Mobile Side Drawer Overlay */}
      <div className={`mobile-drawer-overlay ${isOpen ? 'open' : ''}`} onClick={toggleMenu} />

      {/* Mobile Side Drawer */}
      <div className={`mobile-side-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2 className="drawer-title">Menu</h2>
          <button className="close-drawer-btn" onClick={toggleMenu} aria-label="Close Menu">
            <X size={24} />
          </button>
        </div>
        <div className="drawer-links">
          {navLinks.map((link) => {
            const routeName = link.href.replace('#', '');
            const isActive = currentRoute === routeName;
            return (
              <a 
                key={link.name} 
                href={link.href} 
                className={`drawer-item ${isActive ? 'active' : ''}`} 
                onClick={toggleMenu}
              >
                {link.icon}
                <span>{link.name}</span>
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}

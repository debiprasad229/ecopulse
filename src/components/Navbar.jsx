import { useState, useEffect } from 'react';
import { 
  X, BarChart3, Brain, Activity, Zap, User 
} from 'lucide-react';

export default function Navbar({ 
  isOpen, 
  setIsOpen,
  currentRoute = 'dashboard'
}) {
  const [scrolled, setScrolled] = useState(false);

  // Handle sticky blur effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: 'Dashboard', href: '#dashboard', icon: <Activity size={18} /> },
    { name: 'Analytics', href: '#analytics', icon: <BarChart3 size={18} /> },
    { name: 'AI Coach', href: '#ai-coach', icon: <Brain size={18} /> },
    { name: 'Challenges', href: '#challenges', icon: <Zap size={18} /> },
    { name: 'Profile', href: '#profile', icon: <User size={18} /> },
  ];

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

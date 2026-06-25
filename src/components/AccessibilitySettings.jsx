import { useState, useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';

export default function AccessibilitySettings({
  highContrast,
  setHighContrast,
  fontSize,
  setFontSize,
  reducedMotion,
  setReducedMotion
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on ESC key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleOpen = () => setIsOpen(prev => !prev);

  return (
    <div className="accessibility-panel" ref={panelRef}>
      <button
        ref={buttonRef}
        type="button"
        className="accessibility-toggle-btn"
        onClick={toggleOpen}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Accessibility Settings"
        title="Accessibility Settings"
      >
        <Eye size={18} aria-hidden="true" />
      </button>

      {isOpen && (
        <div 
          className="accessibility-dropdown" 
          role="dialog" 
          aria-label="Accessibility configuration options"
        >
          <h4 className="accessibility-dropdown-title">Accessibility Settings</h4>

          {/* High Contrast Toggle */}
          <div className="accessibility-control-group">
            <label className="accessibility-checkbox-label" htmlFor="high-contrast-toggle">
              <span>High Contrast Mode</span>
              <input
                id="high-contrast-toggle"
                type="checkbox"
                className="accessibility-checkbox-input"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                aria-label="Toggle High Contrast Mode"
              />
            </label>
          </div>

          {/* Font Size Selector */}
          <div className="accessibility-control-group">
            <label className="accessibility-control-label" htmlFor="font-size-select">
              Text Scale
            </label>
            <select
              id="font-size-select"
              className="accessibility-select"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              aria-label="Select text scaling size"
            >
              <option value="normal">Normal (Default)</option>
              <option value="large">Large (+15%)</option>
              <option value="xlarge">Extra Large (+30%)</option>
            </select>
          </div>

          {/* Reduced Motion Toggle */}
          <div className="accessibility-control-group">
            <label className="accessibility-checkbox-label" htmlFor="reduced-motion-toggle">
              <span>Reduced Motion</span>
              <input
                id="reduced-motion-toggle"
                type="checkbox"
                className="accessibility-checkbox-input"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                aria-label="Toggle Reduced Motion"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

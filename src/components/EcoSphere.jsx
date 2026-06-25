import { useMemo } from 'react';

/**
 * EcoSphere - Interactive visual indicator of the user's environmental impact.
 * Interpolates color states and particle properties based on current net footprint.
 * 
 * @param {Object} props
 * @param {number} props.netFootprint - Total emissions minus offsets (kg CO2e)
 * @param {number} props.baselineFootprint - Baseline emissions calculated during onboarding (kg CO2e)
 */
export default function EcoSphere({ netFootprint = 0, baselineFootprint = 8000 }) {
  // Calculate health percentage:
  // 100% health = Net emissions <= 2000 kg (highly sustainable or fully offset)
  // 0% health = Net emissions >= baselineFootprint (or 12000 if baseline is very low)
  const healthPercent = useMemo(() => {
    const minTarget = 2000;
    const maxThreshold = Math.max(12000, baselineFootprint);
    
    if (netFootprint <= minTarget) return 100;
    if (netFootprint >= maxThreshold) return 0;
    
    const range = maxThreshold - minTarget;
    const excess = netFootprint - minTarget;
    return Math.round(100 - (excess / range) * 100);
  }, [netFootprint, baselineFootprint]);

  // Determine colors based on health percentage:
  // Interpolating between (red/orange/grey) and (green/cyan/blue)
  const themeColors = useMemo(() => {
    // 0% health: Grey-Orange
    // 50% health: Teal-Green
    // 100% health: Emerald-SkyBlue
    if (healthPercent > 75) {
      return {
        glow: 'rgba(16, 185, 129, 0.4)', // Emerald
        gradientStart: '#10b981',
        gradientEnd: '#06b6d4',
        sky: '#0f1f1d',
        atmosphere: 'rgba(6, 182, 212, 0.3)',
        particleColor: '#34d399',
        label: 'Thriving EcoSphere',
        statusColor: 'var(--success)'
      };
    } else if (healthPercent > 40) {
      return {
        glow: 'rgba(59, 130, 246, 0.3)', // Cyan-Blue
        gradientStart: '#3b82f6',
        gradientEnd: '#10b981',
        sky: '#0d1527',
        atmosphere: 'rgba(59, 130, 246, 0.2)',
        particleColor: '#60a5fa',
        label: 'Balanced EcoSphere',
        statusColor: '#3b82f6'
      };
    } else if (healthPercent > 15) {
      return {
        glow: 'rgba(245, 158, 11, 0.3)', // Amber
        gradientStart: '#f59e0b',
        gradientEnd: '#6b7280',
        sky: '#1e1b15',
        atmosphere: 'rgba(245, 158, 11, 0.15)',
        particleColor: '#fbbf24',
        label: 'Degraded EcoSphere',
        statusColor: 'var(--accent-orange)'
      };
    } else {
      return {
        glow: 'rgba(239, 68, 68, 0.4)', // Red-Grey
        gradientStart: '#ef4444',
        gradientEnd: '#374151',
        sky: '#1f1315',
        atmosphere: 'rgba(239, 68, 68, 0.2)',
        particleColor: '#fca5a5',
        label: 'Critical EcoSphere',
        statusColor: 'var(--danger)'
      };
    }
  }, [healthPercent]);

  return (
    <div className="bento-card col-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div className="card-header" style={{ marginBottom: '10px' }}>
        <div className="card-title-group">
          <div className="card-icon-wrapper" style={{ color: themeColors.statusColor, background: `rgba(255, 255, 255, 0.03)` }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <h3 className="card-title">My EcoSphere</h3>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: themeColors.statusColor, textTransform: 'uppercase' }}>
          {healthPercent}% Health
        </span>
      </div>

      <div className="ecosphere-container">
        {/* Glow backdrop filter */}
        <div 
          className="sphere-glow-layer" 
          style={{ 
            background: `radial-gradient(circle, ${themeColors.glow} 0%, transparent 70%)` 
          }}
        />

        {/* Animated Earth SVG */}
        <svg className="sphere-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="45%" stopColor={themeColors.gradientStart} />
              <stop offset="100%" stopColor={themeColors.gradientEnd} />
            </radialGradient>
            
            <filter id="shadow">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.5"/>
            </filter>
          </defs>

          {/* Atmosphere ring */}
          <circle cx="50" cy="50" r="48" stroke={themeColors.atmosphere} strokeWidth="1.5" />

          {/* Main sphere */}
          <circle cx="50" cy="50" r="42" fill="url(#sphereGrad)" filter="url(#shadow)" />

          {/* Landmass 1 */}
          <path 
            d="M25 45 C28 35, 38 30, 42 35 C45 38, 50 36, 52 42 C54 48, 48 55, 42 58 C35 60, 22 55, 25 45 Z" 
            fill="#ffffff" 
            fillOpacity="0.08" 
          />

          {/* Landmass 2 */}
          <path 
            d="M55 50 C62 45, 68 48, 72 55 C74 60, 68 68, 62 65 C55 62, 50 55, 55 50 Z" 
            fill="#ffffff" 
            fillOpacity="0.06" 
          />

          {/* Floating leaf/particle indicators (pure SVG animation details) */}
          <circle cx="20" cy="20" r="1.5" fill={themeColors.particleColor} fillOpacity="0.6">
            <animate attributeName="cy" values="20;12;20" dur="5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="5s" repeatCount="indefinite" />
          </circle>
          <circle cx="80" cy="30" r="2" fill={themeColors.particleColor} fillOpacity="0.6">
            <animate attributeName="cy" values="30;40;30" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="15" cy="70" r="1.2" fill={themeColors.particleColor} fillOpacity="0.6">
            <animate attributeName="cy" values="70;65;70" dur="6s" repeatCount="indefinite" />
          </circle>
          <circle cx="75" cy="78" r="1.8" fill={themeColors.particleColor} fillOpacity="0.6">
            <animate attributeName="cy" values="78;70;78" dur="4.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          {themeColors.label}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {netFootprint > baselineFootprint 
            ? 'Emissions are exceeding baseline. Take action!'
            : netFootprint <= 2000 
              ? 'Awesome! Your net footprint is at the climate-safe line.' 
              : 'Keep checking habits or supporting offsets to heal the sphere.'
          }
        </p>
      </div>
    </div>
  );
}

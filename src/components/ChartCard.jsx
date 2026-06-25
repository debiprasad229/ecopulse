import { useState, useMemo } from 'react';
import { PieChart } from 'lucide-react';

export default function ChartCard({ id, categories = { transport: 0, energy: 0, diet: 0, shopping: 0 } }) {
  const [activeCategory, setActiveCategory] = useState(null);

  const total = useMemo(() => {
    return categories.transport + categories.energy + categories.diet + categories.shopping;
  }, [categories]);

  // Calculate percentages and angles
  const data = useMemo(() => {
    const list = [
      { id: 'transport', label: 'Transport', value: categories.transport, color: 'var(--accent-blue)', hoverColor: '#22d3ee' },
      { id: 'energy', label: 'Home Energy', value: categories.energy, color: 'var(--accent-orange)', hoverColor: '#fbbf24' },
      { id: 'diet', label: 'Diet & Food', value: categories.diet, color: 'var(--accent-green)', hoverColor: '#34d399' },
      { id: 'shopping', label: 'Shopping & Waste', value: categories.shopping, color: 'var(--accent-purple)', hoverColor: '#a78bfa' }
    ];

    let currentOffset = 0;
    const radius = 25;
    const circumference = 2 * Math.PI * radius; // ~157.08

    return list.map(item => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      const strokeLength = (percentage / 100) * circumference;
      const strokeOffset = circumference - strokeLength + currentOffset;
      
      // Update offset for next segment (SVG circle stroke-dashoffset subtraction)
      currentOffset -= strokeLength;

      return {
        ...item,
        percentage: Math.round(percentage),
        strokeLength,
        strokeOffset,
        circumference,
        radius
      };
    });
  }, [categories, total]);

  // Handle segment hover
  const hoveredItem = useMemo(() => {
    if (!activeCategory) return null;
    return data.find(item => item.id === activeCategory);
  }, [activeCategory, data]);

  const displayTitle = hoveredItem ? hoveredItem.label : 'Total';
  const displayValue = hoveredItem ? hoveredItem.value : total;
  const displayUnit = hoveredItem ? `${hoveredItem.percentage}%` : '100%';

  return (
    <div id={id} className="bento-card col-6" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="card-header" style={{ marginBottom: '10px' }}>
          <div className="card-title-group">
            <div className="card-icon-wrapper">
              <PieChart size={20} />
            </div>
            <h3 className="card-title">Emission Breakdown</h3>
          </div>
        </div>

        {total === 0 ? (
          <div style={{ display: 'flex', height: '200px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No emissions calculated. Please complete onboarding.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}>
            
            {/* SVG Donut Chart */}
            <div className="chart-container">
              <svg 
                className="chart-svg-donut" 
                width="180" 
                height="180" 
                viewBox="0 0 64 64"
                aria-label="Emission pie chart breakdown"
              >
                {/* Background trace ring */}
                <circle 
                  cx="32" 
                  cy="32" 
                  r="25" 
                  fill="transparent" 
                  stroke="rgba(255, 255, 255, 0.03)" 
                  strokeWidth="8" 
                />

                {/* Donut segments */}
                {data.map(item => (
                  <circle
                    key={item.id}
                    className="donut-segment"
                    cx="32"
                    cy="32"
                    r={item.radius}
                    fill="transparent"
                    stroke={activeCategory === item.id ? item.hoverColor : item.color}
                    strokeWidth={activeCategory === item.id ? '10' : '8'}
                    strokeDasharray={`${item.strokeLength} ${item.circumference - item.strokeLength}`}
                    strokeDashoffset={item.strokeOffset}
                    strokeLinecap="round"
                    cursor="pointer"
                    tabIndex="0"
                    role="button"
                    aria-label={`Category ${item.label}: ${item.value.toLocaleString()} kg CO2e, representing ${item.percentage}% of total`}
                    onMouseEnter={() => setActiveCategory(item.id)}
                    onMouseLeave={() => setActiveCategory(null)}
                    onFocus={() => setActiveCategory(item.id)}
                    onBlur={() => setActiveCategory(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveCategory(item.id);
                      }
                    }}
                    style={{
                      transformOrigin: 'center',
                      transition: 'stroke-width 0.2s ease, stroke 0.2s ease',
                      outline: 'none'
                    }}
                  />
                ))}
              </svg>

              {/* Center textual indicator */}
              <div className="chart-center-text" aria-live="polite">
                <span className="chart-center-value">{displayValue.toLocaleString()}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>kg CO₂e/yr</span>
                <span className="chart-center-label" style={{ color: hoveredItem ? hoveredItem.color : 'var(--text-secondary)', fontWeight: 700, marginTop: '4px' }}>
                  {displayTitle} ({displayUnit})
                </span>
              </div>
            </div>

            {/* Custom Interactive Legend */}
            <div className="chart-legend" role="list" aria-label="Emission Breakdown Legend">
              {data.map(item => (
                <div 
                  key={item.id} 
                  className="legend-item"
                  tabIndex="0"
                  role="button"
                  aria-label={`Highlight ${item.label} emissions`}
                  onMouseEnter={() => setActiveCategory(item.id)}
                  onMouseLeave={() => setActiveCategory(null)}
                  onFocus={() => setActiveCategory(item.id)}
                  onBlur={() => setActiveCategory(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveCategory(item.id);
                    }
                  }}
                  style={{
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: activeCategory === item.id ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                    transition: 'var(--transition-smooth)',
                    outline: 'none'
                  }}
                >
                  <span className="legend-color" style={{ backgroundColor: item.color }} />
                  <span style={{ fontWeight: activeCategory === item.id ? '600' : 'normal' }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '2px' }}>
                    ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '12px', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Hover over the donut segments to see detailed annual totals.
      </div>
    </div>
  );
}

import { useState, useMemo, useCallback } from 'react';
import { TrendingUp, TrendingDown, Sparkles, Activity } from 'lucide-react';

export default function CarbonForecastCard({ 
  forecast, 
  recommendations = [] 
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Chart configuration & dimensions
  const svgWidth = 480;
  const svgHeight = 220;
  const paddingLeft = 55;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // X & Y scalers
  const getX = useCallback((index) => paddingLeft + (index * (chartWidth / 5)), [chartWidth, paddingLeft]);

  // Determine limits of the chart (dynamic min/max)
  const forecastData = useMemo(() => forecast?.forecastData || [], [forecast]);
  const allValues = forecastData.flatMap(d => [d.baseline, d.bestCase, d.worstCase]);
  const maxVal = (allValues.length ? Math.max(...allValues, 2000) : 2000) * 1.05; // pad top
  const minVal = allValues.length ? Math.max(0, Math.min(...allValues) - 600) : 0; // pad bottom
  const valRange = maxVal - minVal || 1;

  const getY = useCallback((val) => svgHeight - paddingBottom - (((val - minVal) / valRange) * chartHeight), [minVal, valRange, chartHeight, svgHeight, paddingBottom]);

  // Generate paths
  const baselineLinePath = useMemo(() => {
    return forecastData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.baseline)}`).join(' ');
  }, [forecastData, getX, getY]);

  const bestCaseLinePath = useMemo(() => {
    return forecastData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.bestCase)}`).join(' ');
  }, [forecastData, getX, getY]);

  const worstCaseLinePath = useMemo(() => {
    return forecastData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.worstCase)}`).join(' ');
  }, [forecastData, getX, getY]);

  const bestCaseAreaPath = useMemo(() => {
    if (forecastData.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(5);
    const yBottom = svgHeight - paddingBottom;
    return `${bestCaseLinePath} L ${lastX} ${yBottom} L ${firstX} ${yBottom} Z`;
  }, [bestCaseLinePath, forecastData, getX, svgHeight, paddingBottom]);

  // Grid lines (y-axis values)
  const gridTicks = useMemo(() => {
    const ticks = [];
    const step = valRange / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(Math.round(minVal + step * i));
    }
    return ticks;
  }, [minVal, valRange]);

  // Selected interventions (top 2 interventions with actual savings)
  const sortedInterventions = useMemo(() => {
    return [...recommendations]
      .filter(rec => rec.savings > 0)
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 2);
  }, [recommendations]);

  if (!forecast || !forecast.forecastData || forecast.forecastData.length === 0) return null;

  const hoveredData = hoveredIdx !== null ? forecast.forecastData[hoveredIdx] : null;

  // Goal probability circular progress ring calculations
  // Radius = 34, Circumference = 2 * PI * r = ~213.6
  const ringRadius = 34;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeOffset = ringCircumference - (forecast.goalProbability / 100) * ringCircumference;

  return (
    <div className="bento-card col-12 forecast-card-container">
      
      {/* Card Header */}
      <div className="card-header" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div className="card-title-group">
          <div className="card-icon-wrapper" style={{ color: 'var(--accent-blue)', background: 'rgba(6, 182, 212, 0.05)' }}>
            <Activity size={20} />
          </div>
          <div>
            <h3 className="card-title">Carbon Forecast & Projections</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              6-month future projection based on active behavioral trends
            </span>
          </div>
        </div>
      </div>

      {/* Grid Layout Split */}
      <div className="forecast-grid-split">
        
        {/* Left Side: SVG Chart Visuals */}
        <div className="forecast-chart-section">
          <div className="forecast-chart-header">
            <span className="chart-legend-indicator"><span className="dot worst" />Worst Case</span>
            <span className="chart-legend-indicator"><span className="dot base" />Baseline Trend</span>
            <span className="chart-legend-indicator"><span className="dot best" />Best Case (Target)</span>
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            
            {/* SVG Interactive Line Chart */}
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              width="100%"
              height="100%"
              style={{ overflow: 'visible' }}
            >
              <defs>
                {/* Gradient fills */}
                <linearGradient id="bestCaseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="worstCaseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--danger)" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="var(--danger)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines & Labels */}
              {gridTicks.map((tick, i) => (
                <g key={`grid-${i}`}>
                  <line 
                    x1={paddingLeft} 
                    y1={getY(tick)} 
                    x2={svgWidth - paddingRight} 
                    y2={getY(tick)} 
                    stroke="rgba(255, 255, 255, 0.04)" 
                    strokeWidth="1"
                  />
                  <text 
                    x={paddingLeft - 8} 
                    y={getY(tick) + 4} 
                    textAnchor="end" 
                    fill="var(--text-muted)" 
                    fontSize="9px"
                    fontWeight="500"
                  >
                    {tick.toLocaleString()}
                  </text>
                </g>
              ))}

              {/* Shaded Areas */}
              <path d={bestCaseAreaPath} fill="url(#bestCaseGrad)" />

              {/* Trajectory lines */}
              <path d={worstCaseLinePath} stroke="var(--danger)" strokeWidth="2" fill="none" strokeDasharray="3,3" opacity="0.75" />
              <path d={baselineLinePath} stroke="#64748b" strokeWidth="2" fill="none" opacity="0.6" />
              <path d={bestCaseLinePath} stroke="var(--accent-green)" strokeWidth="3" fill="none" strokeLinecap="round" />

              {/* Dots on nodes */}
              {forecast.forecastData.map((d, i) => (
                <g key={`nodes-${i}`}>
                  {/* Best Case node */}
                  <circle cx={getX(i)} cy={getY(d.bestCase)} r="3" fill="var(--accent-green)" />
                  {/* Baseline node */}
                  <circle cx={getX(i)} cy={getY(d.baseline)} r="2.5" fill="#64748b" />
                </g>
              ))}

              {/* Hover vertical line and nodes */}
              {hoveredIdx !== null && (
                <g>
                  {/* Vertical cursor */}
                  <line 
                    x1={getX(hoveredIdx)} 
                    y1={paddingTop} 
                    x2={getX(hoveredIdx)} 
                    y2={svgHeight - paddingBottom} 
                    stroke="rgba(255, 255, 255, 0.15)" 
                    strokeWidth="1" 
                    strokeDasharray="2,2" 
                  />
                  {/* Expanded highlight dots */}
                  <circle cx={getX(hoveredIdx)} cy={getY(hoveredData.bestCase)} r="6" fill="var(--accent-green)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                  <circle cx={getX(hoveredIdx)} cy={getY(hoveredData.baseline)} r="5" fill="#64748b" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  <circle cx={getX(hoveredIdx)} cy={getY(hoveredData.worstCase)} r="5" fill="var(--danger)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                </g>
              )}

              {/* X Axis Labels */}
              {forecast.forecastData.map((d, i) => (
                <text 
                  key={`lbl-${i}`} 
                  x={getX(i)} 
                  y={svgHeight - 12} 
                  textAnchor="middle" 
                  fill={hoveredIdx === i ? 'var(--text-primary)' : 'var(--text-muted)'} 
                  fontSize="10px" 
                  fontWeight={hoveredIdx === i ? '700' : '500'}
                >
                  {d.month}
                </text>
              ))}

              {/* Invisible interactive columns for easy keyboard navigation and hovering */}
              {forecast.forecastData.map((d, i) => (
                <rect 
                  key={`trigger-${i}`} 
                  x={getX(i) - (chartWidth / 10)} 
                  y={paddingTop} 
                  width={chartWidth / 5} 
                  height={chartHeight + 20} 
                  fill="transparent" 
                  style={{ cursor: 'pointer', outline: 'none' }}
                  tabIndex="0"
                  role="button"
                  aria-label={`Scenario projections for ${d.month}. Best Case: ${d.bestCase.toLocaleString()} kg, Baseline: ${d.baseline.toLocaleString()} kg, Worst Case: ${d.worstCase.toLocaleString()} kg.`}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(i)}
                  onBlur={() => setHoveredIdx(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setHoveredIdx(i);
                    }
                  }}
                />
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredIdx !== null && hoveredData && (
              <div 
                className="forecast-tooltip"
                style={{
                  left: `${Math.min(getX(hoveredIdx) + 10, svgWidth - 165)}px`,
                  top: `${Math.max(getY(hoveredData.baseline) - 95, 10)}px`
                }}
              >
                <div className="tooltip-title">{hoveredData.month} Projections</div>
                <div className="tooltip-row">
                  <span className="dot worst" /> Worst Case: 
                  <strong>{hoveredData.worstCase.toLocaleString()} kg</strong>
                </div>
                <div className="tooltip-row">
                  <span className="dot base" /> Baseline: 
                  <strong>{hoveredData.baseline.toLocaleString()} kg</strong>
                </div>
                <div className="tooltip-row best">
                  <span className="dot best" /> Best Case: 
                  <strong>{hoveredData.bestCase.toLocaleString()} kg</strong>
                </div>
                <div className="tooltip-divider" />
                <div className="tooltip-savings">
                  Potential Savings: <strong>{(hoveredData.baseline - hoveredData.bestCase).toLocaleString()} kg</strong>
                </div>
              </div>
            )}
            
          </div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
            Hover columns in the chart to inspect scenario emission levels and potential savings.
          </p>
        </div>

        {/* Right Side: Projections, Probability & Interventions */}
        <div className="forecast-analysis-section">
          
          <div className="forecast-metrics-row">
            
            {/* Goal Probability Indicator */}
            <div className="probability-card">
              <div className="probability-circle-holder">
                <svg width="84" height="84" className="probability-svg">
                  <circle cx="42" cy="42" r={ringRadius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                  <circle 
                    cx="42" 
                    cy="42" 
                    r={ringRadius} 
                    fill="transparent" 
                    stroke="var(--accent-green)" 
                    strokeWidth="6" 
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: '50% 50%',
                      transition: 'stroke-dashoffset 1s ease-out'
                    }}
                  />
                </svg>
                <div className="probability-percentage">
                  {forecast.goalProbability}
                  <span style={{ fontSize: '0.65rem' }}>%</span>
                </div>
              </div>
              <div className="probability-label">
                <span>Goal Achievement</span>
                <span className="sub">Probability of meeting 1.5°C target</span>
              </div>
            </div>

            {/* Trajectory / Reduction Potential */}
            <div className="metrics-column">
              <div className="metric-box">
                <span className="metric-tag">TRAJECTORY TREND</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  {forecast.trendDirection === 'down' ? (
                    <TrendingDown size={16} className="text-green" />
                  ) : forecast.trendDirection === 'up' ? (
                    <TrendingUp size={16} className="text-red" />
                  ) : (
                    <Activity size={16} style={{ color: 'var(--text-muted)' }} />
                  )}
                  <span className="metric-val" style={{ 
                    color: forecast.trendDirection === 'down' ? 'var(--accent-green)' : forecast.trendDirection === 'up' ? 'var(--danger)' : 'var(--text-secondary)'
                  }}>
                    {forecast.trend}
                  </span>
                </div>
              </div>

              <div className="metric-box">
                <span className="metric-tag">6-MONTH SAVINGS LIMIT</span>
                <div className="metric-val highlight">
                  -{forecast.reductionSavings.toLocaleString()} kg CO₂e
                </div>
              </div>
            </div>

          </div>

          {/* Recommended Interventions */}
          <div className="interventions-container">
            <div className="interventions-header">
              <Sparkles size={14} style={{ color: 'var(--accent-purple)' }} />
              <span>Recommended Interventions</span>
            </div>
            
            {sortedInterventions.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '5px 0 0 0' }}>
                Your footprint is already at minimum limits! Keep maintaining current levels.
              </p>
            ) : (
              <div className="interventions-list">
                {sortedInterventions.map((rec, i) => (
                  <div key={`int-${i}`} className="intervention-item">
                    <div className="intervention-info">
                      <div className="intervention-title">{rec.title}</div>
                      <div className="intervention-desc">{rec.text}</div>
                    </div>
                    <div className="intervention-badge">
                      -{rec.savings.toLocaleString()} kg
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

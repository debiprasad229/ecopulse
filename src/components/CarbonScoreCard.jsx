import { Award, Zap, Trees } from 'lucide-react';
import { getUnlockedBadges } from '../utils/carbonCalculations';

export default function CarbonScoreCard({ id, netFootprint = 0, baseline = 8000, xp = 0, completedHabits = {}, history = [], onClearHistory, challengeStats = {} }) {
  const tons = (netFootprint / 1000).toFixed(1);
  const percentChange = baseline > 0 
    ? Math.round(((netFootprint - baseline) / baseline) * 100) 
    : 0;

  // Calculate change vs initial baseline in history
  const initialEntry = history[history.length - 1];
  const initialFootprint = initialEntry ? initialEntry.footprint : baseline;
  const historyChange = initialFootprint > 0
    ? Math.round(((netFootprint - initialFootprint) / initialFootprint) * 100)
    : 0;

  const unlockedBadges = getUnlockedBadges(xp, completedHabits, challengeStats).filter(b => b.unlocked);

  // Dynamic comparison statement
  const targetDiff = netFootprint - 2000; // 2,000 kg is standard target for 1.5C warming path
  const isTargetAchieved = targetDiff <= 0;

  return (
    <div id={id} className="bento-card col-8" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-icon-wrapper">
              <Trees size={20} />
            </div>
            <h3 className="card-title">Carbon Scoreboard</h3>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 12px', borderRadius: '20px', color: 'var(--text-secondary)' }}>
            Annual Score
          </span>
        </div>

        <div className="scoreboard-stats">
          <div className="scoreboard-stats-item">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Net Footprint
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '3rem', fontWeight: '800', fontFamily: 'var(--font-heading)', lineHeight: '1', color: isTargetAchieved ? 'var(--success)' : 'var(--text-primary)' }}>
                {netFootprint.toLocaleString()}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                kg CO₂e/yr
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              ≈ {tons} metric tons per year
            </p>
          </div>

          <div className="scoreboard-stats-item">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status vs. Baseline
            </span>
            <div style={{ marginTop: '6px' }}>
              {percentChange < 0 ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)', padding: '6px 12px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '700' }}>
                  ↓ {Math.abs(percentChange)}% Reduction
                </div>
              ) : percentChange === 0 ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '700' }}>
                  Steady at Baseline
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)', padding: '6px 12px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '700' }}>
                  ↑ {percentChange}% Increase
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
              {isTargetAchieved ? (
                <span style={{ color: 'var(--success)', fontWeight: '600' }}>
                  ✓ Under the 2,000 kg global sustainability limit!
                </span>
              ) : (
                <span>
                  Needs to reduce by <strong>{targetDiff.toLocaleString()} kg</strong> to hit the 1.5°C global target (2,000 kg/yr).
                </span>
              )}
            </p>
          </div>

          {history.length > 1 && (
            <div className="scoreboard-stats-item">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Calculation History
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                {history.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{item.timestamp}</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>{item.footprint.toLocaleString()} kg</span>
                  </div>
                ))}
                
                {/* Overall comparison to initial calculation */}
                <div style={{ fontSize: '0.75rem', marginTop: '6px', color: historyChange < 0 ? 'var(--success)' : historyChange === 0 ? 'var(--text-muted)' : 'var(--danger)', fontWeight: '600' }}>
                  {historyChange < 0 ? (
                    <span>↓ {Math.abs(historyChange)}% vs. first baseline</span>
                  ) : historyChange === 0 ? (
                    <span>No change vs. first baseline</span>
                  ) : (
                    <span>↑ {historyChange}% vs. first baseline</span>
                  )}
                </div>

                {/* Clear History Button */}
                <button
                  type="button"
                  onClick={onClearHistory}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    marginTop: '10px',
                    padding: 0,
                    textDecoration: 'underline',
                    alignSelf: 'flex-start',
                    textAlign: 'left',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseOver={(e) => e.target.style.color = 'var(--danger)'}
                  onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
                >
                  Clear History
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gamification Summary Inside the Score Bento Card */}
      <div className="gamification-summary">
        <div className="summary-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={18} style={{ color: 'var(--accent-green)' }} />
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>Eco XP Points</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Earned from actions</p>
            </div>
          </div>
          <span className="xp-indicator" style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>
            {xp} XP
          </span>
        </div>

        <div className="divider" />

        <div className="summary-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={18} style={{ color: 'var(--accent-purple)' }} />
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>Badges Unlocked</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{unlockedBadges.length} Active achievements</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {unlockedBadges.slice(0, 3).map(badge => (
              <div 
                key={badge.id}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--accent-purple-glow)',
                  border: '1px solid var(--accent-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                  color: 'var(--accent-purple)',
                  fontWeight: 'bold',
                  cursor: 'help'
                }}
                title={`${badge.name}: ${badge.description}`}
              >
                ⭐
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

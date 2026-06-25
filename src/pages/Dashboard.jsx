import { useEcoPulse } from '../context/EcoPulseContext';
import EcoSphere from '../components/EcoSphere';
import CarbonScoreCard from '../components/CarbonScoreCard';
import CarbonScannerCard from '../components/CarbonScannerCard';

export default function Dashboard() {
  const {
    netFootprint,
    footprintBreakdown,
    totalOffsets,
    offsets,
    xp,
    completedHabits,
    challengeStats,
    history,
    token,
    saveInputs,
    handleClearHistory
  } = useEcoPulse();

  return (
    <div className="saas-page animate-page">
      <div className="saas-page-header">
        <h2 className="saas-page-title">Control Dashboard</h2>
        <p className="saas-page-subtitle">Real-time status of your carbon footprint and planetary ecosystem health.</p>
      </div>
      
      <div className="quick-stats-grid">
        <div className="stat-card">
          <span className="stat-label">Net Footprint</span>
          <span className="stat-value">{Math.round(netFootprint).toLocaleString()} kg/yr</span>
          <span className="stat-trend" style={{ color: netFootprint < footprintBreakdown.total ? 'var(--accent-green)' : 'var(--text-muted)' }}>
            {netFootprint < footprintBreakdown.total ? `↓ ${Math.round((footprintBreakdown.total - netFootprint) / footprintBreakdown.total * 100)}% vs baseline` : 'Baseline'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Offsets</span>
          <span className="stat-value">{Math.round(totalOffsets).toLocaleString()} kg/yr</span>
          <span className="stat-trend" style={{ color: 'var(--accent-blue)' }}>{Object.values(offsets).filter(v => v > 0).length} programs active</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Eco Score XP</span>
          <span className="stat-value">{xp} XP</span>
          <span className="stat-trend" style={{ color: 'var(--accent-purple)' }}>Level {Math.floor(xp / 100) + 1}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Actions Logged</span>
          <span className="stat-value">{Object.values(completedHabits || {}).reduce((a, b) => a + b, 0)} check-ins</span>
          <span className="stat-trend" style={{ color: 'var(--accent-orange)' }}>Streak: {challengeStats.streak || 0} Days</span>
        </div>
      </div>

      <div className="bento-grid dashboard-layout">
        <CarbonScoreCard 
          id="overview"
          netFootprint={netFootprint} 
          baseline={footprintBreakdown.total} 
          xp={xp}
          completedHabits={completedHabits}
          history={history}
          onClearHistory={handleClearHistory}
          challengeStats={challengeStats}
        />
        
        <EcoSphere 
          netFootprint={netFootprint} 
          baselineFootprint={footprintBreakdown.total} 
        />

        <CarbonScannerCard 
          id="scanner"
          inputs={useEcoPulse().inputs} 
          onUpdateInputs={saveInputs}
          token={token}
        />

        <div className="bento-card col-6 recent-activities-card">
          <h3 className="card-title">Recent Activity Logs</h3>
          <div className="activities-list">
            {history.length === 0 && Object.values(completedHabits || {}).reduce((a, b) => a + b, 0) === 0 ? (
              <p className="no-activities" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0' }}>No recent activity logged yet.</p>
            ) : (
              <>
                {history.slice(0, 3).map((h, i) => (
                   <div key={`hist-${i}`} className="activity-item">
                     <span className="activity-icon hist">📊</span>
                     <div className="activity-details">
                       <span className="activity-title">Baseline Footprint Calculated</span>
                       <span className="activity-desc">{Math.round(h.footprint).toLocaleString()} kg CO₂e/yr</span>
                     </div>
                     <span className="activity-time">{h.timestamp}</span>
                   </div>
                ))}
                {Object.entries(completedHabits || {}).filter((entry) => entry[1] > 0).slice(0, 3).map(([habitId, count]) => (
                   <div key={`habit-${habitId}`} className="activity-item">
                     <span className="activity-icon habit">🌱</span>
                     <div className="activity-details">
                       <span className="activity-title">Eco Action Completed</span>
                       <span className="activity-desc">Completed habit {habitId.replace('_', ' ')} ({count} times)</span>
                     </div>
                     <span className="activity-time">Active</span>
                   </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

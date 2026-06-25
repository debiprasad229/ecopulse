import { useEcoPulse } from '../context/EcoPulseContext';
import CarbonPersonalityCard from '../components/CarbonPersonalityCard';

export default function Profile() {
  const {
    personality,
    xp,
    setXp,
    addNotification,
    footprintBreakdown,
    netFootprint
  } = useEcoPulse();

  return (
    <div className="saas-page animate-page">
      <div className="saas-page-header">
        <h2 className="saas-page-title">Sustainability Profile</h2>
        <p className="saas-page-subtitle">Manage user preferences, accessibility preferences, and review achievements.</p>
      </div>

      <div className="bento-grid profile-layout">
        <div className="bento-card col-12 merged-sustainability-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <CarbonPersonalityCard 
            key={personality?.key || 'default'}
            personality={personality} 
            xp={xp} 
            setXp={setXp} 
            addNotification={addNotification}
          />

          <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '24px' }}>
            <div className="sustainability-score-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ flex: '1 1 300px' }}>
                <h3 className="card-title">Sustainability Grade</h3>
                <p className="score-desc" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                  Your target is to reduce emissions under 2,000 kg/yr to align with global warming targets.
                </p>
              </div>
              <div className="score-main" style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px' }}>
                <div className="score-details" style={{ textAlign: 'right' }}>
                  <span className="score-label">Neutrality Progress</span>
                  <span className="score-value" style={{ display: 'block', fontSize: '1.6rem', fontWeight: '800', marginTop: '4px' }}>
                    {footprintBreakdown.total > 0 
                      ? `${Math.round(Math.min(100, ((footprintBreakdown.total - netFootprint) / footprintBreakdown.total) * 100))}% Reduced` 
                      : '0% Reduced'}
                  </span>
                </div>
                <div className="grade-badge" style={{ width: '70px', height: '70px', fontSize: '2.5rem' }}>
                  {netFootprint < 2000 ? 'A+' : netFootprint < 4000 ? 'A' : netFootprint < 6000 ? 'B' : 'C'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

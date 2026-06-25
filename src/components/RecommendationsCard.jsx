import { Lightbulb, Info } from 'lucide-react';

export default function RecommendationsCard({ recommendations = [], onOpenCalculator }) {
  return (
    <div className="bento-card col-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="card-header" style={{ marginBottom: '15px' }}>
          <div className="card-title-group">
            <div className="card-icon-wrapper" style={{ color: 'var(--accent-orange)', background: 'rgba(245, 158, 11, 0.03)' }}>
              <Lightbulb size={20} />
            </div>
            <h3 className="card-title">Personalized Reduction Plan</h3>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="onboard-prompt">
            <p className="onboard-prompt-text">
              We need your profile details to generate a custom footprint reduction plan.
            </p>
            <button 
              type="button"
              className="btn btn-primary" 
              style={{ margin: '0 auto' }} 
              onClick={onOpenCalculator}
            >
              Start Estimation
            </button>
          </div>
        ) : (
          <div className="rec-list">
            {recommendations.map(rec => (
              <div key={rec.id} className="rec-item">
                <div className="rec-header">
                  <span className={`rec-badge ${rec.impact.toLowerCase()}`}>
                    {rec.impact} Impact
                  </span>
                  {rec.savings > 0 && (
                    <span className="rec-saving">
                      -{rec.savings.toLocaleString()} kg CO₂/yr
                    </span>
                  )}
                </div>
                <h4 className="rec-title">{rec.title}</h4>
                <p className="rec-text">{rec.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div 
          style={{ 
            borderTop: '1px solid var(--card-border)', 
            paddingTop: '15px', 
            marginTop: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}
        >
          <Info size={14} style={{ flexShrink: 0 }} />
          <span>Recommendations are prioritized based on categories with the highest potential savings.</span>
        </div>
      )}
    </div>
  );
}

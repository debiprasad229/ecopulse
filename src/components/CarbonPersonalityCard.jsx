import { useState } from 'react';
import { Award, Compass, Zap, Leaf, AlertCircle, CheckCircle2, XCircle, Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

const ICON_MAP = {
  warrior: Award,
  commuter: Compass,
  saver: Zap,
  minimalist: Leaf,
  intensive: AlertCircle
};

export default function CarbonPersonalityCard({ 
  personality, 
  setXp,
  addNotification
}) {
  const [challengeClaimed, setChallengeClaimed] = useState(() => {
    try {
      const stored = localStorage.getItem(`ecopulse_claimed_challenge_${personality?.key}`);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  if (!personality) return null;

  const BadgeIcon = ICON_MAP[personality.key] || Leaf;

  const handleClaimChallenge = () => {
    if (challengeClaimed) return;

    // Trigger premium confetti explosion if motion is not reduced
    const isReducedMotion = document.body.classList.contains('reduced-motion');
    if (!isReducedMotion) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b']
      });
    }

    // Award XP
    const reward = personality.challenge.xpReward || 30;
    setXp(prev => prev + reward);

    // Persist claimed state
    try {
      localStorage.setItem(`ecopulse_claimed_challenge_${personality.key}`, 'true');
      setChallengeClaimed(true);
    } catch (e) {
      console.error("Failed to save challenge status:", e);
    }

    // Trigger notification
    if (addNotification) {
      addNotification('Achievements', 'Personality Challenge Completed', `${personality.challenge.text} completed (+${reward} XP)`);
    }
  };

  // Determine progress bar color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--accent-green)';
    if (score >= 50) return 'var(--accent-blue)';
    if (score >= 30) return 'var(--accent-orange)';
    return 'var(--danger)';
  };

  return (
    <div className="personality-card-container">
      
      {/* Header */}
      <div className="card-header" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div className="card-title-group">
          <div className="card-icon-wrapper" style={{ color: 'var(--accent-purple)', background: 'rgba(139, 92, 246, 0.05)' }}>
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="card-title">Carbon Personality Profile</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Behavioral analysis of your carbon footprint and green habits
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="personality-layout-grid">
        
        {/* Left Side: Badge Presentation & Sustainability Score */}
        <div className="personality-badge-section">
          
          {/* Animated Badge */}
          <div className={`personality-badge-glow ${personality.badgeClass}`}>
            <div className="personality-badge-icon-holder">
              <BadgeIcon size={48} className="personality-badge-icon-spin" />
            </div>
            <h4 className="personality-badge-title">{personality.name}</h4>
          </div>

          {/* Sustainability Score Gauge */}
          <div className="sustainability-score-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Sustainability Index</span>
              <span style={{ 
                fontSize: '0.9rem', 
                fontWeight: '900', 
                color: getScoreColor(personality.sustainabilityScore)
              }}>
                {personality.sustainabilityScore}%
              </span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="personality-progress-container">
              <div 
                className="personality-progress-fill" 
                style={{ 
                  width: `${personality.sustainabilityScore}%`,
                  background: getScoreColor(personality.sustainabilityScore),
                  boxShadow: `0 0 10px ${getScoreColor(personality.sustainabilityScore)}`
                }}
              />
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.3' }}>
              Index increases as net footprint drops and XP rises. Complete the challenge to level up!
            </p>
          </div>

        </div>

        {/* Right Side: Detailed analysis (Strengths, Weaknesses, etc.) */}
        <div className="personality-info-section">
          
          <p className="personality-description">
            {personality.description}
          </p>

          <div className="personality-details-grid">
            
            {/* Strengths */}
            <div className="personality-detail-block">
              <div className="detail-block-header green">
                <CheckCircle2 size={15} />
                <span>Strengths</span>
              </div>
              <ul className="detail-list">
                {personality.strengths.map((str, i) => (
                  <li key={`str-${i}`}>{str}</li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="personality-detail-block">
              <div className="detail-block-header red">
                <XCircle size={15} />
                <span>Weaknesses</span>
              </div>
              <ul className="detail-list">
                {personality.weaknesses.map((weak, i) => (
                  <li key={`weak-${i}`}>{weak}</li>
                ))}
              </ul>
            </div>

            {/* Improvement Opportunities */}
            <div className="personality-detail-block">
              <div className="detail-block-header blue">
                <Sparkles size={15} />
                <span>Improvement Opportunities</span>
              </div>
              <ul className="detail-list opportunity-list">
                {personality.opportunities.map((opp, i) => (
                  <li key={`opp-${i}`}>{opp}</li>
                ))}
              </ul>
            </div>

            {/* Evolve Challenge (XP Integration) */}
            <div className="evolve-challenge-card" style={{ marginTop: 0 }}>
              <div className="challenge-header">
                <span className="challenge-tag">PERSONALITY CHALLENGE</span>
                <span className="challenge-xp">+{personality.challenge.xpReward} XP</span>
              </div>
              <p className="challenge-text">{personality.challenge.text}</p>
              <button 
                type="button" 
                className={`challenge-btn ${challengeClaimed ? 'claimed' : ''}`}
                onClick={handleClaimChallenge}
                disabled={challengeClaimed}
              >
                {challengeClaimed ? '✓ Challenge Completed' : 'Complete Challenge'}
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

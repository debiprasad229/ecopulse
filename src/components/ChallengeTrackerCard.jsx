import { useState } from 'react';
import { Trophy, Flame, Plus, Check, Sparkles, Target, Calendar, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { updateStreakOnClaim, INITIAL_CHALLENGES } from '../utils/challengeEngine';

export default function ChallengeTrackerCard({ 
  setXp, 
  completedHabits = {}, 
  offsets = {}, 
  challengeStats, 
  setChallengeStats,
  addNotification
}) {
  const [challenges, setChallenges] = useState(() => {
    try {
      const stored = localStorage.getItem('ecopulse_challenges_list');
      return stored ? JSON.parse(stored) : INITIAL_CHALLENGES;
    } catch {
      return INITIAL_CHALLENGES;
    }
  });

  // Calculate sum of active offsets and completed checklist habits
  const totalOffsets = (offsets.treesPlanted || 0) * 22 + (offsets.cleanEnergyFund || 0) * 5 + (offsets.plasticRemoved || 0) * 2;
  const habitCount = Object.values(completedHabits || {}).reduce((a, b) => a + b, 0);

  // Derive challenges with updated progress dynamically during render to avoid cascading re-renders
  const renderedChallenges = challenges.map(ch => {
    if (ch.id === 'monthly_offset') {
      return { ...ch, progress: Math.min(ch.goal, Math.round(totalOffsets)) };
    }
    if (ch.id === 'monthly_habits') {
      return { ...ch, progress: Math.min(ch.goal, habitCount) };
    }
    return ch;
  });

  // Save challenges list when manually modified
  const saveChallengesList = (updatedList) => {
    setChallenges(updatedList);
    try {
      localStorage.setItem('ecopulse_challenges_list', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save challenges:', e);
    }
  };

  // Increment progress for manual challenges
  const handleIncrement = (id, amount = 1) => {
    const updated = challenges.map(ch => {
      if (ch.id === id && !ch.claimed) {
        const newProgress = Math.min(ch.goal, ch.progress + amount);
        return { ...ch, progress: newProgress };
      }
      return ch;
    });
    saveChallengesList(updated);
  };

  // Claim XP Reward and update streak stats
  const handleClaimReward = (id, type, rewardXp) => {
    // 1. Trigger confetti blast if motion is not reduced
    const isReducedMotion = document.body.classList.contains('reduced-motion');
    if (!isReducedMotion) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // 2. Add XP
    setXp(prev => prev + rewardXp);

    // 3. Update Challenge Stats
    setChallengeStats(prev => {
      let updatedStats = { ...prev };
      if (type === 'daily') {
        // Daily challenge completion runs streak logic
        updatedStats = updateStreakOnClaim(prev);
      } else {
        // Weekly or Monthly completions increment totals without triggering streak
        updatedStats.completedTotal = (prev.completedTotal || 0) + 1;
      }
      localStorage.setItem('ecopulse_challenge_stats', JSON.stringify(updatedStats));
      return updatedStats;
    });

    // 4. Mark challenge as claimed
    const updated = challenges.map(ch => {
      if (ch.id === id) {
        return { ...ch, claimed: true };
      }
      return ch;
    });
    saveChallengesList(updated);

    // 5. Trigger notification
    if (addNotification) {
      const challenge = challenges.find(ch => ch.id === id);
      const challengeTitle = challenge ? challenge.title : 'Challenge';
      const typeLabel = type === 'daily' ? 'Daily' : (type === 'weekly' ? 'Weekly' : 'Monthly');
      addNotification('Challenges', `${typeLabel} Challenge Completed`, `${challengeTitle} completed (+${rewardXp} XP)`);
    }
  };

  // Reset challenges for testing
  const handleResetChallenges = () => {
    if (window.confirm('Reset all challenge progress and streaks?')) {
      const resetStats = { streak: 0, completedTotal: 0, lastCompletedDate: null };
      setChallengeStats(resetStats);
      localStorage.setItem('ecopulse_challenge_stats', JSON.stringify(resetStats));
      
      const resetList = INITIAL_CHALLENGES.map(ch => ({
        ...ch,
        progress: ch.id === 'monthly_offset' ? Math.min(ch.goal, Math.round(totalOffsets)) : (ch.id === 'monthly_habits' ? Math.min(ch.goal, habitCount) : 0),
        claimed: false
      }));
      saveChallengesList(resetList);
    }
  };

  // Filter challenges by type
  const dailies = renderedChallenges.filter(ch => ch.type === 'daily');
  const weeklies = renderedChallenges.filter(ch => ch.type === 'weekly');
  const monthlies = renderedChallenges.filter(ch => ch.type === 'monthly');

  return (
    <div className="bento-card col-12 challenge-card-container">
      
      {/* Header Panel */}
      <div className="challenge-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="card-icon-wrapper" style={{ background: 'rgba(234, 179, 8, 0.05)', color: 'var(--accent-orange)' }}>
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="card-title">Weekly Sustainability Challenges</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Complete challenges to earn XP and unlock legendary achievements
            </span>
          </div>
        </div>

        {/* Streak and Completion Counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          
          <div className={`streak-badge-flame ${challengeStats.streak > 0 ? 'active' : ''}`}>
            <Flame size={16} />
            <span>Streak: {challengeStats.streak || 0} {challengeStats.streak === 1 ? 'Day' : 'Days'}</span>
          </div>

          <div className="challenges-completed-indicator">
            <span>Completed: <strong>{challengeStats.completedTotal || 0}</strong></span>
          </div>

          <button 
            type="button" 
            className="challenge-reset-btn" 
            onClick={handleResetChallenges}
            title="Reset challenge list & streaks"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 3-Column List Grid */}
      <div className="challenge-columns-grid">
        
        {/* Daily Challenges */}
        <div className="challenge-column">
          <div className="column-title-row">
            <Clock size={15} style={{ color: 'var(--accent-orange)' }} />
            <span>Daily Challenges</span>
            <span className="column-sub">Resets daily</span>
          </div>
          <div className="challenge-list">
            {dailies.map(ch => (
              <ChallengeItem 
                key={ch.id} 
                challenge={ch} 
                onIncrement={() => handleIncrement(ch.id, 1)} 
                onClaim={() => handleClaimReward(ch.id, ch.type, ch.xpReward)}
              />
            ))}
          </div>
        </div>

        {/* Weekly Challenges */}
        <div className="challenge-column">
          <div className="column-title-row">
            <Calendar size={15} style={{ color: 'var(--accent-blue)' }} />
            <span>Weekly Challenges</span>
            <span className="column-sub">Resets Mondays</span>
          </div>
          <div className="challenge-list">
            {weeklies.map(ch => (
              <ChallengeItem 
                key={ch.id} 
                challenge={ch} 
                onIncrement={() => handleIncrement(ch.id, 1)} 
                onClaim={() => handleClaimReward(ch.id, ch.type, ch.xpReward)}
              />
            ))}
          </div>
        </div>

        {/* Monthly Goals */}
        <div className="challenge-column">
          <div className="column-title-row">
            <Target size={15} style={{ color: 'var(--accent-green)' }} />
            <span>Monthly Goals</span>
            <span className="column-sub">Resets 1st of month</span>
          </div>
          <div className="challenge-list">
            {monthlies.map(ch => (
              <ChallengeItem 
                key={ch.id} 
                challenge={ch} 
                // Monthly offsets and habits are read-only since they sync automatically
                onIncrement={ch.id === 'monthly_electricity' ? () => handleIncrement(ch.id, 1) : null}
                onClaim={() => handleClaimReward(ch.id, ch.type, ch.xpReward)}
                isSynced={ch.id === 'monthly_offset' || ch.id === 'monthly_habits'}
              />
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

// Challenge Row subcomponent
function ChallengeItem({ challenge, onIncrement, onClaim, isSynced = false }) {
  const isComplete = challenge.progress >= challenge.goal;
  const progressPercent = Math.min(100, Math.round((challenge.progress / challenge.goal) * 100));

  return (
    <div className={`challenge-item-box ${challenge.claimed ? 'claimed' : ''} ${isComplete && !challenge.claimed ? 'complete' : ''}`}>
      <div className="challenge-item-header">
        <span className="challenge-item-title">{challenge.title}</span>
        <span className="challenge-reward-tag">+{challenge.xpReward} XP</span>
      </div>

      {/* Progress metrics and indicator */}
      <div className="challenge-progress-container">
        <div className="challenge-progress-bar-track">
          <div 
            className="challenge-progress-bar-fill" 
            style={{ 
              width: `${progressPercent}%`,
              background: challenge.claimed 
                ? 'var(--text-muted)' 
                : (isComplete ? 'var(--accent-green)' : 'linear-gradient(90deg, var(--accent-blue) 0%, var(--accent-green) 100%)')
            }} 
          />
        </div>
        <div className="challenge-progress-numbers">
          <span>{challenge.progress} / {challenge.goal} {challenge.unit}s</span>
          <span>{progressPercent}%</span>
        </div>
      </div>

      {/* Actions (Increment / Claim Reward) */}
      <div className="challenge-actions-footer">
        {challenge.claimed ? (
          <span className="challenge-claimed-label">
            <Check size={12} /> Claimed
          </span>
        ) : isComplete ? (
          <button 
            type="button" 
            className="challenge-claim-reward-btn"
            onClick={onClaim}
          >
            <Sparkles size={12} /> Claim Reward
          </button>
        ) : (
          <>
            {onIncrement ? (
              <button 
                type="button" 
                className="challenge-increment-btn"
                onClick={onIncrement}
              >
                <Plus size={11} /> Log Progress
              </button>
            ) : isSynced ? (
              <span className="challenge-synced-badge">Auto-syncing values</span>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

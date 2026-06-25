import { useEcoPulse } from '../context/EcoPulseContext';
import ChallengeTrackerCard from '../components/ChallengeTrackerCard';
import HabitTrackerCard from '../components/HabitTrackerCard';

export default function Challenges() {
  const {
    xp,
    setXp,
    completedHabits,
    setCompletedHabits,
    offsets,
    challengeStats,
    setChallengeStats,
    addNotification,
    habitSavings,
    setHabitSavings
  } = useEcoPulse();

  return (
    <div className="saas-page animate-page">
      <div className="saas-page-header">
        <h2 className="saas-page-title">Sustainability Goals</h2>
        <p className="saas-page-subtitle">Tackle daily checklist tasks and unlock weekly milestone achievements.</p>
      </div>

      <div className="bento-grid challenges-layout">
        <ChallengeTrackerCard 
          xp={xp} 
          setXp={setXp} 
          completedHabits={completedHabits} 
          offsets={offsets} 
          challengeStats={challengeStats} 
          setChallengeStats={setChallengeStats} 
          addNotification={addNotification}
        />
        <HabitTrackerCard 
          id="habits"
          xp={xp} 
          setXp={setXp} 
          completedHabits={completedHabits} 
          setCompletedHabits={setCompletedHabits} 
          habitSavings={habitSavings} 
          setHabitSavings={setHabitSavings} 
          addNotification={addNotification}
        />

        <div className="bento-card col-6 badge-collection-card">
          <h3 className="card-title">Unlocked Badges & Credentials</h3>
          <div className="badges-grid-container">
            {[
              { id: 'starter', title: 'Eco Starter', desc: 'Unlocked at Level 1', check: true, icon: '🌱' },
              { id: 'pioneer', title: 'Green Pioneer', desc: 'Unlocked at Level 2', check: (Math.floor(xp / 100) + 1) >= 2, icon: '🚀' },
              { id: 'champion', title: 'Offset Champion', desc: 'Activate any carbon offset program', check: Object.values(offsets).some(v => v > 0), icon: '🌎' },
              { id: 'master', title: 'Habit Master', desc: 'Complete 5 or more eco actions', check: Object.values(completedHabits || {}).reduce((a, b) => a + b, 0) >= 5, icon: '👑' }
            ].map(badge => (
              <div key={badge.id} className={`badge-item ${badge.check ? 'unlocked' : 'locked'}`}>
                <div className="badge-icon-circle">
                  {badge.icon}
                </div>
                <div className="badge-info">
                  <h4 className="badge-title">{badge.title}</h4>
                  <p className="badge-desc">{badge.desc}</p>
                  <span className="badge-status-pill">{badge.check ? 'Unlocked' : 'Locked'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

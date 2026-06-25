import { CheckSquare, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

const HABITS = [
  {
    id: 'commute_green',
    title: 'Commute Green',
    desc: 'Walk, cycle, carpool, or take transit today instead of driving alone.',
    xp: 25,
    annualSaving: 520 // kg CO2e saved if done regularly (e.g. 2x a week for a year)
  },
  {
    id: 'eat_vegan_veg',
    title: 'Plant-Based Day',
    desc: 'Swap all meat meals for plant-based alternatives today.',
    xp: 30,
    annualSaving: 600
  },
  {
    id: 'unplug_unused',
    title: 'Phantom Power Sweep',
    desc: 'Unplug chargers, gaming systems, and TVs when not in use.',
    xp: 15,
    annualSaving: 120
  },
  {
    id: 'air_dry_laundry',
    title: 'Air-Dry Laundry',
    desc: 'Hang clothes to dry naturally instead of running the electric dryer.',
    xp: 20,
    annualSaving: 220
  },
  {
    id: 'cold_shower',
    title: 'Cold Quick Shower',
    desc: 'Keep your shower under 5 minutes and use lukewarm/cold water.',
    xp: 15,
    annualSaving: 180
  }
];

export default function HabitTrackerCard({ 
  id,
  setXp, 
  completedHabits = {}, 
  setCompletedHabits,
  habitSavings = 0,
  setHabitSavings,
  addNotification
}) {

  const handleToggleHabit = (habitId, isChecked, xpValue, annualSavingValue) => {
    // 1. Trigger Confetti celebration for positive reinforcement if motion is not reduced
    const isReducedMotion = document.body.classList.contains('reduced-motion');
    if (isChecked && !isReducedMotion) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#34d399', '#06b6d4', '#60a5fa']
      });
    }

    // 2. Update Completed Habits count
    setCompletedHabits(prev => {
      const currentCount = prev[habitId] || 0;
      return {
        ...prev,
        [habitId]: isChecked ? currentCount + 1 : Math.max(0, currentCount - 1)
      };
    });

    // 3. Update XP Points
    setXp(prev => (isChecked ? prev + xpValue : Math.max(0, prev - xpValue)));

    // 4. Update Projected Annual Carbon Savings
    setHabitSavings(prev => (isChecked ? prev + annualSavingValue : Math.max(0, prev - annualSavingValue)));

    // 5. Trigger notification
    if (isChecked && addNotification) {
      const habit = HABITS.find(h => h.id === habitId);
      const habitTitle = habit ? habit.title : 'Green Action';
      addNotification('Challenges', 'Daily Action Logged', `${habitTitle} completed (+${xpValue} XP)`);
    }
  };

  return (
    <div id={id} className="bento-card col-6" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="card-header" style={{ marginBottom: '15px' }}>
          <div className="card-title-group">
            <div className="card-icon-wrapper">
              <CheckSquare size={20} />
            </div>
            <h3 className="card-title">Daily Green Actions</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--accent-orange)', fontWeight: 'bold' }}>
            <Flame size={16} />
            <span>Streak: 3 Days</span>
          </div>
        </div>

        <div className="habit-list">
          {HABITS.map(habit => {
            // Check if habit is completed "at least once" in this session state for checkbox display
            const isCompletedThisSession = (completedHabits[habit.id] || 0) > 0;

            return (
              <div 
                key={habit.id} 
                className={`habit-item ${isCompletedThisSession ? 'completed' : ''}`}
              >
                <div className="habit-checkbox-wrapper">
                  <input
                    type="checkbox"
                    id={`habit-${habit.id}`}
                    className="habit-checkbox"
                    checked={isCompletedThisSession}
                    onChange={(e) => handleToggleHabit(habit.id, e.target.checked, habit.xp, habit.annualSaving)}
                    aria-label={`Mark habit "${habit.title}" as completed`}
                  />
                  <div className="habit-info">
                    <label htmlFor={`habit-${habit.id}`} className="habit-title" style={{ cursor: 'pointer' }}>
                      {habit.title}
                    </label>
                    <span className="habit-desc">{habit.desc}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className="habit-xp">+{habit.xp} XP</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    -{habit.annualSaving} kg/yr
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div 
        style={{ 
          borderTop: '1px solid var(--card-border)', 
          paddingTop: '15px', 
          marginTop: '15px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Session Habit Reduction:
        </span>
        <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--accent-green)', fontFamily: 'var(--font-heading)' }}>
          -{habitSavings.toLocaleString()} kg CO₂e/yr
        </span>
      </div>
    </div>
  );
}

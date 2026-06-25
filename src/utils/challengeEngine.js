/**
 * Sustainability Challenges Definitions & Calculations Engine
 */

export const INITIAL_CHALLENGES = [
  // Daily
  { 
    id: 'daily_plastic', 
    type: 'daily', 
    title: 'No plastic bottles today', 
    goal: 1, 
    progress: 0, 
    unit: 'day', 
    xpReward: 15, 
    claimed: false 
  },
  { 
    id: 'daily_unplug', 
    type: 'daily', 
    title: 'Unplug unused chargers/devices', 
    goal: 2, 
    progress: 0, 
    unit: 'times', 
    xpReward: 10, 
    claimed: false 
  },
  { 
    id: 'daily_veg', 
    type: 'daily', 
    title: 'Eat one vegetarian meal today', 
    goal: 1, 
    progress: 0, 
    unit: 'meal', 
    xpReward: 15, 
    claimed: false 
  },

  // Weekly
  { 
    id: 'weekly_walk', 
    type: 'weekly', 
    title: 'Walk or cycle 10 km this week', 
    goal: 10, 
    progress: 0, 
    unit: 'km', 
    xpReward: 50, 
    claimed: false 
  },
  { 
    id: 'weekly_reusable', 
    type: 'weekly', 
    title: 'Use reusable shopping bags', 
    goal: 5, 
    progress: 0, 
    unit: 'times', 
    xpReward: 40, 
    claimed: false 
  },
  { 
    id: 'weekly_shower', 
    type: 'weekly', 
    title: 'Limit showers to under 5 mins', 
    goal: 4, 
    progress: 0, 
    unit: 'times', 
    xpReward: 45, 
    claimed: false 
  },

  // Monthly
  { 
    id: 'monthly_offset', 
    type: 'monthly', 
    title: 'Offset 150 kg carbon in simulator', 
    goal: 150, 
    progress: 0, 
    unit: 'kg', 
    xpReward: 120, 
    claimed: false 
  },
  { 
    id: 'monthly_habits', 
    type: 'monthly', 
    title: 'Log 12 green habits in checklist', 
    goal: 12, 
    progress: 0, 
    unit: 'times', 
    xpReward: 150, 
    claimed: false 
  },
  { 
    id: 'monthly_electricity', 
    type: 'monthly', 
    title: 'Reduce electricity usage by 10% (10 logs)', 
    goal: 10, 
    progress: 0, 
    unit: 'logs', 
    xpReward: 130, 
    claimed: false 
  }
];

/**
 * Updates streak stats when a daily challenge is completed and claimed.
 * 
 * @param {Object} prevStats - Previous streak stats
 * @returns {Object} Updated streak stats
 */
export function updateStreakOnClaim(prevStats = {}) {
  const todayStr = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  let streak = prevStats.streak || 0;
  const completedTotal = (prevStats.completedTotal || 0) + 1;

  if (prevStats.lastCompletedDate === todayStr) {
    // Already claimed a daily challenge today, streak is maintained but not incremented again today
  } else if (prevStats.lastCompletedDate === yesterdayStr) {
    // Completed yesterday, streak continues!
    streak += 1;
  } else {
    // Break in streak, or initial run
    streak = 1;
  }

  return {
    streak,
    completedTotal,
    lastCompletedDate: todayStr
  };
}

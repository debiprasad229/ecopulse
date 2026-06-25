/**
 * Carbon Forecast Calculations Engine
 * Predicts monthly emissions trajectories for the next 6 months.
 */

export function generateForecast(history = [], netFootprint = 0, recommendations = [], completedHabits = {}, offsets = {}) {
  // 1. Generate month labels for the next 6 months
  const months = [];
  const currentDate = new Date();
  for (let i = 1; i <= 6; i++) {
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    months.push(nextMonth.toLocaleString('default', { month: 'short' }));
  }

  // 2. Analyze historical slope (if user has run calculations multiple times)
  let slope = 0;
  if (history && history.length > 1) {
    // History is sorted newest first. Let's trace older to newer.
    const oldest = history[history.length - 1].footprint || netFootprint;
    const newest = history[0].footprint || netFootprint;
    slope = (newest - oldest) / (history.length - 1);
  }

  // 3. Project monthly trajectories (Annualized Rate in kg CO2e/yr at that point in time)
  // Best case assumes user implements recommendations and continues active habits.
  const totalRecSavings = recommendations.reduce((acc, rec) => acc + (rec.savings || 0), 0);
  const monthlyRecSavings = Math.min(netFootprint * 0.45, totalRecSavings); // Cap recommendations impact at 45% reduction

  // Calculate habit-based savings
  const totalCompletedHabits = Object.values(completedHabits).reduce((a, b) => a + b, 0);
  const habitReductionAnnualRate = totalCompletedHabits * 40; // 40kg saved annually per logged habit

  const forecastData = [];
  months.forEach((month, index) => {
    const monthIndex = index + 1; // 1 to 6

    // Baseline: current net footprint with a small trend drift if history exists
    let baselineRate = netFootprint + (slope * monthIndex * 0.12);
    baselineRate = Math.max(1000, baselineRate);

    // Best Case: user reduces emissions using recommendations + habits + offsets
    // Accumulate reduction over time
    const recDeduction = monthlyRecSavings * (monthIndex / 6);
    const habitDeduction = habitReductionAnnualRate * (monthIndex / 6);
    const offsetBonus = ((offsets.treesPlanted || 0) * 22 + (offsets.cleanEnergyFund || 0) * 5) * 0.5 * (monthIndex / 6);
    
    let bestRate = netFootprint - (recDeduction + habitDeduction + offsetBonus);
    bestRate = Math.max(800, bestRate); // Minimum floor for human baseline emissions

    // Worst Case: user increases travel or heating, showing a +15% upward drift over 6 months
    let worstRate = netFootprint * (1 + (0.025 * monthIndex));
    worstRate = Math.max(netFootprint, worstRate);

    forecastData.push({
      month,
      baseline: Math.round(baselineRate),
      bestCase: Math.round(bestRate),
      worstCase: Math.round(worstRate)
    });
  });

  // 4. Trend Analysis Description
  let trend = 'Stable Trajectory';
  let trendDirection = 'flat';
  if (slope < -120) {
    trend = 'Steadily Decreasing';
    trendDirection = 'down';
  } else if (slope > 120) {
    trend = 'Steadily Increasing';
    trendDirection = 'up';
  } else if (!history || history.length <= 1) {
    trend = 'Initial Baseline (No Trend)';
    trendDirection = 'none';
  }

  // 5. Reduction Projection (Kg CO2e saved in Month 6 in Best Case vs Baseline)
  const reductionSavings = Math.round(forecastData[5].baseline - forecastData[5].bestCase);

  // 6. Goal Achievement Probability (Target: 2,000 kg CO2e/yr limit)
  let probability;
  const diffToTarget = netFootprint - 2000;

  if (diffToTarget <= 0) {
    probability = 95; // Already meeting the target
  } else {
    // Probability decreases the further they are from target, but increases with recommendations and negative slope
    const scale = Math.max(0, 1 - (diffToTarget / 7500)); // 0 (far) to 1 (close)
    const recFactor = Math.min(0.25, recommendations.length * 0.06);
    const trendFactor = slope < 0 ? 0.15 : slope > 0 ? -0.15 : 0;
    
    probability = Math.round((scale * 0.55 + recFactor + trendFactor + 0.15) * 100);
    probability = Math.max(8, Math.min(92, probability)); // Restrict to realistic bounds (8% to 92%)
  }

  return {
    forecastData,
    trend,
    trendDirection,
    reductionSavings,
    goalProbability: probability
  };
}

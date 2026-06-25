/**
 * Carbon Footprint Calculation Utilities
 * Based on empirical coefficients from IPCC and EPA databases.
 * Values represent annual emissions in kilograms of CO2 equivalent (kg CO2e).
 */

export const EMISSION_FACTORS = {
  transport: {
    gasoline: 0.22,   // kg CO2e per km
    hybrid: 0.11,     // kg CO2e per km
    electric: 0.05,   // kg CO2e per km (grid mix average)
    transit: 0.08,    // kg CO2e per km (bus/train average)
    motorbike: 0.14,  // kg CO2e per km
    none: 0.00        // Walking/cycling
  },
  flights: 90,        // kg CO2e per flight hour
  electricity: 0.38,  // kg CO2e per kWh (US grid average)
  heating: {
    gas: 2000,
    oil: 3500,
    heatpump: 500,
    wood: 1500,
    none: 0
  },
  diet: {
    vegan: 1000,
    vegetarian: 1500,
    lowMeat: 2200,
    heavyMeat: 3300
  },
  shopping: {
    minimalist: 500,
    average: 1200,
    consumerist: 2500
  },
  offsets: {
    trees: 22,        // kg CO2e offset per tree per year
    cleanEnergy: 5,   // kg CO2e offset per dollar invested
    plasticCleanup: 2  // kg CO2e offset per kg of plastic removed
  }
};

/**
 * Calculates the annual carbon footprint in kg CO2e.
 * 
 * @param {Object} inputs - The user inputs from onboarding
 * @param {number} inputs.commuteDistance - Weekly commute distance in km
 * @param {string} inputs.transportType - Fuel type ('gasoline', 'hybrid', 'electric', 'transit', 'none')
 * @param {number} inputs.flightHours - Annual flight hours
 * @param {number} inputs.electricityKwh - Monthly electricity usage in kWh
 * @param {number} inputs.greenEnergyShare - Percentage of green energy usage (0 - 100)
 * @param {string} inputs.heatingSource - Heating type ('gas', 'oil', 'heatpump', 'wood', 'none')
 * @param {string} inputs.dietType - Eating habit ('vegan', 'vegetarian', 'lowMeat', 'heavyMeat')
 * @param {string} inputs.shoppingHabit - Purchase style ('minimalist', 'average', 'consumerist')
 * @param {boolean} inputs.recycles - Whether the user recycles consistently
 * @returns {Object} Calculated emissions broken down by category, and the total
 */
export function calculateFootprint(inputs) {
  // Validate inputs to avoid negative numbers or security issues (outliers)
  const commuteDistance = Math.max(0, parseFloat(inputs.commuteDistance) || 0);
  const flightHours = Math.max(0, parseFloat(inputs.flightHours) || 0);
  const electricityKwh = Math.max(0, parseFloat(inputs.electricityKwh) || 0);
  const greenEnergyShare = Math.min(100, Math.max(0, parseFloat(inputs.greenEnergyShare) || 0));

  // 1. Transport Emissions (Annual = Weekly * 52)
  const transportFactor = EMISSION_FACTORS.transport[inputs.transportType] || EMISSION_FACTORS.transport.none;
  const commuteEmissions = commuteDistance * 52 * transportFactor;
  const flightEmissions = flightHours * EMISSION_FACTORS.flights;
  const totalTransport = commuteEmissions + flightEmissions;

  // 2. Home Energy Emissions (Annual)
  const baseElectricityEmissions = electricityKwh * 12 * EMISSION_FACTORS.electricity;
  const electricityEmissions = baseElectricityEmissions * (1 - greenEnergyShare / 100);
  const heatingEmissions = EMISSION_FACTORS.heating[inputs.heatingSource] || 0;
  const totalEnergy = electricityEmissions + heatingEmissions;

  // 3. Diet Emissions (Annual)
  const totalDiet = EMISSION_FACTORS.diet[inputs.dietType] || EMISSION_FACTORS.diet.lowMeat;

  // 4. Shopping & Waste Emissions (Annual)
  let shoppingEmissions = EMISSION_FACTORS.shopping[inputs.shoppingHabit] || EMISSION_FACTORS.shopping.average;
  if (inputs.recycles) {
    shoppingEmissions = Math.max(200, shoppingEmissions - 300); // 300kg credit for recycling
  }
  const totalShopping = shoppingEmissions;

  // Total
  const total = totalTransport + totalEnergy + totalDiet + totalShopping;

  return {
    transport: Math.round(totalTransport),
    energy: Math.round(totalEnergy),
    diet: Math.round(totalDiet),
    shopping: Math.round(totalShopping),
    total: Math.round(total)
  };
}

/**
 * Calculates offsets in kg CO2e
 * 
 * @param {Object} offsets - User offset actions
 * @param {number} offsets.treesPlanted - Number of trees planted
 * @param {number} offsets.cleanEnergyFund - Dollars funded
 * @param {number} offsets.plasticRemoved - kg of plastic removed
 * @returns {number} Total kg CO2 offset
 */
export function calculateOffsets(offsets) {
  const trees = Math.max(0, parseInt(offsets.treesPlanted) || 0);
  const funding = Math.max(0, parseFloat(offsets.cleanEnergyFund) || 0);
  const plastic = Math.max(0, parseFloat(offsets.plasticRemoved) || 0);

  const treesOffset = trees * EMISSION_FACTORS.offsets.trees;
  const fundingOffset = funding * EMISSION_FACTORS.offsets.cleanEnergy;
  const plasticOffset = plastic * EMISSION_FACTORS.offsets.plasticCleanup;

  return Math.round(treesOffset + fundingOffset + plasticOffset);
}

/**
 * Generates personalized actionable insights based on carbon footprint segments.
 * 
 * @param {Object} inputs - Raw user inputs
 * @param {Object} results - Calculated footprint categories
 * @returns {Array<Object>} List of recommendation objects
 */
export function getRecommendations(inputs, results) {
  const recommendations = [];

  // Transport Recommendations
  if (results.transport > 3000) {
    if (inputs.transportType === 'gasoline') {
      recommendations.push({
        id: 'rec_hybrid_ev',
        category: 'transport',
        impact: 'High',
        title: 'Switch to a Hybrid or Electric Vehicle',
        text: 'Transitioning from gasoline to hybrid or electric can cut your commute emissions by 50% to 75% immediately.',
        savings: Math.round(inputs.commuteDistance * 52 * (0.22 - 0.05))
      });
    }
    if (inputs.commuteDistance > 100) {
      recommendations.push({
        id: 'rec_transit_carpool',
        category: 'transport',
        impact: 'High',
        title: 'Use Public Transit or Carpool',
        text: 'Taking the train or sharing a ride for just 2 days a week will significantly reduce your high transport footprint.',
        savings: Math.round((inputs.commuteDistance * 52 * 0.4) * (EMISSION_FACTORS.transport[inputs.transportType] || 0.22))
      });
    }
  }

  if (inputs.flightHours > 10) {
    recommendations.push({
      id: 'rec_flights',
      category: 'transport',
      impact: 'High',
      title: 'Reduce Long-Haul Air Travel',
      text: 'Consider high-speed rail for domestic trips, or conduct meetings virtually where possible to reduce flying time.',
      savings: Math.round(5 * EMISSION_FACTORS.flights) // 5 hours reduction example
    });
  }

  // Energy Recommendations
  if (inputs.greenEnergyShare < 50 && inputs.electricityKwh > 100) {
    recommendations.push({
      id: 'rec_green_energy',
      category: 'energy',
      impact: 'High',
      title: 'Switch to Green Energy tariffs',
      text: 'Ask your utility provider for 100% renewable electricity. This is often a zero-setup transition.',
      savings: Math.round(inputs.electricityKwh * 12 * EMISSION_FACTORS.electricity * 0.8)
    });
  }

  if (inputs.heatingSource === 'oil' || inputs.heatingSource === 'gas') {
    recommendations.push({
      id: 'rec_heatpump',
      category: 'energy',
      impact: 'High',
      title: 'Upgrade to a Heat Pump',
      text: 'Transitioning from gas or fuel oil to an electric heat pump reduces home heating emissions by up to 80%.',
      savings: inputs.heatingSource === 'oil' ? 3000 : 1500
    });
  }

  // Diet Recommendations
  if (inputs.dietType === 'heavyMeat') {
    recommendations.push({
      id: 'rec_diet_meatless',
      category: 'diet',
      impact: 'Medium',
      title: 'Try Meatless Mondays',
      text: 'Reducing red meat consumption to just 3 days a week lowers your dietary emissions significantly.',
      savings: 600
    });
  } else if (inputs.dietType === 'lowMeat') {
    recommendations.push({
      id: 'rec_diet_veg',
      category: 'diet',
      impact: 'Medium',
      title: 'Transition to Vegetarianism',
      text: 'Focusing on a cheese and vegetable diet rather than poultry/fish saves another 700kg of CO2 per year.',
      savings: 700
    });
  }

  // Shopping & Waste Recommendations
  if (inputs.shoppingHabit === 'consumerist') {
    recommendations.push({
      id: 'rec_shopping_thrift',
      category: 'shopping',
      impact: 'Medium',
      title: 'Buy Vintage or Second-hand',
      text: 'Choosing thrift stores or renting electronics and formal wear lowers manufacturing demand.',
      savings: 1000
    });
  }
  if (!inputs.recycles) {
    recommendations.push({
      id: 'rec_recycle',
      category: 'shopping',
      impact: 'Medium',
      title: 'Start Composting & Recycling',
      text: 'Recycling plastic, glass, and metal paper keeps material out of landfills and reduces raw mining.',
      savings: 300
    });
  }

  // Fallback if footprint is already very low
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec_advocate',
      category: 'diet',
      impact: 'Low',
      title: 'Community Environmental Advocacy',
      text: 'Your personal footprint is exemplary. Help local schools or councils install solar panels or community gardens.',
      savings: 100
    });
  }

  return recommendations;
}

/**
 * Checks for badge achievements based on habits completed and total XP.
 * 
 * @param {number} xp - Current user XP
 * @param {Object} completedHabits - Object mapping habit IDs to counts or booleans
 * @returns {Array<Object>} Unlocked badges
 */
export function getUnlockedBadges(xp, completedHabits = {}, challengeStats = {}) {
  const { streak = 0, completedTotal = 0 } = challengeStats || {};

  const badges = [
    {
      id: 'badge_newbie',
      name: 'Eco Seedling',
      description: 'Sign up and calculate your baseline carbon footprint.',
      icon: 'Sprout',
      unlocked: true // Initial badge
    },
    {
      id: 'badge_xp_100',
      name: 'Eco Guardian',
      description: 'Reach 100 XP from daily green actions.',
      icon: 'ShieldAlert',
      unlocked: xp >= 100
    },
    {
      id: 'badge_xp_500',
      name: 'Carbon Warrior',
      description: 'Reach 500 XP through sustained green choices.',
      icon: 'Zap',
      unlocked: xp >= 500
    },
    {
      id: 'badge_transit',
      name: 'Transit Champion',
      description: 'Log 5 public transit or walking habits.',
      icon: 'Footprints',
      unlocked: (completedHabits.commute_green || 0) >= 5
    },
    {
      id: 'badge_diet',
      name: 'Plant-Powered',
      description: 'Log 5 meatless or zero-waste meals.',
      icon: 'Salad',
      unlocked: (completedHabits.eat_vegan_veg || 0) >= 5
    },
    {
      id: 'badge_energy',
      name: 'Watt Saver',
      description: 'Log 5 home energy-saving activities.',
      icon: 'Lightbulb',
      unlocked: (completedHabits.unplug_unused || 0) >= 5
    },
    {
      id: 'badge_streak_5',
      name: 'Streak Master',
      description: 'Maintain a 5-day daily challenge streak.',
      icon: 'Flame',
      unlocked: streak >= 5
    },
    {
      id: 'badge_challenges_10',
      name: 'Eco Champion',
      description: 'Complete 10 daily, weekly, or monthly sustainability challenges.',
      icon: 'Trophy',
      unlocked: completedTotal >= 10
    }
  ];

  return badges;
}

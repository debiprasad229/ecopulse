/**
 * Carbon Personality Engine
 * Calculates a user's sustainability profile based on footprints, habits, offsets, and XP.
 */

const PERSONALITY_DETAILS = {
  warrior: {
    name: 'Eco Warrior',
    badgeClass: 'badge-warrior',
    description: 'You are an exemplary guardian of the biosphere. By combining low personal footprint choices, daily green habits, and active carbon offsetting, you lead the charge toward a net-zero future.',
    strengths: [
      'Very low net carbon footprint',
      'Consistent engagement in daily eco-habits',
      'Active commitment to carbon offset initiatives'
    ],
    weaknesses: [
      'Minimal remaining areas for direct emissions cuts',
      'Susceptibility to environmental anxiety or burn-out'
    ],
    opportunities: [
      'Focus on community organizing and local advocacy',
      'Encourage friends and family to calculate their footprints',
      'Support larger-scale systemic climate action campaigns'
    ],
    challenge: {
      text: 'Log a new offset donation or reach the next XP level to maintain your Eco Warrior status.',
      xpReward: 50
    }
  },
  commuter: {
    name: 'Conscious Commuter',
    badgeClass: 'badge-commuter',
    description: 'You are a master of sustainable movement. You excel at keeping transport emissions low by choosing walking, cycling, electric vehicles, or public transit over fossil-fueled single-occupancy trips.',
    strengths: [
      'Highly optimized travel and commute footprint',
      'Strong preference for active or public transit options',
      'Minimized air travel impact'
    ],
    weaknesses: [
      'Potential carbon locks in other areas (e.g. food, home energy)',
      'Weather and geographical dependency for active commutes'
    ],
    opportunities: [
      'Switch home electricity mix to 100% renewable energy',
      'Explore meatless dining alternatives to compound your impact',
      'Upgrade home insulation or switch to smart heating controls'
    ],
    challenge: {
      text: 'Log 3 "Commute Green" habits this week to earn bonus XP and keep your travel clean.',
      xpReward: 30
    }
  },
  saver: {
    name: 'Energy Saver',
    badgeClass: 'badge-saver',
    description: 'You keep a tight grip on utilities and home resources. By maximizing renewable grid options, using heat pumps, and managing power consumption, you run a highly carbon-efficient household.',
    strengths: [
      'Highly optimized home utility and heating emissions',
      'Excellent adoption of renewable power sources',
      'Consistent habit of unplugging standby appliances'
    ],
    weaknesses: [
      'High transportation or travel emissions',
      'Potential insulation gaps in older building frameworks'
    ],
    opportunities: [
      'Swap one car commute per week for public transit or carpooling',
      'Choose low-emissions shipping options for online purchases',
      'Incorporate more plant-based meals into your weekly diet'
    ],
    challenge: {
      text: 'Log 3 "Phantom Power Sweep" habits to secure an energy efficiency streak!',
      xpReward: 25
    }
  },
  minimalist: {
    name: 'Green Minimalist',
    badgeClass: 'badge-minimalist',
    description: 'You focus on the circular economy and low-impact lifestyle choices. By purchasing second-hand, recycling systematically, and eating a mostly plant-based diet, you minimize consumer waste.',
    strengths: [
      'Minimal diet and shopping footprints',
      'Diligent recycling and composting habits',
      'High awareness of the lifecycle of consumer items'
    ],
    weaknesses: [
      'Indirect emissions from essential home heating or necessary long travel',
      'Difficult to offset embedded emissions of absolute necessities'
    ],
    opportunities: [
      'Switch utility provider to a green tariff power option',
      'Support active forest restoration to offset your essential baseline',
      'Advocate for waste reduction in your workplace or local community'
    ],
    challenge: {
      text: 'Complete 3 "Plant-Based Day" habits to strengthen your green diet streak!',
      xpReward: 30
    }
  },
  intensive: {
    name: 'Carbon Intensive',
    badgeClass: 'badge-intensive',
    description: 'Your carbon footprint currently exceeds the global target limit. This is driven by high emissions from commuting, flights, heating fuels, or consumption habits.',
    strengths: [
      'Highest absolute potential for carbon reduction',
      'Major positive impact can be made with single decisions'
    ],
    weaknesses: [
      'High transport emissions (gasoline commutes or flight hours)',
      'High household energy consumption and fossil fuel heating',
      'High dietary emissions (regular red meat consumption)'
    ],
    opportunities: [
      'Switch to a hybrid/electric vehicle or transit once a week',
      'Switch home utility mix to renewable or green energy',
      'Try introducing a few meat-free days into your week'
    ],
    challenge: {
      text: 'Log any green habit or complete onboarding offsets to begin your journey to a cleaner profile!',
      xpReward: 40
    }
  }
};

export function calculatePersonality(inputs, footprintBreakdown, netFootprint, xp, completedHabits, offsets) {
  if (!inputs) return null;

  const totalEmissions = footprintBreakdown?.total || 0;
  const transportEmissions = footprintBreakdown?.transport || 0;
  const energyEmissions = footprintBreakdown?.energy || 0;
  const dietEmissions = footprintBreakdown?.diet || 0;
  const shoppingEmissions = footprintBreakdown?.shopping || 0;

  const scores = {
    warrior: 0,
    commuter: 0,
    saver: 0,
    minimalist: 0,
    intensive: 0
  };

  // 1. Carbon Intensive Lifestyle
  scores.intensive += totalEmissions / 1500;
  if (totalEmissions > 7500) scores.intensive += 4;
  if (inputs.transportType === 'gasoline' && inputs.commuteDistance > 80) scores.intensive += 2;
  if (inputs.flightHours > 15) scores.intensive += 3;
  if (inputs.dietType === 'heavyMeat') scores.intensive += 2;

  // 2. Eco Warrior
  if (netFootprint < 3800) scores.warrior += 4;
  if (netFootprint < 2200) scores.warrior += 3;
  if (xp >= 150) scores.warrior += 2;
  if (xp >= 400) scores.warrior += 2;
  const offsetCount = (offsets?.treesPlanted || 0) + (offsets?.cleanEnergyFund || 0) / 10 + (offsets?.plasticRemoved || 0) / 5;
  if (offsetCount > 0) scores.warrior += 2;
  if (offsetCount > 8) scores.warrior += 2;

  // 3. Conscious Commuter
  if (['none', 'transit', 'electric', 'hybrid'].includes(inputs.transportType)) scores.commuter += 4;
  if (inputs.transportType === 'none') scores.commuter += 2;
  if (completedHabits?.commute_green > 0) scores.commuter += completedHabits.commute_green * 0.8;
  if (transportEmissions < totalEmissions * 0.25) scores.commuter += 2;

  // 4. Energy Saver
  if (inputs.greenEnergyShare >= 50) scores.saver += 3;
  if (inputs.greenEnergyShare >= 90) scores.saver += 2;
  if (['heatpump', 'none'].includes(inputs.heatingSource)) scores.saver += 2;
  if (inputs.electricityKwh <= 150) scores.saver += 2;
  if (completedHabits?.unplug_unused > 0) scores.saver += completedHabits.unplug_unused * 0.8;
  if (energyEmissions < totalEmissions * 0.28) scores.saver += 2;

  // 5. Green Minimalist
  if (inputs.shoppingHabit === 'minimalist') scores.minimalist += 4;
  if (inputs.recycles) scores.minimalist += 2;
  if (['vegan', 'vegetarian'].includes(inputs.dietType)) scores.minimalist += 3;
  if (completedHabits?.eat_vegan_veg > 0) scores.minimalist += completedHabits.eat_vegan_veg * 0.8;
  if (shoppingEmissions + dietEmissions < totalEmissions * 0.45) scores.minimalist += 2;

  // Select highest score (with priorities to break ties)
  let maxScore = -1;
  let personalityKey = 'intensive';

  const order = ['warrior', 'commuter', 'saver', 'minimalist', 'intensive'];
  order.forEach(key => {
    if (scores[key] > maxScore) {
      maxScore = scores[key];
      personalityKey = key;
    }
  });

  // Calculate a Sustainability score (10 - 100) combining footprint and XP
  const sustainabilityScore = Math.max(10, Math.min(100, Math.round(100 - (netFootprint / 150) + (xp / 10))));

  return {
    key: personalityKey,
    sustainabilityScore,
    ...PERSONALITY_DETAILS[personalityKey]
  };
}

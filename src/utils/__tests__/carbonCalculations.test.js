/**
 * Unit Tests for carbonCalculations.js
 * Tests: calculateFootprint, calculateOffsets, getRecommendations, getUnlockedBadges
 */
import { describe, it, expect } from 'vitest';
import {
  calculateFootprint,
  calculateOffsets,
  getRecommendations,
  getUnlockedBadges,
  EMISSION_FACTORS
} from '../carbonCalculations';

// ============================================================
// calculateFootprint()
// ============================================================
describe('calculateFootprint', () => {
  const DEFAULT_INPUTS = {
    commuteDistance: 30,
    transportType: 'gasoline',
    flightHours: 5,
    electricityKwh: 200,
    greenEnergyShare: 0,
    heatingSource: 'gas',
    dietType: 'lowMeat',
    shoppingHabit: 'average',
    recycles: true
  };

  it('returns an object with transport, energy, diet, shopping, and total', () => {
    const result = calculateFootprint(DEFAULT_INPUTS);
    expect(result).toHaveProperty('transport');
    expect(result).toHaveProperty('energy');
    expect(result).toHaveProperty('diet');
    expect(result).toHaveProperty('shopping');
    expect(result).toHaveProperty('total');
  });

  it('total equals sum of all categories', () => {
    const r = calculateFootprint(DEFAULT_INPUTS);
    expect(r.total).toBe(r.transport + r.energy + r.diet + r.shopping);
  });

  // Transport
  it('calculates gasoline commute emissions correctly', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, flightHours: 0 });
    // 30km * 52weeks * 0.22 = 343.2 → rounded 343
    expect(r.transport).toBe(Math.round(30 * 52 * 0.22));
  });

  it('calculates electric commute emissions correctly', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, transportType: 'electric', flightHours: 0 });
    expect(r.transport).toBe(Math.round(30 * 52 * 0.05));
  });

  it('walk/cycle produces zero transport emissions (no flights)', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, transportType: 'none', flightHours: 0 });
    expect(r.transport).toBe(0);
  });

  it('adds flight emissions correctly', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, transportType: 'none', flightHours: 10 });
    // 10 * 90 = 900
    expect(r.transport).toBe(900);
  });

  // Energy
  it('calculates electricity emissions with no green energy', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, greenEnergyShare: 0, heatingSource: 'none' });
    // 200kWh * 12months * 0.38 = 912
    expect(r.energy).toBe(Math.round(200 * 12 * 0.38));
  });

  it('reduces electricity emissions with green energy share', () => {
    const full = calculateFootprint({ ...DEFAULT_INPUTS, greenEnergyShare: 0, heatingSource: 'none' });
    const half = calculateFootprint({ ...DEFAULT_INPUTS, greenEnergyShare: 50, heatingSource: 'none' });
    expect(half.energy).toBe(Math.round(full.energy / 2));
  });

  it('100% green energy zeroes electricity emissions', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, greenEnergyShare: 100, heatingSource: 'none' });
    expect(r.energy).toBe(0);
  });

  it('includes heating emissions for gas', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, greenEnergyShare: 100, heatingSource: 'gas' });
    expect(r.energy).toBe(EMISSION_FACTORS.heating.gas);
  });

  it('includes heating emissions for oil', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, greenEnergyShare: 100, heatingSource: 'oil' });
    expect(r.energy).toBe(EMISSION_FACTORS.heating.oil);
  });

  // Diet
  it('returns correct diet emissions for vegan', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, dietType: 'vegan' });
    expect(r.diet).toBe(EMISSION_FACTORS.diet.vegan);
  });

  it('returns correct diet emissions for heavyMeat', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, dietType: 'heavyMeat' });
    expect(r.diet).toBe(EMISSION_FACTORS.diet.heavyMeat);
  });

  // Shopping
  it('applies recycling credit to shopping emissions', () => {
    const withRecycle = calculateFootprint({ ...DEFAULT_INPUTS, shoppingHabit: 'average', recycles: true });
    const withoutRecycle = calculateFootprint({ ...DEFAULT_INPUTS, shoppingHabit: 'average', recycles: false });
    expect(withRecycle.shopping).toBeLessThan(withoutRecycle.shopping);
  });

  it('minimalist + recycles results in floor of 200 kg', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, shoppingHabit: 'minimalist', recycles: true });
    // 500 - 300 = 200, Math.max(200, 200) = 200
    expect(r.shopping).toBe(200);
  });

  it('consumerist without recycling returns full value', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, shoppingHabit: 'consumerist', recycles: false });
    expect(r.shopping).toBe(EMISSION_FACTORS.shopping.consumerist);
  });

  // Edge cases
  it('handles zero inputs gracefully', () => {
    const r = calculateFootprint({
      commuteDistance: 0, transportType: 'none', flightHours: 0,
      electricityKwh: 0, greenEnergyShare: 0, heatingSource: 'none',
      dietType: 'vegan', shoppingHabit: 'minimalist', recycles: true
    });
    expect(r.transport).toBe(0);
    expect(r.energy).toBe(0);
    expect(r.total).toBeGreaterThanOrEqual(0);
  });

  it('clamps negative values to zero', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, commuteDistance: -50, flightHours: -10 });
    expect(r.transport).toBeGreaterThanOrEqual(0);
  });

  it('handles NaN string inputs by treating as 0', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, commuteDistance: 'abc', flightHours: undefined });
    expect(r.transport).toBeGreaterThanOrEqual(0);
  });

  it('caps green energy share at 100%', () => {
    const r = calculateFootprint({ ...DEFAULT_INPUTS, greenEnergyShare: 200, heatingSource: 'none' });
    expect(r.energy).toBe(0);
  });

  it('all values are rounded integers', () => {
    const r = calculateFootprint(DEFAULT_INPUTS);
    expect(Number.isInteger(r.transport)).toBe(true);
    expect(Number.isInteger(r.energy)).toBe(true);
    expect(Number.isInteger(r.diet)).toBe(true);
    expect(Number.isInteger(r.shopping)).toBe(true);
    expect(Number.isInteger(r.total)).toBe(true);
  });
});

// ============================================================
// calculateOffsets()
// ============================================================
describe('calculateOffsets', () => {
  it('calculates tree offsets correctly', () => {
    const result = calculateOffsets({ treesPlanted: 10, cleanEnergyFund: 0, plasticRemoved: 0 });
    expect(result).toBe(10 * 22);
  });

  it('calculates clean energy offsets correctly', () => {
    const result = calculateOffsets({ treesPlanted: 0, cleanEnergyFund: 100, plasticRemoved: 0 });
    expect(result).toBe(100 * 5);
  });

  it('calculates plastic removal offsets correctly', () => {
    const result = calculateOffsets({ treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 50 });
    expect(result).toBe(50 * 2);
  });

  it('sums all offset types', () => {
    const result = calculateOffsets({ treesPlanted: 5, cleanEnergyFund: 20, plasticRemoved: 30 });
    expect(result).toBe(5 * 22 + 20 * 5 + 30 * 2);
  });

  it('returns 0 for empty offsets', () => {
    const result = calculateOffsets({ treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 });
    expect(result).toBe(0);
  });

  it('clamps negative values to zero', () => {
    const result = calculateOffsets({ treesPlanted: -5, cleanEnergyFund: -10, plasticRemoved: -20 });
    expect(result).toBe(0);
  });

  it('returns a rounded integer', () => {
    const result = calculateOffsets({ treesPlanted: 3, cleanEnergyFund: 7, plasticRemoved: 11 });
    expect(Number.isInteger(result)).toBe(true);
  });
});

// ============================================================
// getRecommendations()
// ============================================================
describe('getRecommendations', () => {
  const HIGH_TRANSPORT_INPUTS = {
    commuteDistance: 150,
    transportType: 'gasoline',
    flightHours: 20,
    electricityKwh: 200,
    greenEnergyShare: 0,
    heatingSource: 'gas',
    dietType: 'heavyMeat',
    shoppingHabit: 'consumerist',
    recycles: false
  };

  it('returns an array of recommendation objects', () => {
    const breakdown = calculateFootprint(HIGH_TRANSPORT_INPUTS);
    const recs = getRecommendations(HIGH_TRANSPORT_INPUTS, breakdown);
    expect(Array.isArray(recs)).toBe(true);
    expect(recs.length).toBeGreaterThan(0);
  });

  it('each recommendation has required fields', () => {
    const breakdown = calculateFootprint(HIGH_TRANSPORT_INPUTS);
    const recs = getRecommendations(HIGH_TRANSPORT_INPUTS, breakdown);
    recs.forEach(rec => {
      expect(rec).toHaveProperty('id');
      expect(rec).toHaveProperty('category');
      expect(rec).toHaveProperty('impact');
      expect(rec).toHaveProperty('title');
      expect(rec).toHaveProperty('text');
      expect(rec).toHaveProperty('savings');
    });
  });

  it('recommends EV switch for high-transport gasoline users', () => {
    const breakdown = calculateFootprint(HIGH_TRANSPORT_INPUTS);
    const recs = getRecommendations(HIGH_TRANSPORT_INPUTS, breakdown);
    expect(recs.some(r => r.id === 'rec_hybrid_ev')).toBe(true);
  });

  it('recommends reducing flights for heavy flyers', () => {
    const breakdown = calculateFootprint(HIGH_TRANSPORT_INPUTS);
    const recs = getRecommendations(HIGH_TRANSPORT_INPUTS, breakdown);
    expect(recs.some(r => r.id === 'rec_flights')).toBe(true);
  });

  it('recommends green energy when share is low', () => {
    const breakdown = calculateFootprint(HIGH_TRANSPORT_INPUTS);
    const recs = getRecommendations(HIGH_TRANSPORT_INPUTS, breakdown);
    expect(recs.some(r => r.id === 'rec_green_energy')).toBe(true);
  });

  it('recommends recycling when user does not recycle', () => {
    const breakdown = calculateFootprint(HIGH_TRANSPORT_INPUTS);
    const recs = getRecommendations(HIGH_TRANSPORT_INPUTS, breakdown);
    expect(recs.some(r => r.id === 'rec_recycle')).toBe(true);
  });

  it('recommends diet change for heavy meat eaters', () => {
    const breakdown = calculateFootprint(HIGH_TRANSPORT_INPUTS);
    const recs = getRecommendations(HIGH_TRANSPORT_INPUTS, breakdown);
    expect(recs.some(r => r.id === 'rec_diet_meatless')).toBe(true);
  });

  it('provides fallback advocacy recommendation for exemplary users', () => {
    const inputs = {
      commuteDistance: 5, transportType: 'none', flightHours: 0,
      electricityKwh: 50, greenEnergyShare: 100, heatingSource: 'none',
      dietType: 'vegan', shoppingHabit: 'minimalist', recycles: true
    };
    const breakdown = calculateFootprint(inputs);
    const recs = getRecommendations(inputs, breakdown);
    expect(recs.some(r => r.id === 'rec_advocate')).toBe(true);
  });
});

// ============================================================
// getUnlockedBadges()
// ============================================================
describe('getUnlockedBadges', () => {
  it('always includes Eco Seedling badge', () => {
    const badges = getUnlockedBadges(0, {});
    const seedling = badges.find(b => b.id === 'badge_newbie');
    expect(seedling).toBeDefined();
    expect(seedling.unlocked).toBe(true);
  });

  it('unlocks Eco Guardian at 100 XP', () => {
    const badges = getUnlockedBadges(100, {});
    expect(badges.find(b => b.id === 'badge_xp_100').unlocked).toBe(true);
  });

  it('does not unlock Eco Guardian below 100 XP', () => {
    const badges = getUnlockedBadges(99, {});
    expect(badges.find(b => b.id === 'badge_xp_100').unlocked).toBe(false);
  });

  it('unlocks Carbon Warrior at 500 XP', () => {
    const badges = getUnlockedBadges(500, {});
    expect(badges.find(b => b.id === 'badge_xp_500').unlocked).toBe(true);
  });

  it('unlocks Transit Champion with 5 green commutes', () => {
    const badges = getUnlockedBadges(0, { commute_green: 5 });
    expect(badges.find(b => b.id === 'badge_transit').unlocked).toBe(true);
  });

  it('unlocks Plant-Powered with 5 vegan meals', () => {
    const badges = getUnlockedBadges(0, { eat_vegan_veg: 5 });
    expect(badges.find(b => b.id === 'badge_diet').unlocked).toBe(true);
  });

  it('unlocks Watt Saver with 5 unplug habits', () => {
    const badges = getUnlockedBadges(0, { unplug_unused: 5 });
    expect(badges.find(b => b.id === 'badge_energy').unlocked).toBe(true);
  });

  it('unlocks Streak Master with 5-day streak', () => {
    const badges = getUnlockedBadges(0, {}, { streak: 5, completedTotal: 0 });
    expect(badges.find(b => b.id === 'badge_streak_5').unlocked).toBe(true);
  });

  it('unlocks Eco Champion with 10 completed challenges', () => {
    const badges = getUnlockedBadges(0, {}, { streak: 0, completedTotal: 10 });
    expect(badges.find(b => b.id === 'badge_challenges_10').unlocked).toBe(true);
  });

  it('handles null/missing challengeStats gracefully', () => {
    const badges = getUnlockedBadges(0, {}, null);
    expect(badges.find(b => b.id === 'badge_streak_5').unlocked).toBe(false);
  });

  it('returns exactly 8 badges', () => {
    const badges = getUnlockedBadges(0, {});
    expect(badges.length).toBe(8);
  });
});

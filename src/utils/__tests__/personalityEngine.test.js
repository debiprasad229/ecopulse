/**
 * Unit Tests for personalityEngine.js
 */
import { describe, it, expect } from 'vitest';
import { calculatePersonality } from '../personalityEngine';

const makeInputs = (overrides = {}) => ({
  commuteDistance: 30,
  transportType: 'gasoline',
  flightHours: 5,
  electricityKwh: 200,
  greenEnergyShare: 0,
  heatingSource: 'gas',
  dietType: 'lowMeat',
  shoppingHabit: 'average',
  recycles: true,
  ...overrides
});

const makeBreakdown = (overrides = {}) => ({
  transport: 800, energy: 2900, diet: 2200, shopping: 900, total: 6800,
  ...overrides
});

describe('calculatePersonality', () => {
  it('returns null for null inputs', () => {
    expect(calculatePersonality(null, {}, 0, 0, {}, {})).toBeNull();
  });

  it('returns null for undefined inputs', () => {
    expect(calculatePersonality(undefined, {}, 0, 0, {}, {})).toBeNull();
  });

  it('returns an object with expected shape', () => {
    const result = calculatePersonality(makeInputs(), makeBreakdown(), 6800, 0, {}, {});
    expect(result).toHaveProperty('key');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('badgeClass');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('strengths');
    expect(result).toHaveProperty('weaknesses');
    expect(result).toHaveProperty('opportunities');
    expect(result).toHaveProperty('challenge');
    expect(result).toHaveProperty('sustainabilityScore');
  });

  it('assigns "intensive" to high-emission gasoline heavy-meat user', () => {
    const inputs = makeInputs({
      commuteDistance: 200, transportType: 'gasoline',
      flightHours: 20, dietType: 'heavyMeat', shoppingHabit: 'consumerist'
    });
    const breakdown = makeBreakdown({ transport: 5000, total: 12000 });
    const result = calculatePersonality(inputs, breakdown, 12000, 0, {}, {});
    expect(result.key).toBe('intensive');
    expect(result.name).toBe('Carbon Intensive');
  });

  it('assigns "warrior" to very low net footprint user with high XP', () => {
    const inputs = makeInputs({
      commuteDistance: 5, transportType: 'none', flightHours: 0,
      electricityKwh: 50, greenEnergyShare: 100, heatingSource: 'none',
      dietType: 'vegan', shoppingHabit: 'minimalist'
    });
    const breakdown = makeBreakdown({ transport: 0, energy: 0, diet: 1000, shopping: 200, total: 1200 });
    const result = calculatePersonality(inputs, breakdown, 1200, 500, {}, { treesPlanted: 20 });
    expect(result.key).toBe('warrior');
  });

  it('assigns "commuter" when transit/walk is primary and transport is low fraction', () => {
    const inputs = makeInputs({
      commuteDistance: 20, transportType: 'none',
      flightHours: 0
    });
    const breakdown = makeBreakdown({ transport: 0, total: 5000 });
    const result = calculatePersonality(inputs, breakdown, 5000, 0, { commute_green: 10 }, {});
    expect(result.key).toBe('commuter');
  });

  it('assigns "saver" to a renewable-powered low electricity user', () => {
    const inputs = makeInputs({
      greenEnergyShare: 100, heatingSource: 'heatpump', electricityKwh: 100,
      transportType: 'gasoline', commuteDistance: 100
    });
    const breakdown = makeBreakdown({ energy: 500, transport: 3000, total: 7000 });
    const result = calculatePersonality(inputs, breakdown, 7000, 0, { unplug_unused: 10 }, {});
    expect(result.key).toBe('saver');
  });

  it('assigns "minimalist" for plant-based minimalist shopper who recycles', () => {
    const inputs = makeInputs({
      dietType: 'vegan', shoppingHabit: 'minimalist', recycles: true,
      transportType: 'gasoline', commuteDistance: 100, flightHours: 15
    });
    const breakdown = makeBreakdown({ diet: 1000, shopping: 200, transport: 5000, energy: 3000, total: 9200 });
    const result = calculatePersonality(inputs, breakdown, 9200, 0, { eat_vegan_veg: 10 }, {});
    expect(result.key).toBe('minimalist');
  });

  it('sustainabilityScore is clamped between 10 and 100', () => {
    // Very high footprint, low XP → should clamp to 10
    const r1 = calculatePersonality(makeInputs(), makeBreakdown({ total: 20000 }), 20000, 0, {}, {});
    expect(r1.sustainabilityScore).toBeGreaterThanOrEqual(10);
    expect(r1.sustainabilityScore).toBeLessThanOrEqual(100);

    // Very low footprint, high XP → should clamp to 100
    const r2 = calculatePersonality(makeInputs(), makeBreakdown({ total: 100 }), 100, 5000, {}, {});
    expect(r2.sustainabilityScore).toBe(100);
  });

  it('sustainabilityScore increases with more XP', () => {
    const r1 = calculatePersonality(makeInputs(), makeBreakdown(), 6800, 0, {}, {});
    const r2 = calculatePersonality(makeInputs(), makeBreakdown(), 6800, 500, {}, {});
    expect(r2.sustainabilityScore).toBeGreaterThan(r1.sustainabilityScore);
  });

  it('sustainabilityScore decreases with higher net footprint', () => {
    const r1 = calculatePersonality(makeInputs(), makeBreakdown(), 3000, 100, {}, {});
    const r2 = calculatePersonality(makeInputs(), makeBreakdown(), 8000, 100, {}, {});
    expect(r1.sustainabilityScore).toBeGreaterThan(r2.sustainabilityScore);
  });

  it('challenge object has text and xpReward', () => {
    const result = calculatePersonality(makeInputs(), makeBreakdown(), 6800, 0, {}, {});
    expect(result.challenge).toHaveProperty('text');
    expect(result.challenge).toHaveProperty('xpReward');
    expect(typeof result.challenge.xpReward).toBe('number');
  });

  it('strengths and weaknesses are non-empty arrays', () => {
    const result = calculatePersonality(makeInputs(), makeBreakdown(), 6800, 0, {}, {});
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.weaknesses.length).toBeGreaterThan(0);
  });
});

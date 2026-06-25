/**
 * Unit Tests for challengeEngine.js
 */
import { describe, it, expect } from 'vitest';
import { INITIAL_CHALLENGES, updateStreakOnClaim } from '../challengeEngine';

describe('INITIAL_CHALLENGES', () => {
  it('contains exactly 9 challenges', () => {
    expect(INITIAL_CHALLENGES).toHaveLength(9);
  });

  it('has 3 daily, 3 weekly, and 3 monthly challenges', () => {
    const daily = INITIAL_CHALLENGES.filter(c => c.type === 'daily');
    const weekly = INITIAL_CHALLENGES.filter(c => c.type === 'weekly');
    const monthly = INITIAL_CHALLENGES.filter(c => c.type === 'monthly');
    expect(daily).toHaveLength(3);
    expect(weekly).toHaveLength(3);
    expect(monthly).toHaveLength(3);
  });

  it('every challenge has required fields', () => {
    INITIAL_CHALLENGES.forEach(ch => {
      expect(ch).toHaveProperty('id');
      expect(ch).toHaveProperty('type');
      expect(ch).toHaveProperty('title');
      expect(ch).toHaveProperty('goal');
      expect(ch).toHaveProperty('progress');
      expect(ch).toHaveProperty('unit');
      expect(ch).toHaveProperty('xpReward');
      expect(ch).toHaveProperty('claimed');
      expect(ch.progress).toBe(0);
      expect(ch.claimed).toBe(false);
      expect(ch.xpReward).toBeGreaterThan(0);
    });
  });

  it('all challenge IDs are unique', () => {
    const ids = INITIAL_CHALLENGES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('updateStreakOnClaim', () => {
  it('starts streak at 1 on first claim', () => {
    const result = updateStreakOnClaim({});
    expect(result.streak).toBe(1);
    expect(result.completedTotal).toBe(1);
    expect(result.lastCompletedDate).toBe(new Date().toDateString());
  });

  it('maintains streak without incrementing if already claimed today', () => {
    const todayStr = new Date().toDateString();
    const result = updateStreakOnClaim({ streak: 3, completedTotal: 5, lastCompletedDate: todayStr });
    // Already claimed today — streak stays at 3
    expect(result.streak).toBe(3);
    expect(result.completedTotal).toBe(6);
  });

  it('increments streak when last claim was yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const prevStats = { streak: 4, completedTotal: 8, lastCompletedDate: yesterday.toDateString() };
    const result = updateStreakOnClaim(prevStats);
    expect(result.streak).toBe(5);
    expect(result.completedTotal).toBe(9);
  });

  it('resets streak to 1 when last claim was 2+ days ago', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 3);
    const prevStats = { streak: 10, completedTotal: 20, lastCompletedDate: twoDaysAgo.toDateString() };
    const result = updateStreakOnClaim(prevStats);
    expect(result.streak).toBe(1);
    expect(result.completedTotal).toBe(21);
  });
});

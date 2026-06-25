/**
 * Unit Tests for forecastEngine.js
 */
import { describe, it, expect } from 'vitest';
import { generateForecast } from '../forecastEngine';

describe('generateForecast', () => {
  const baseRecs = [
    { title: 'Switch to EV', text: 'Test', savings: 1000 },
    { title: 'Green energy', text: 'Test', savings: 500 }
  ];

  it('returns object with expected shape', () => {
    const result = generateForecast([], 5000, baseRecs, {}, {});
    expect(result).toHaveProperty('forecastData');
    expect(result).toHaveProperty('trend');
    expect(result).toHaveProperty('trendDirection');
    expect(result).toHaveProperty('reductionSavings');
    expect(result).toHaveProperty('goalProbability');
  });

  it('generates exactly 6 months of forecast data', () => {
    const result = generateForecast([], 5000, baseRecs, {}, {});
    expect(result.forecastData).toHaveLength(6);
  });

  it('each month has month, baseline, bestCase, and worstCase fields', () => {
    const result = generateForecast([], 5000, baseRecs, {}, {});
    result.forecastData.forEach(d => {
      expect(d).toHaveProperty('month');
      expect(d).toHaveProperty('baseline');
      expect(d).toHaveProperty('bestCase');
      expect(d).toHaveProperty('worstCase');
      expect(typeof d.baseline).toBe('number');
      expect(typeof d.bestCase).toBe('number');
      expect(typeof d.worstCase).toBe('number');
    });
  });

  it('bestCase is always <= baseline', () => {
    const result = generateForecast([], 5000, baseRecs, {}, {});
    result.forecastData.forEach(d => {
      expect(d.bestCase).toBeLessThanOrEqual(d.baseline);
    });
  });

  it('worstCase is always >= baseline', () => {
    const result = generateForecast([], 5000, baseRecs, {}, {});
    result.forecastData.forEach(d => {
      expect(d.worstCase).toBeGreaterThanOrEqual(d.baseline);
    });
  });

  it('trend is "Initial Baseline (No Trend)" with no history', () => {
    const result = generateForecast([], 5000, baseRecs, {}, {});
    expect(result.trend).toBe('Initial Baseline (No Trend)');
    expect(result.trendDirection).toBe('none');
  });

  it('trend is "Stable Trajectory" with flat history', () => {
    const history = [
      { footprint: 5000 },
      { footprint: 5000 },
      { footprint: 5000 }
    ];
    const result = generateForecast(history, 5000, baseRecs, {}, {});
    expect(result.trend).toBe('Stable Trajectory');
    expect(result.trendDirection).toBe('flat');
  });

  it('detects steadily decreasing trend', () => {
    // newest first: 3000, then older: 5000
    const history = [
      { footprint: 3000 },
      { footprint: 5000 }
    ];
    const result = generateForecast(history, 3000, baseRecs, {}, {});
    // slope = (3000 - 5000) / 1 = -2000
    expect(result.trendDirection).toBe('down');
  });

  it('goalProbability is 95 when already under 2000 kg', () => {
    const result = generateForecast([], 1500, baseRecs, {}, {});
    expect(result.goalProbability).toBe(95);
  });

  it('goalProbability is between 8 and 92 for users above target', () => {
    const result = generateForecast([], 5000, baseRecs, {}, {});
    expect(result.goalProbability).toBeGreaterThanOrEqual(8);
    expect(result.goalProbability).toBeLessThanOrEqual(92);
  });

  it('reductionSavings is a non-negative integer', () => {
    const result = generateForecast([], 5000, baseRecs, {}, {});
    expect(result.reductionSavings).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.reductionSavings)).toBe(true);
  });

  it('handles empty recommendations without error', () => {
    const result = generateForecast([], 5000, [], {}, {});
    expect(result.forecastData).toHaveLength(6);
  });
});

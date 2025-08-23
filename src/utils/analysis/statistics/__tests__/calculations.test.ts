import {
  calculateMean,
  calculateMedian,
  calculateStandardDeviation,
  calculateFieldStats
} from '../calculations';
import { calculateCorrelation } from '../correlation';
import type { DataField } from '@/types/data';

describe('Statistical Calculations', () => {
  describe('calculateMean', () => {
    it('should calculate mean correctly for valid numbers', () => {
      expect(calculateMean([1, 2, 3, 4, 5])).toBe(3);
    });

    it('should return 0 for empty array', () => {
      expect(calculateMean([])).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(calculateMean([-2, -1, 0, 1, 2])).toBe(0);
    });

    it('should handle decimal numbers', () => {
      expect(calculateMean([1.5, 2.5, 3.5])).toBe(2.5);
    });

    it('should handle large numbers without precision loss', () => {
      const values = [1e7, 2e7, 3e7];
      expect(calculateMean(values)).toBe(2e7);
    });
  });

  describe('calculateMedian', () => {
    it('should calculate median for odd number of values', () => {
      expect(calculateMedian([1, 2, 3, 4, 5])).toBe(3);
    });

    it('should calculate median for even number of values', () => {
      expect(calculateMedian([1, 2, 3, 4])).toBe(2.5);
    });

    it('should handle unsorted arrays', () => {
      expect(calculateMedian([5, 2, 1, 4, 3])).toBe(3);
    });

    it('should return 0 for empty array', () => {
      expect(calculateMedian([])).toBe(0);
    });

    it('should handle array with single value', () => {
      expect(calculateMedian([42])).toBe(42);
    });
  });

  describe('calculateStandardDeviation', () => {
    it('should calculate standard deviation correctly', () => {
      expect(calculateStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.0, 2);
    });

    it('should return 0 for single value', () => {
      expect(calculateStandardDeviation([5])).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(calculateStandardDeviation([])).toBe(0);
    });

    it('should handle pre-calculated mean', () => {
      const values = [2, 4, 4, 4, 5, 5, 7, 9];
      const mean = calculateMean(values);
      expect(calculateStandardDeviation(values, mean)).toBeCloseTo(2.0, 2);
    });

    it('should handle negative numbers', () => {
      expect(calculateStandardDeviation([-2, -1, 0, 1, 2])).toBeCloseTo(1.58, 2);
    });
  });

  describe('calculateCorrelation', () => {
    it('should calculate perfect positive correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      expect(calculateCorrelation(x, y)).toBeCloseTo(1, 5);
    });

    it('should calculate perfect negative correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];
      expect(calculateCorrelation(x, y)).toBeCloseTo(-1, 5);
    });

    it('should handle no correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [5, 2, 4, 1, 3];
      expect(Math.abs(calculateCorrelation(x, y))).toBeLessThan(0.3);
    });

    it('should handle arrays of different lengths', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6];
      expect(calculateCorrelation(x, y)).toBeCloseTo(1, 5);
    });

    it('should return 0 for invalid inputs', () => {
      expect(calculateCorrelation([], [])).toBe(0);
      expect(calculateCorrelation([1], [])).toBe(0);
      expect(calculateCorrelation([], [1])).toBe(0);
    });
  });

  describe('calculateFieldStats', () => {
    const testField: DataField = {
      name: 'test',
      type: 'number',
      value: [1, 2, 3, 4, 5]
    };

    it('should calculate all statistics correctly', () => {
      const stats = calculateFieldStats(testField);
      expect(stats.mean).toBe(3);
      expect(stats.median).toBe(3);
      expect(stats.standardDeviation).toBeCloseTo(1.41, 2);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(5);
      expect(stats.trend).toBe('up');
    });

    it('should handle field with single value', () => {
      const singleValueField: DataField = {
        name: 'single',
        type: 'number',
        value: [42]
      };
      const stats = calculateFieldStats(singleValueField);
      expect(stats.mean).toBe(42);
      expect(stats.median).toBe(42);
      expect(stats.standardDeviation).toBe(0);
      expect(stats.min).toBe(42);
      expect(stats.max).toBe(42);
      expect(stats.trend).toBe('stable');
    });

    it('should calculate quartiles correctly', () => {
      const field: DataField = {
        name: 'quartiles',
        type: 'number',
        value: [1, 2, 3, 4, 5, 6, 7, 8]
      };
      const stats = calculateFieldStats(field);
      expect(stats.quartiles.q1).toBe(2.5);
      expect(stats.quartiles.q2).toBe(4.5);
      expect(stats.quartiles.q3).toBe(6.5);
    });
  });
});
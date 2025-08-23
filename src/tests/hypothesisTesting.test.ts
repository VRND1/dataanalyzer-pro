import { calculateTTest, calculateZTest, calculateAnova, calculateChiSquare } from '../utils/hypothesisTesting';

describe('Hypothesis Testing', () => {

  describe('Hypothesis Testing Functions', () => {
    describe('T-Test', () => {
      it('should perform independent samples t-test correctly', () => {
        const sample1 = [1, 2, 3, 4, 5];
        const sample2 = [2, 3, 4, 5, 6];
        const alpha = 0.05;

        const result = calculateTTest({
          sample1,
          sample2,
          alpha,
          isPaired: false
        });

        expect(result.testType).toBe('t-test');
        expect(result.isSignificant).toBeDefined();
        expect(result.pValue).toBeGreaterThan(0);
        expect(result.pValue).toBeLessThan(1);
        expect(result.confidenceInterval).toHaveLength(2);
        expect(result.degreesOfFreedom).toBe(8); // n1 + n2 - 2
      });

      it('should perform paired samples t-test correctly', () => {
        const sample1 = [1, 2, 3, 4, 5];
        const sample2 = [2, 3, 4, 5, 6];
        const alpha = 0.05;

        const result = calculateTTest({
          sample1,
          sample2,
          alpha,
          isPaired: true
        });

        expect(result.testType).toBe('t-test');
        expect(result.isSignificant).toBeDefined();
        expect(result.pValue).toBeGreaterThan(0);
        expect(result.pValue).toBeLessThan(1);
        expect(result.confidenceInterval).toHaveLength(2);
        expect(result.degreesOfFreedom).toBe(4); // n - 1
      });

      it('should handle equal means correctly', () => {
        const sample1 = [1, 2, 3, 4, 5];
        const sample2 = [1, 2, 3, 4, 5];
        const alpha = 0.05;

        const result = calculateTTest({
          sample1,
          sample2,
          alpha,
          isPaired: false
        });

        expect(result.testType).toBe('t-test');
        expect(result.statistic).toBeCloseTo(0, 2);
        expect(result.isSignificant).toBe(false);
      });
    });

    describe('Z-Test', () => {
      it('should perform z-test correctly', () => {
        const sample = [1, 2, 3, 4, 5];
        const populationMean = 3;
        const populationStdDev = 1;
        const alpha = 0.05;

        const result = calculateZTest({
          sample,
          populationMean,
          populationStdDev,
          alpha
        });

        expect(result.testType).toBe('z-test');
        expect(result.isSignificant).toBeDefined();
        expect(result.pValue).toBeGreaterThan(0);
        expect(result.pValue).toBeLessThan(1);
        expect(result.confidenceInterval).toHaveLength(2);
      });

      it('should handle sample mean equal to population mean', () => {
        const sample = [3, 3, 3, 3, 3];
        const populationMean = 3;
        const populationStdDev = 1;
        const alpha = 0.05;

        const result = calculateZTest({
          sample,
          populationMean,
          populationStdDev,
          alpha
        });

        expect(result.testType).toBe('z-test');
        expect(result.statistic).toBeCloseTo(0, 2);
        expect(result.isSignificant).toBe(false);
      });
    });

    describe('ANOVA', () => {
      it('should perform ANOVA correctly', () => {
        const groups = [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ];
        const alpha = 0.05;

        const result = calculateAnova({
          groups,
          alpha
        });

        expect(result.testType).toBe('anova');
        expect(result.isSignificant).toBeDefined();
        expect(result.pValue).toBeGreaterThan(0);
        expect(result.pValue).toBeLessThan(1);
        expect(result.degreesOfFreedom).toBe(2); // number of groups - 1
      });

      it('should handle equal group means correctly', () => {
        const groups = [
          [1, 2, 3],
          [1, 2, 3],
          [1, 2, 3]
        ];
        const alpha = 0.05;

        const result = calculateAnova({
          groups,
          alpha
        });

        expect(result.testType).toBe('anova');
        expect(result.statistic).toBeCloseTo(0, 2);
        expect(result.isSignificant).toBe(false);
      });
    });

    describe('Chi-Square Test', () => {
      it('should perform chi-square test correctly', () => {
        const observed = [10, 15, 20, 25];
        const expected = [12, 15, 18, 25];
        const alpha = 0.05;

        const result = calculateChiSquare({
          observed,
          expected,
          alpha
        });

        expect(result.testType).toBe('chi-square');
        expect(result.isSignificant).toBeDefined();
        expect(result.pValue).toBeGreaterThan(0);
        expect(result.pValue).toBeLessThan(1);
        expect(result.degreesOfFreedom).toBe(3); // n - 1
        expect(result.nullHypothesis).toBeDefined();
        expect(result.alternativeHypothesis).toBeDefined();
        expect(result.conclusion).toBeDefined();
      });

      it('should handle equal frequencies correctly', () => {
        const observed = [10, 10, 10, 10];
        const expected = [10, 10, 10, 10];
        const alpha = 0.05;

        const result = calculateChiSquare({
          observed,
          expected,
          alpha
        });

        expect(result.testType).toBe('chi-square');
        expect(result.statistic).toBeCloseTo(0, 2);
        expect(result.isSignificant).toBe(false);
      });

      it('should throw error for mismatched array lengths', () => {
        const observed = [10, 15, 20];
        const expected = [12, 15, 18, 25];
        const alpha = 0.05;

        expect(() => {
          calculateChiSquare({
            observed,
            expected,
            alpha
          });
        }).toThrow('Observed and expected frequencies must have the same length');
      });
    });

    describe('Edge Cases', () => {
      it('should handle small samples in t-test', () => {
        const sample1 = [1, 2];
        const sample2 = [2, 3];
        const alpha = 0.05;

        const result = calculateTTest({
          sample1,
          sample2,
          alpha,
          isPaired: false
        });

        expect(result.testType).toBe('t-test');
        expect(result.isSignificant).toBeDefined();
        expect(result.degreesOfFreedom).toBe(2); // n1 + n2 - 2
      });

      it('should handle extreme values in z-test', () => {
        const sample = [100, 200, 300];
        const populationMean = 0;
        const populationStdDev = 1;
        const alpha = 0.05;

        const result = calculateZTest({
          sample,
          populationMean,
          populationStdDev,
          alpha
        });

        expect(result.testType).toBe('z-test');
        expect(result.isSignificant).toBe(true);
        expect(Math.abs(result.statistic)).toBeGreaterThan(2);
      });

      it('should handle unequal group sizes in ANOVA', () => {
        const groups = [
          [1, 2, 3],
          [4, 5],
          [6, 7, 8, 9]
        ];
        const alpha = 0.05;

        const result = calculateAnova({
          groups,
          alpha
        });

        expect(result.testType).toBe('anova');
        expect(result.isSignificant).toBeDefined();
        expect(result.degreesOfFreedom).toBe(2); // number of groups - 1
      });
    });
  });
}); 
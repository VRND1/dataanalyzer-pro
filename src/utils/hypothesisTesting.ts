import { jStat } from 'jstat';

export interface HypothesisTestResult {
  testType: 't-test' | 'z-test' | 'anova' | 'chi-square';
  statistic: number;
  pValue: number;
  criticalValue: number;
  isSignificant: boolean;
  confidenceInterval: [number, number];
  degreesOfFreedom?: number;
  nullHypothesis: string;
  alternativeHypothesis: string;
  conclusion: string;
}

export interface TTestParams {
  sample1: number[];
  sample2: number[];
  alpha: number;
  isPaired?: boolean;
}

export interface ZTestParams {
  sample: number[];
  populationMean: number;
  populationStdDev: number;
  alpha: number;
}

export interface AnovaParams {
  groups: number[][];
  alpha: number;
}

export interface ChiSquareParams {
  observed: number[];
  expected: number[];
  alpha: number;
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr: number[], meanVal?: number): number {
  const m = meanVal ?? mean(arr);
  return arr.reduce((sum, val) => sum + (val - m) ** 2, 0) / (arr.length - 1);
}

/**
 * Welch's T-Test Formula (for unequal variances):
 * t = (x̄₁ - x̄₂) / √(s₁²/n₁ + s₂²/n₂)
 * df = (s₁²/n₁ + s₂²/n₂)² / ((s₁²/n₁)²/(n₁-1) + (s₂²/n₂)²/(n₂-1))
 * 
 * For paired samples:
 * t = d̄ / (s_d/√n)
 * where d̄ = mean of differences, s_d = standard deviation of differences
 */
export const calculateTTest = (params: TTestParams): HypothesisTestResult => {
  const { sample1, sample2, alpha, isPaired = false } = params;

  if (isPaired) {
    // Paired t-test
    if (sample1.length !== sample2.length) {
      throw new Error('Paired samples must have the same length');
    }
    
    const differences = sample1.map((val, i) => val - sample2[i]);
    const meanDiff = mean(differences);
    const varDiff = variance(differences, meanDiff);
    const n = differences.length;
    
    const tStatistic = meanDiff / Math.sqrt(varDiff / n);
    const df = n - 1;
    
    const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStatistic), df));
    const criticalValue = jStat.studentt.inv(1 - alpha / 2, df);
    
    const marginOfError = criticalValue * Math.sqrt(varDiff / n);
    const confidenceInterval: [number, number] = [
      meanDiff - marginOfError,
      meanDiff + marginOfError
    ];
    
    const isSignificant = pValue < alpha;
    const conclusion = isSignificant
      ? 'Reject H₀: There is significant evidence of a difference between the paired samples'
      : 'Fail to reject H₀: There is not enough evidence to conclude a difference between the paired samples';
    
    return {
      testType: 't-test',
      statistic: tStatistic,
      pValue,
      criticalValue,
      isSignificant,
      confidenceInterval,
      degreesOfFreedom: df,
      nullHypothesis: 'H₀: μ_d = 0 (no difference between paired means)',
      alternativeHypothesis: 'H₁: μ_d ≠ 0 (paired means are different)',
      conclusion
    };
  } else {
    // Independent samples t-test (Welch's test)
    const mean1 = mean(sample1);
    const mean2 = mean(sample2);
    const var1 = variance(sample1, mean1);
    const var2 = variance(sample2, mean2);
    const n1 = sample1.length;
    const n2 = sample2.length;

    // Welch's t-statistic formula
    const tStatistic = (mean1 - mean2) / Math.sqrt(var1 / n1 + var2 / n2);
    
    // Welch–Satterthwaite degrees of freedom
    const df = Math.pow(var1 / n1 + var2 / n2, 2) /
      ((Math.pow(var1 / n1, 2) / (n1 - 1)) + (Math.pow(var2 / n2, 2) / (n2 - 1)));

    const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStatistic), df));
    const criticalValue = jStat.studentt.inv(1 - alpha / 2, df);

    const marginOfError = criticalValue * Math.sqrt(var1 / n1 + var2 / n2);
    const confidenceInterval: [number, number] = [
      (mean1 - mean2) - marginOfError,
      (mean1 - mean2) + marginOfError
    ];

    const isSignificant = pValue < alpha;
    const conclusion = isSignificant
      ? 'Reject H₀: There is significant evidence of a difference between the two samples'
      : 'Fail to reject H₀: There is not enough evidence to conclude a difference between the two samples';

    return {
      testType: 't-test',
      statistic: tStatistic,
      pValue,
      criticalValue,
      isSignificant,
      confidenceInterval,
      degreesOfFreedom: df,
      nullHypothesis: 'H₀: μ₁ = μ₂ (no difference between means)',
      alternativeHypothesis: 'H₁: μ₁ ≠ μ₂ (means are different)',
      conclusion
    };
  }
};

/**
 * Z-Test Formula:
 * z = (x̄ - μ₀) / (σ / √n)
 * where:
 * x̄ = sample mean
 * μ₀ = population mean (null hypothesis)
 * σ = population standard deviation
 * n = sample size
 */
export const calculateZTest = (params: ZTestParams): HypothesisTestResult => {
  const { sample, populationMean, populationStdDev, alpha } = params;
  
  const sampleMean = sample.reduce((a, b) => a + b) / sample.length;
  const standardError = populationStdDev / Math.sqrt(sample.length);
  
  // Calculate z-statistic using the formula: z = (x̄ - μ₀) / (σ / √n)
  const zStatistic = (sampleMean - populationMean) / standardError;
  
  // Calculate p-value (two-tailed test)
  const pValue = 2 * (1 - jStat.normal.cdf(Math.abs(zStatistic), 0, 1));
  
  // Calculate critical value for two-tailed test
  const criticalValue = jStat.normal.inv(1 - alpha / 2, 0, 1);
  
  // Calculate confidence interval
  const marginOfError = criticalValue * standardError;
  const confidenceInterval: [number, number] = [
    sampleMean - marginOfError,
    sampleMean + marginOfError
  ];
  
  const isSignificant = pValue < alpha;
  const conclusion = isSignificant
    ? 'Reject H₀: There is significant evidence that the sample mean differs from the population mean'
    : 'Fail to reject H₀: There is not enough evidence to conclude that the sample mean differs from the population mean';
  
  return {
    testType: 'z-test',
    statistic: zStatistic,
    pValue,
    criticalValue,
    isSignificant,
    confidenceInterval,
    nullHypothesis: 'H₀: μ = μ₀ (sample mean equals population mean)',
    alternativeHypothesis: 'H₁: μ ≠ μ₀ (sample mean differs from population mean)',
    conclusion
  };
};

/**
 * ANOVA Formula:
 * F = MSB / MSW
 * where:
 * MSB = Between-group mean square
 * MSW = Within-group mean square
 */
export const calculateAnova = (params: AnovaParams): HypothesisTestResult => {
  const { groups, alpha } = params;
  
  // Calculate overall mean
  const allValues = groups.flat();
  const overallMean = allValues.reduce((a, b) => a + b) / allValues.length;
  
  // Calculate between-group sum of squares
  const betweenGroupSS = groups.reduce((acc, group) => {
    const groupMean = group.reduce((a, b) => a + b) / group.length;
    return acc + group.length * Math.pow(groupMean - overallMean, 2);
  }, 0);
  
  // Calculate within-group sum of squares
  const withinGroupSS = groups.reduce((acc, group) => {
    const groupMean = group.reduce((a, b) => a + b) / group.length;
    return acc + group.reduce((sum, val) => sum + Math.pow(val - groupMean, 2), 0);
  }, 0);
  
  // Calculate degrees of freedom
  const betweenGroupDF = groups.length - 1;
  const withinGroupDF = allValues.length - groups.length;
  
  // Calculate mean squares
  const betweenGroupMS = betweenGroupSS / betweenGroupDF;
  const withinGroupMS = withinGroupSS / withinGroupDF;
  
  // Calculate F-statistic using the formula: F = MSB / MSW
  const fStatistic = betweenGroupMS / withinGroupMS;
  
  // Calculate p-value using jStat
  const pValue = 1 - jStat.f.cdf(fStatistic, betweenGroupDF, withinGroupDF);
  
  const isSignificant = pValue < alpha;
  const conclusion = isSignificant
    ? 'Reject H₀: There is significant evidence of differences between groups'
    : 'Fail to reject H₀: There is not enough evidence to conclude differences between groups';
  
  return {
    testType: 'anova',
    statistic: fStatistic,
    pValue,
    criticalValue: jStat.f.inv(1 - alpha, betweenGroupDF, withinGroupDF),
    isSignificant,
    confidenceInterval: [0, 0], // Not applicable for ANOVA
    degreesOfFreedom: betweenGroupDF,
    nullHypothesis: 'H₀: All group means are equal',
    alternativeHypothesis: 'H₁: At least one group mean differs',
    conclusion
  };
};

/**
 * Chi-Square Test Formula:
 * χ² = Σ((O - E)² / E)
 * where:
 * O = Observed frequency
 * E = Expected frequency
 */
export const calculateChiSquare = (params: ChiSquareParams): HypothesisTestResult => {
  const { observed, expected: expectedFreqs, alpha } = params;

  if (observed.length !== expectedFreqs.length) {
    throw new Error('Observed and expected frequencies must have the same length');
  }

  // Calculate chi-square statistic using the formula: χ² = Σ((O - E)² / E)
  const testStatistic = observed.reduce((sum, obs, i) => {
    const exp = expectedFreqs[i];
    return sum + Math.pow(obs - exp, 2) / exp;
  }, 0);

  const degreesOfFreedom = observed.length - 1;
  const pValue = 1 - jStat.chisquare.cdf(testStatistic, degreesOfFreedom);
  const criticalValue = jStat.chisquare.inv(1 - alpha, degreesOfFreedom);

  const conclusion = pValue <= alpha
    ? 'Reject H₀: There is significant evidence that the observed frequencies differ from the expected frequencies'
    : 'Fail to reject H₀: There is not enough evidence to conclude that the observed frequencies differ from the expected frequencies';

  return {
    testType: 'chi-square',
    statistic: testStatistic,
    pValue,
    criticalValue,
    isSignificant: pValue <= alpha,
    confidenceInterval: [0, 0], // Not applicable for chi-square
    degreesOfFreedom,
    nullHypothesis: 'H₀: Observed frequencies match expected frequencies',
    alternativeHypothesis: 'H₁: Observed frequencies differ from expected frequencies',
    conclusion
  };
};

 
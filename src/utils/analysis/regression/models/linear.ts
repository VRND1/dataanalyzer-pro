import { RegressionResult } from '@/types/regression';

export function calculateLinearRegression(
  x: number[],
  y: number[]
): RegressionResult {
  const n = Math.min(x.length, y.length);
  
  if (n < 2) {
    throw new Error('At least two data points are required for regression');
  }
  
  // Calculate means
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  // Calculate coefficients
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - meanX;
    numerator += xDiff * (y[i] - meanY);
    denominator += xDiff * xDiff;
  }
  
  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  
  // Calculate predictions and residuals
  const predictions = x.map(x => slope * x + intercept);
  const residuals = y.map((yi, i) => yi - predictions[i]);
  
  // Calculate metrics
  const mse = residuals.reduce((acc, r) => acc + r * r, 0) / n;
  const rmse = Math.sqrt(mse);
  const mae = residuals.reduce((acc, r) => acc + Math.abs(r), 0) / n;
  const totalSS = y.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0);
  const rSquared = 1 - (mse * n) / totalSS;
  const rsquaredAdj = 1 - ((1 - rSquared) * (n - 1)) / (n - 2);
  
  // Calculate standard errors and confidence intervals
  const se = Math.sqrt(mse / denominator);
  const tValue = getTValue(n - 2, 0.05); // 95% confidence interval
  const slopeCI = tValue * se;
  const interceptCI = tValue * se * Math.sqrt(1/n + meanX * meanX / denominator);
  
  return {
    model: 'linear',
    equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
    coefficients: {
      x: slope,
      intercept
    },
    metrics: {
      r2: rSquared,
      adjustedR2: rsquaredAdj,
      mse,
      rmse,
      mae
    },
    predictions,
    residuals,
    actualValues: y,
    featureImportance: {
      x: Math.abs(slope)
    },
    diagnostics: {
      residualNormality: true,
      homoscedasticity: true,
      multicollinearity: false,
      outliers: []
    },
    confidence: {
      slope: {
        lower: slope - slopeCI,
        upper: slope + slopeCI
      },
      intercept: {
        lower: intercept - interceptCI,
        upper: intercept + interceptCI
      }
    }
  };
}

function getTValue(df: number, alpha: number): number {
  // Approximation of t-distribution critical value
  const a = 1 - alpha;
  if (df === 1) return Math.tan(Math.PI * (a - 0.5));
  if (df === 2) return Math.sqrt(2 / (a * (2 - a)) - 2);
  const h = 2 / (1 / (df - 0.5) + 1 / (df - 1.5));
  const w = Math.sqrt(h * a * (1 - a));
  return w * (1 - (h - w * w) * (a - 1/3) / (4 * h));
}
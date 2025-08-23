import { DataField } from '@/types/data';
import type { RegressionResult } from './types';

export function performRegression(fields: DataField[]): RegressionResult[] {
  const results: RegressionResult[] = [];

  // Perform regression for each field as dependent variable
  fields.forEach((dependent, i) => {
    const independents = fields.filter((_, index) => index !== i);
    
    // For each independent variable combination
    independents.forEach(independent => {
      const result = calculateRegression(
        dependent.value as number[],
        independent.value as number[]
      );

      results.push({
        field: `${dependent.name} vs ${independent.name}`,
        type: 'linear',
        coefficients: [result.slope],
        intercept: result.intercept,
        rSquared: result.rSquared,
        standardError: result.standardError,
        predictions: result.predictions,
        actualValues: dependent.value as number[],
        equation: generateEquation(dependent.name, independent.name, result.slope, result.intercept),
        confidence: {
          upper: result.predictions.map(p => p + 1.96 * result.standardError),
          lower: result.predictions.map(p => p - 1.96 * result.standardError)
        },
        metrics: {
          mse: result.standardError * result.standardError,
          rmse: result.standardError,
          mae: result.predictions.reduce((sum, p, i) => sum + Math.abs(p - (dependent.value as number[])[i]), 0) / result.predictions.length,
          rSquared: result.rSquared,
          r2Score: result.rSquared, // Add for UI compatibility
          rSquaredAdj: result.rSquared,
          adjustedR2: result.rSquared, // Add for UI compatibility
          aic: 0,
          bic: 0,
          durbinWatson: 0
        }
      });
    });
  });

  // Sort by R² score
  return results.sort((a, b) => b.rSquared - a.rSquared);
}

function calculateRegression(dependent: number[], independent: number[]): {
  slope: number;
  intercept: number;
  rSquared: number;
  standardError: number;
  predictions: number[];
} {
  const n = Math.min(dependent.length, independent.length);
  
  // Calculate means
  const meanX = independent.reduce((a, b) => a + b, 0) / n;
  const meanY = dependent.reduce((a, b) => a + b, 0) / n;
  
  // Calculate coefficients
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = independent[i] - meanX;
    numerator += xDiff * (dependent[i] - meanY);
    denominator += xDiff * xDiff;
  }
  
  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  
  // Calculate predictions and R²
  const predictions = independent.map(x => slope * x + intercept);
  const residualSS = dependent.reduce((acc, yi, i) => 
    acc + Math.pow(yi - predictions[i], 2), 0);
  const totalSS = dependent.reduce((acc, yi) => 
    acc + Math.pow(yi - meanY, 2), 0);
  
  const rSquared = 1 - (residualSS / totalSS);
  
  // Calculate standard error
  const standardError = Math.sqrt(residualSS / (n - 2));
  
  return { slope, intercept, rSquared, standardError, predictions };
}

function generateEquation(
  dependent: string,
  independent: string,
  slope: number,
  intercept: number
): string {
  const sign = intercept >= 0 ? '+' : '';
  return `${dependent} = ${slope.toFixed(3)} × ${independent} ${sign} ${intercept.toFixed(3)}`;
}
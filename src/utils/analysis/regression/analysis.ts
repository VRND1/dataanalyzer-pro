import { DataField } from '@/types/data';
import { calculateLinearRegression } from './calculations';
import type { RegressionResult } from './types';
import { calculateDurbinWatson } from './utils';

export function performRegression(fields: DataField[]): RegressionResult[] {
  const numericFields = fields.filter(field => field.type === 'number');
  const results: RegressionResult[] = [];

  for (let i = 0; i < numericFields.length; i++) {
    const dependent = numericFields[i];
    const independent = numericFields.filter((_, index) => index !== i);

    if (independent.length > 0) {
      const result = calculateRegression(dependent, independent);
      results.push(result);
    }
  }

  return results;
}

function calculateRegression(
  dependent: DataField,
  independent: DataField[]
): RegressionResult {
  const y = dependent.value as number[];
  const x = independent[0].value as number[];

  const { slope, intercept, rSquared } = calculateLinearRegression(x, y);
  const predictions = x.map(x => slope * x + intercept);

  const residuals = y.map((actual, index) => actual - predictions[index]);

  const mse = residuals.reduce((acc, r) => acc + r * r, 0) / y.length;
  const rmse = Math.sqrt(mse);
  const mae = residuals.reduce((acc, r) => acc + Math.abs(r), 0) / y.length;
  const rsquaredAdj = 1 - ((1 - rSquared) * (y.length - 1)) / (y.length - 2);
  const aic = y.length * Math.log(mse) + 2 * 2;
  const bic = y.length * Math.log(mse) + Math.log(y.length) * 2;

  const metrics = {
    mse,
    rmse,
    mae,
    rSquared,
    r2Score: rSquared, // Add for UI compatibility
    rSquaredAdj: rsquaredAdj,
    adjustedR2: rsquaredAdj, // Add for UI compatibility
    aic,
    bic,
    durbinWatson: calculateDurbinWatson(residuals)
  };

  return {
    field: dependent.name,
    type: 'linear',
    coefficients: [slope],
    intercept,
    rSquared,
    standardError: Math.sqrt(mse),
    predictions,
    actualValues: y,
    equation: generateEquation(dependent.name, independent[0].name, slope, intercept),
    confidence: {
      upper: predictions.map(p => p + 1.96 * Math.sqrt(mse)),
      lower: predictions.map(p => p - 1.96 * Math.sqrt(mse))
    },
    metrics
  };
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
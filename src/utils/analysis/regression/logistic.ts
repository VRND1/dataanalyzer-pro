import { DataField } from '@/types/data';
import { RegressionResult } from './types';
import { standardize, calculateRobustStandardError, getTValue, calculateRegressionMetrics } from './utils';

export function calculateLogisticRegression(
  dependent: DataField,
  independent: DataField,
  maxIterations: number = 1000,
  tolerance: number = 1e-4,
  learningRate: number = 0.01
): RegressionResult {
  // y should be 0/1, x standardized OK
  const y = dependent.value as number[];
  const x = standardize(independent.value as number[]);
  
  const n = Math.min(x.length, y.length);
  
  // Initialize coefficients
  let b0 = 0, b1 = 0;
  
  // Gradient descent for logistic regression
  for (let iter = 0; iter < maxIterations; iter++) {
    // predictions using sigmoid
    const p = x.map((xi) => 1 / (1 + Math.exp(-(b0 + b1 * xi))));
    
    // gradients (negative log-likelihood)
    const g0 = p.reduce((a, pi, i) => a + (pi - y[i]), 0);
    const g1 = p.reduce((a, pi, i) => a + (pi - y[i]) * x[i], 0);
    
    // simple step
    b0 -= learningRate * g0 / n;
    b1 -= learningRate * g1 / n;
    
    if (Math.abs(learningRate * g0 / n) + Math.abs(learningRate * g1 / n) < tolerance) break;
  }
  
  // Calculate final predictions
  const predictions = x.map((xi) => 1 / (1 + Math.exp(-(b0 + b1 * xi))));
  
  // Calculate classification metrics instead of R²
  const accuracy = y.reduce((acc, yi, i) => acc + (Math.round(predictions[i]) === yi ? 1 : 0), 0) / n;
  const logLoss = -y.reduce((sum, yi, i) => {
    const p = Math.max(1e-15, Math.min(1 - 1e-15, predictions[i]));
    return sum + (yi * Math.log(p) + (1 - yi) * Math.log(1 - p));
  }, 0) / n;
  
  // Calculate robust standard error
  const standardError = calculateRobustStandardError(y, predictions, 1000);
  
  // Calculate confidence intervals
  const tValue = getTValue(n - 2, 0.975); // 95% confidence level
  
  // Calculate prediction intervals (clamped to [0,1])
  const confidence = {
    upper: predictions.map(pred => Math.min(1, pred + tValue * standardError)),
    lower: predictions.map(pred => Math.max(0, pred - tValue * standardError))
  };
  
  // Calculate additional metrics
  const metrics = calculateRegressionMetrics(y, predictions);
  
  // Add classification-specific metrics
  metrics.accuracy = accuracy;
  metrics.logLoss = logLoss;
  
  return {
    field: dependent.name,
    type: 'logistic',
    coefficients: [b1], // Exclude intercept
    intercept: b0,
    rSquared: accuracy, // Use accuracy instead of R² for classification
    standardError,
    predictions,
    actualValues: y,
    equation: `${dependent.name} = 1 / (1 + exp(-(${b0.toFixed(3)} + ${b1.toFixed(3)}×${independent.name})))`,
    confidence,
    metrics: {
      ...metrics,
      r2Score: accuracy, // Add r2Score for UI compatibility
      adjustedR2: accuracy // For logistic, use accuracy as adjusted R² too
    }
  };
} 
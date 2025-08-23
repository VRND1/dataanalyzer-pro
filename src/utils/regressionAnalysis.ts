// Import unified metric calculations from MLFormulas
import { calculateRSquared, calculateRMSE, calculateMAE, calculateStandardError } from './analysis/ml/MLFormulas';

// Import zFor function from Holt calculations
import { zFor } from './analysis/timeSeries/holtCalculations';

export interface RegressionMetrics {
  r2: number;
  rmse: number;
  mae: number;
  stdError: number;
  confidence: {
    upper: number[];
    lower: number[];
  };
}

// Re-export for backward compatibility
export { calculateRSquared, calculateRMSE, calculateMAE, calculateStandardError };

export const calculateConfidenceIntervals = (
  predictions: number[],
  standardError: number,
  confidence: number = 0.95
): { upper: number[]; lower: number[] } => {
  const zScore = zFor(confidence);
  return {
    upper: predictions.map(p => p + zScore * standardError),
    lower: predictions.map(p => p - zScore * standardError)
  };
};

export const calculateRegressionMetrics = (
  actual: number[],
  predicted: number[]
): RegressionMetrics => {
  if (actual.length !== predicted.length) {
    throw new Error('Actual and predicted arrays must be the same length');
  }

  const { r2Score: r2 } = calculateRSquared(actual, predicted);
  const { rmse } = calculateRMSE(actual, predicted);
  const { mae } = calculateMAE(actual, predicted);
  const stdError = calculateStandardError(actual, predicted);
  const confidence = calculateConfidenceIntervals(predicted, stdError);

  return { r2, rmse, mae, stdError, confidence };
}; 
import { DataField } from '@/types/data';
import { RegressionResult } from './types';
import { standardize, calculateRobustStandardError, getTValue, calculateRegressionMetrics, addCrossValidationToMetrics } from './utils';

export function calculateRidgeRegression(
  dependent: DataField,
  independent: DataField,
  alpha: number = 0.1,
  crossValidationFolds: number = 5
): RegressionResult {
  // Standardize values for numerical stability
  const y = standardize(dependent.value as number[]);
  const x = standardize(independent.value as number[]);
  
  const n = Math.min(x.length, y.length);
  
  // Ridge Regression: Minimizes ||y - Xβ||² + α||β||²
  // The L2 penalty shrinks coefficients toward zero but never exactly to zero
  
  // Compute Gram matrix and RHS with explicit dot products
  const XTX00 = n;                 // sum(1*1)
  const XTX01 = x.reduce((a, b) => a + b, 0);
  const XTX11 = x.reduce((a, b) => a + b * b, 0);
  const XTy0 = y.reduce((a, b) => a + b, 0);
  const XTy1 = x.reduce((a, b, i) => a + b * y[i], 0);
  
  // Ridge adjustment: add alpha to slope term only (no penalty on intercept)
  const A00 = XTX00;          // no penalty on intercept
  const A01 = XTX01;
  const A10 = XTX01;
  const A11 = XTX11 + alpha;  // L2 penalty on slope: shrinks toward zero
  
  // Solve 2×2 system: (X'X + αI)β = X'y
  const det = A00 * A11 - A01 * A10;
  const beta0 = (XTy0 * A11 - A01 * XTy1) / det;
  const beta1 = (-XTy0 * A10 + A00 * XTy1) / det;
  
  // Calculate predictions
  const predictions = x.map(xi => beta0 + beta1 * xi);
  
  // Calculate metrics
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  const totalSS = y.reduce((ss, yi) => ss + Math.pow(yi - meanY, 2), 0);
  const residualSS = y.reduce((ss, yi, i) => ss + Math.pow(yi - predictions[i], 2), 0);
  const rSquared = 1 - (residualSS / totalSS);
  
  // Calculate robust standard error
  const standardError = calculateRobustStandardError(y, predictions, 1000);
  
  // Calculate confidence intervals
  const tValue = getTValue(n - 2, 0.975); // 95% confidence level
  
  // Calculate prediction intervals
  const confidence = {
    upper: predictions.map(pred => pred + tValue * standardError),
    lower: predictions.map(pred => pred - tValue * standardError)
  };
  
  // Calculate additional metrics
  const metrics = calculateRegressionMetrics(y, predictions);
  
  // Add cross-validation
  const { crossValidationScore, crossValidationDetails } = addCrossValidationToMetrics(
    x, y, crossValidationFolds,
    (xTrain, yTrain) => {
      // Ridge regression for cross-validation
      const nTrain = xTrain.length;
      const XTX00 = nTrain;
      const XTX01 = xTrain.reduce((a, b) => a + b, 0);
      const XTX11 = xTrain.reduce((a, b) => a + b * b, 0);
      const XTy0 = yTrain.reduce((a, b) => a + b, 0);
      const XTy1 = xTrain.reduce((a, b, i) => a + b * yTrain[i], 0);
      
      const A00 = XTX00;
      const A01 = XTX01;
      const A10 = XTX01;
      const A11 = XTX11 + alpha;
      
      const det = A00 * A11 - A01 * A10;
      const beta0 = (XTy0 * A11 - A01 * XTy1) / det;
      const beta1 = (-XTy0 * A10 + A00 * XTy1) / det;
      
      return { coefficients: [beta0, beta1] };
    }
  );
  
  // Generate equation string with regularization info
  const equation = `${dependent.name} = ${beta0.toFixed(3)} + ${beta1.toFixed(3)}×${independent.name} (Ridge α=${alpha})`;
  
  return {
    field: dependent.name,
    type: 'ridge',
    coefficients: [beta1], // Exclude intercept
    intercept: beta0,
    rSquared,
    standardError,
    predictions,
    actualValues: y,
    equation,
    confidence,
    metrics: {
      ...metrics,
      r2Score: rSquared, // Add r2Score for UI compatibility
      adjustedR2: metrics.rSquaredAdj, // Add adjustedR2 for UI compatibility
      crossValidationScore, // Add cross-validation score
      crossValidationDetails // Add detailed cross-validation results
    }
  };
} 
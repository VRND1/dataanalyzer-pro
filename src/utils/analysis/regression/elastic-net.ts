import { DataField } from '@/types/data';
import { RegressionResult } from './types';
import { standardize, calculateRobustStandardError, getTValue, calculateRegressionMetrics, addCrossValidationToMetrics } from './utils';

export function calculateElasticNetRegression(
  dependent: DataField,
  independent: DataField,
  alpha: number = 0.1,
  l1Ratio: number = 0.5,
  crossValidationFolds: number = 5,
  maxIterations: number = 1000,
  tolerance: number = 1e-6
): RegressionResult {
  // Standardize values for numerical stability
  const y = standardize(dependent.value as number[]);
  const x = standardize(independent.value as number[]);
  
  const n = Math.min(x.length, y.length);
  
  // Initialize coefficients
  let b0 = 0, b1 = 0; // intercept, slope
  
  // Coordinate descent for Elastic Net
  for (let iter = 0; iter < maxIterations; iter++) {
    // Update intercept (no penalty)
    const r = y.map((yi, i) => yi - (b0 + b1 * x[i]));
    b0 += r.reduce((a, v) => a + v, 0) / n;
    
    // Update slope with combined penalty
    const rNoSlope = y.map((yi, _i) => yi - b0);
    const rho = x.reduce((acc, xi, i) => acc + xi * rNoSlope[i], 0);
    
    // Elastic Net: soft-threshold with combined penalty
    const z = x.reduce((a, xi) => a + xi * xi, 0) + (alpha * (1 - l1Ratio)); // L2 part in denominator
    const s = alpha * l1Ratio; // L1 part
    const soft = (v: number, s: number) => (v > s ? v - s : (v < -s ? v + s : 0));
    const b1New = soft(rho, s) / z;
    
    if (Math.abs(b1New - b1) < tolerance) break;
    b1 = b1New;
  }
  
  // Calculate predictions
  const predictions = x.map(xi => b0 + b1 * xi);
  
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
      // Elastic Net regression for cross-validation
      let b0 = 0, b1 = 0;
      const nTrain = xTrain.length;
      
      for (let iter = 0; iter < maxIterations; iter++) {
        const r = yTrain.map((yi, i) => yi - (b0 + b1 * xTrain[i]));
        b0 += r.reduce((a, v) => a + v, 0) / nTrain;
        
        const rNoSlope = yTrain.map((yi, _i) => yi - b0);
        const rho = xTrain.reduce((acc, xi, i) => acc + xi * rNoSlope[i], 0);
        
        const z = xTrain.reduce((a, xi) => a + xi * xi, 0) + (alpha * (1 - l1Ratio));
        const s = alpha * l1Ratio;
        const soft = (v: number, s: number) => (v > s ? v - s : (v < -s ? v + s : 0));
        const b1New = soft(rho, s) / z;
        
        if (Math.abs(b1New - b1) < tolerance) break;
        b1 = b1New;
      }
      
      return { coefficients: [b0, b1] };
    }
  );
  
  // Generate equation string
  const equation = `${dependent.name} = ${b0.toFixed(3)} + ${b1.toFixed(3)}×${independent.name} (α=${alpha}, l1Ratio=${l1Ratio})`;
  
  return {
    field: dependent.name,
    type: 'elastic-net',
    coefficients: [b1], // Exclude intercept
    intercept: b0,
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
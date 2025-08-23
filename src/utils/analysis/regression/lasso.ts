import { DataField } from '@/types/data';
import { RegressionResult } from './types';
import { standardize, calculateRobustStandardError, getTValue, calculateRegressionMetrics, addCrossValidationToMetrics } from './utils';

export function calculateLassoRegression(
  dependent: DataField,
  independent: DataField,
  alpha: number = 0.1,
  crossValidationFolds: number = 5,
  maxIterations: number = 1000,
  tolerance: number = 1e-4
): RegressionResult {
  // Standardize values for numerical stability
  const y = standardize(dependent.value as number[]);
  const x = standardize(independent.value as number[]);
  
  const n = Math.min(x.length, y.length);
  
  // Lasso Regression: Minimizes ||y - Xβ||² + α||β||₁
  // The L1 penalty can set coefficients exactly to zero (feature selection)
  
  // Initialize coefficients
  let b0 = 0, b1 = 0; // intercept, slope
  
  // Coordinate descent with soft-thresholding (no penalty on intercept)
  for (let iter = 0; iter < maxIterations; iter++) {
    // Update intercept (no penalty)
    // residual r = y - b0 - b1*x
    const r = y.map((yi, i) => yi - (b0 + b1 * x[i]));
    b0 += r.reduce((a, v) => a + v, 0) / n;
    
    // Update slope with L1 penalty
    const rNoSlope = y.map((yi, _i) => yi - b0);
    const rho = x.reduce((acc, xi, i) => acc + xi * rNoSlope[i], 0);
    const z = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    // Soft-thresholding operator: S(z, λ) = sign(z) * max(|z| - λ, 0)
    const s = alpha / 2; // L1 penalty parameter
    const soft = (v: number, s: number) => {
      if (v > s) return v - s;
      if (v < -s) return v + s;
      return 0; // This is the key difference: Lasso can zero out coefficients
    };
    const b1New = soft(rho, s) / z;
    
    // Check convergence
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
      // Lasso regression for cross-validation
      let b0 = 0, b1 = 0;
      const nTrain = xTrain.length;
      
      for (let iter = 0; iter < maxIterations; iter++) {
        const r = yTrain.map((yi, i) => yi - (b0 + b1 * xTrain[i]));
        b0 += r.reduce((a, v) => a + v, 0) / nTrain;
        
        const rNoSlope = yTrain.map((yi, _i) => yi - b0);
        const rho = xTrain.reduce((acc, xi, i) => acc + xi * rNoSlope[i], 0);
        const z = xTrain.reduce((acc, xi) => acc + xi * xi, 0);
        const s = alpha;
        const soft = (v: number, s: number) => (v > s ? v - s : (v < -s ? v + s : 0));
        const b1New = soft(rho, s) / z;
        
        if (Math.abs(b1New - b1) < tolerance) break;
        b1 = b1New;
      }
      
      return { coefficients: [b0, b1] };
    }
  );
  
  // Generate equation string with regularization info
  const equation = `${dependent.name} = ${b0.toFixed(3)} + ${b1.toFixed(3)}×${independent.name} (Lasso α=${alpha})`;
  
  return {
    field: dependent.name,
    type: 'lasso',
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
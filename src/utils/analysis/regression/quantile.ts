import { DataField } from '@/types/data';
import { RegressionResult } from './types';
import { standardize, calculateRobustStandardError, getTValue, calculateRegressionMetrics, addCrossValidationToMetrics } from './utils';

export function calculateQuantileRegression(
  dependent: DataField,
  independent: DataField,
  quantile: number = 0.5,
  crossValidationFolds: number = 5,
  maxIterations: number = 1000,
  tolerance: number = 1e-4,
  learningRate: number = 0.01
): RegressionResult {
  // Standardize values for numerical stability
  const y = standardize(dependent.value as number[]);
  const x = standardize(independent.value as number[]);
  
  const n = Math.min(x.length, y.length);
  
  // Initialize coefficients
  let b0 = 0, b1 = 0;
  
  // Simple subgradient update for median (τ=0.5) as an illustration
  const tau = quantile;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    let g0 = 0, g1 = 0;
    
    for (let i = 0; i < n; i++) {
      const e = y[i] - (b0 + b1 * x[i]);
      const sub = (e > 0 ? tau : tau - 1); // subgradient of check loss
      g0 -= sub;
      g1 -= sub * x[i];
    }
    
    b0 -= learningRate * g0 / n;
    b1 -= learningRate * g1 / n;
    
    if (Math.abs(g0) + Math.abs(g1) < tolerance) break;
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
      // Quantile regression for cross-validation
      let b0 = 0, b1 = 0;
      const nTrain = xTrain.length;
      const tau = quantile;
      
      for (let iter = 0; iter < maxIterations; iter++) {
        let g0 = 0, g1 = 0;
        
        for (let i = 0; i < nTrain; i++) {
          const e = yTrain[i] - (b0 + b1 * xTrain[i]);
          const sub = (e > 0 ? tau : tau - 1);
          g0 -= sub;
          g1 -= sub * xTrain[i];
        }
        
        b0 -= learningRate * g0 / nTrain;
        b1 -= learningRate * g1 / nTrain;
        
        if (Math.abs(g0) + Math.abs(g1) < tolerance) break;
      }
      
      return { coefficients: [b0, b1] };
    }
  );
  
  // Generate equation string (commented out as unused)
  // const equation = `Q${quantile}(${dependent.name}) = ${b0.toFixed(3)} + ${b1.toFixed(3)}×${independent.name}`;
  
  return {
    field: dependent.name,
    type: 'quantile',
    coefficients: [b1], // Exclude intercept
    intercept: b0,
    rSquared,
    standardError,
    predictions,
    actualValues: y,
    equation: `Q${quantile}(${dependent.name}) = ${b0.toFixed(3)} + ${b1.toFixed(3)}×${independent.name}`,
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
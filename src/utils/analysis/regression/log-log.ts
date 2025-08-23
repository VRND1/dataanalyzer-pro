import { DataField } from '@/types/data';
import { RegressionResult } from './types';
import { calculateRobustStandardError, getTValue, calculateRegressionMetrics, addCrossValidationToMetrics } from './utils';

export function calculateLogLogRegression(
  dependent: DataField,
  independent: DataField,
  crossValidationFolds: number = 5
): RegressionResult {
  // Check for non-positive values
  const yRaw = dependent.value as number[];
  const xRaw = independent.value as number[];
  
  // Filter out non-positive values
  const valid: number[] = [];
  for (let i = 0; i < yRaw.length; i++) {
    if (yRaw[i] > 0 && xRaw[i] > 0) {
      valid.push(i);
    }
  }
  
  if (valid.length < 2) {
    throw new Error('Log-log regression requires positive values for both dependent and independent variables');
  }
  
  // Extract valid data
  const yv = valid.map(i => Math.log(yRaw[i]));
  const xv = valid.map(i => Math.log(xRaw[i]));
  
  const n = yv.length;
  
  // OLS on log–log
  const xMean = xv.reduce((sum, xi) => sum + xi, 0) / n;
  const yMean = yv.reduce((sum, yi) => sum + yi, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = xv[i] - xMean;
    numerator += xDiff * (yv[i] - yMean);
    denominator += xDiff * xDiff;
  }
  
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;
  
  // Calculate predictions in log space
  const logPredictions = xv.map(xi => intercept + slope * xi);
  
  // Transform back to original space: ŷ = exp(intercept) * x^slope
  const predictions = logPredictions.map(logPred => Math.exp(logPred));
  
  // Calculate metrics in original space
  const meanY = yRaw.filter((_, i) => valid.includes(i)).reduce((a, b) => a + b, 0) / n;
  const totalSS = yRaw.filter((_, i) => valid.includes(i)).reduce((ss, yi) => ss + Math.pow(yi - meanY, 2), 0);
  const residualSS = yRaw.filter((_, i) => valid.includes(i)).reduce((ss, yi, i) => ss + Math.pow(yi - predictions[i], 2), 0);
  const rSquared = 1 - (residualSS / totalSS);
  
  // Calculate robust standard error
  const standardError = calculateRobustStandardError(
    yRaw.filter((_, i) => valid.includes(i)), 
    predictions, 
    1000
  );
  
  // Calculate confidence intervals
  const tValue = getTValue(n - 2, 0.975); // 95% confidence level
  
  // Calculate prediction intervals
  const confidence = {
    upper: predictions.map(pred => pred * Math.exp(tValue * standardError)),
    lower: predictions.map(pred => pred / Math.exp(tValue * standardError))
  };
  
  // Calculate additional metrics
  const metrics = calculateRegressionMetrics(
    yRaw.filter((_, i) => valid.includes(i)), 
    predictions
  );
  
  // Add cross-validation
  const { crossValidationScore, crossValidationDetails } = addCrossValidationToMetrics(
    xv, yv, crossValidationFolds,
    (xTrain, yTrain) => {
      // Log-log regression for cross-validation
      const nTrain = xTrain.length;
      const xMean = xTrain.reduce((sum, xi) => sum + xi, 0) / nTrain;
      const yMean = yTrain.reduce((sum, yi) => sum + yi, 0) / nTrain;
      
      let numerator = 0;
      let denominator = 0;
      
      for (let i = 0; i < nTrain; i++) {
        const xDiff = xTrain[i] - xMean;
        numerator += xDiff * (yTrain[i] - yMean);
        denominator += xDiff * xDiff;
      }
      
      const slope = numerator / denominator;
      const intercept = yMean - slope * xMean;
      
      return { coefficients: [intercept, slope] };
    }
  );
  
  // Generate equation string
  const equation = `ln(${dependent.name}) = ${intercept.toFixed(3)} + ${slope.toFixed(3)}×ln(${independent.name})`;
  
  return {
    field: dependent.name,
    type: 'log-log',
    coefficients: [slope], // Exclude intercept
    intercept: Math.exp(intercept), // Transform back to original space
    rSquared,
    standardError,
    predictions,
    actualValues: yRaw.filter((_, i) => valid.includes(i)),
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
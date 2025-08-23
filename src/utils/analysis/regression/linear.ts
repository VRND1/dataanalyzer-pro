import { DataField } from '@/types/data';
import { RegressionResult } from './types';
import { standardize, calculateRobustStandardError, getTValue, calculateRegressionMetrics, crossValidateRegression } from './utils';

export function calculateLinearRegression(
  dependent: DataField,
  independent: DataField,
  crossValidationFolds: number = 5
): RegressionResult {
  // Standardize values for numerical stability
  const y = standardize(dependent.value as number[]);
  const x = standardize(independent.value as number[]);

  // Calculate regression coefficients using explicit dot products
  const n = Math.min(x.length, y.length);
  
  // Compute Gram matrix and RHS with explicit dot products
  const XTX00 = n;                 // sum(1*1)
  const XTX01 = x.reduce((a, b) => a + b, 0);
  const XTX11 = x.reduce((a, b) => a + b * b, 0);
  const XTy0 = y.reduce((a, b) => a + b, 0);
  const XTy1 = x.reduce((a, b, i) => a + b * y[i], 0);
  
  // Solve 2×2 system
  const det = XTX00 * XTX11 - XTX01 * XTX01;
  const beta0 = (XTy0 * XTX11 - XTX01 * XTy1) / det;
  const beta1 = (-XTy0 * XTX01 + XTX00 * XTy1) / det;

  // Calculate predictions with confidence intervals
  const predictions = x.map(xi => beta0 + beta1 * xi);

  // Calculate R-squared
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  const totalSS = y.reduce((ss, yi) => ss + Math.pow(yi - meanY, 2), 0);
  const residualSS = y.reduce((ss, yi, i) => ss + Math.pow(yi - predictions[i], 2), 0);
  const rSquared = 1 - (residualSS / totalSS);

  // Calculate robust standard error using bootstrapping
  const standardError = calculateRobustStandardError(y, predictions, 1000);

  // Calculate confidence intervals
  const tValue = getTValue(n - 2, 0.975); // 95% confidence level

  const confidence = {
    upper: predictions.map((pred, i) => 
      pred + tValue * standardError * Math.sqrt(1/n + Math.pow(x[i] - x.reduce((a, b) => a + b, 0)/n, 2)/XTX11)
    ),
    lower: predictions.map((pred, i) => 
      pred - tValue * standardError * Math.sqrt(1/n + Math.pow(x[i] - x.reduce((a, b) => a + b, 0)/n, 2)/XTX11)
    )
  };

  // Calculate additional metrics for model validation
  const metrics = calculateRegressionMetrics(y, predictions, 2);

  // Perform cross-validation if enough data points
  let crossValidationScore: number | undefined = undefined;
  let crossValidationDetails: { 
    foldScores: number[]; 
    foldRMSE: number[]; 
    foldMAE: number[]; 
    meanScore: number; 
    meanRMSE: number; 
    meanMAE: number; 
    stdScore: number; 
    stdRMSE: number; 
    stdMAE: number; 
  } | undefined = undefined;
  
  if (n >= crossValidationFolds * 2) {
    try {
      const cvResult = crossValidateRegression(
        x, 
        y, 
        crossValidationFolds,
        (xTrain, yTrain) => {
          // Simple linear regression for cross-validation
          const nTrain = xTrain.length;
          const sumX = xTrain.reduce((a, b) => a + b, 0);
          const sumY = yTrain.reduce((a, b) => a + b, 0);
          const sumXY = xTrain.reduce((a, b, i) => a + b * yTrain[i], 0);
          const sumX2 = xTrain.reduce((a, b) => a + b * b, 0);
          
          const slope = (nTrain * sumXY - sumX * sumY) / (nTrain * sumX2 - sumX * sumX);
          const intercept = (sumY - slope * sumX) / nTrain;
          
          return { coefficients: [intercept, slope] };
        }
      );
      
             crossValidationScore = cvResult.avgMetrics.r2Score;
       crossValidationDetails = {
         foldScores: cvResult.metrics.map(m => m.r2Score),
         foldRMSE: cvResult.metrics.map(m => m.rmse),
         foldMAE: cvResult.metrics.map(m => m.mae),
         meanScore: cvResult.avgMetrics.r2Score,
         meanRMSE: cvResult.avgMetrics.rmse,
         meanMAE: cvResult.avgMetrics.mae,
         stdScore: Math.sqrt(cvResult.metrics.reduce((acc, m) => acc + Math.pow(m.r2Score - cvResult.avgMetrics.r2Score, 2), 0) / crossValidationFolds),
         stdRMSE: Math.sqrt(cvResult.metrics.reduce((acc, m) => acc + Math.pow(m.rmse - cvResult.avgMetrics.rmse, 2), 0) / crossValidationFolds),
         stdMAE: Math.sqrt(cvResult.metrics.reduce((acc, m) => acc + Math.pow(m.mae - cvResult.avgMetrics.mae, 2), 0) / crossValidationFolds)
       };
    } catch (error) {
      console.warn('Cross-validation failed:', error);
    }
  }

  return {
    field: dependent.name,
    type: 'linear',
    coefficients: [beta1],
    intercept: beta0,
    rSquared,
    standardError,
    predictions,
    actualValues: y,
    equation: `${dependent.name} = ${beta0.toFixed(3)} + ${beta1.toFixed(3)}×${independent.name}`,
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
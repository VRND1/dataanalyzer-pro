import { RegressionMetrics } from './types';

/**
 * Standardizes a dataset by subtracting the mean and dividing by standard deviation
 */
export function standardize(data: number[]): number[] {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
  const std = Math.sqrt(variance);
  
  return data.map(x => (x - mean) / std);
}

/**
 * Calculates robust standard error using bootstrapping
 */
export function calculateRobustStandardError(
  actual: number[],
  predicted: number[],
  iterations: number = 1000
): number {
  const n = actual.length;
  const residuals = actual.map((yi, i) => yi - predicted[i]);
  
  let bootstrapErrors: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    // Generate bootstrap sample
    const indices = Array.from({ length: n }, () => Math.floor(Math.random() * n));
    const bootstrapResiduals = indices.map(idx => residuals[idx]);
    
    // Calculate standard error for this sample
    const mean = bootstrapResiduals.reduce((a, b) => a + b, 0) / n;
    const variance = bootstrapResiduals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    bootstrapErrors.push(Math.sqrt(variance));
  }
  
  // Return the median of bootstrap standard errors
  return bootstrapErrors.sort((a, b) => a - b)[Math.floor(iterations / 2)];
}

/**
 * Gets t-value for given degrees of freedom and confidence level
 */
export function getTValue(df: number, confidence: number): number {
  // Simplified t-distribution approximation
  // For more accurate values, consider using a statistical library
  const z = Math.abs(Math.sqrt(2 * Math.log(1 / (1 - confidence))));
  return z * (1 + (1 + z * z) / (4 * df));
}

/**
 * Calculates comprehensive regression metrics
 */
export function calculateRegressionMetrics(
  actual: number[],
  predicted: number[],
  numFeatures?: number
): RegressionMetrics {
  const n = actual.length;
  const residuals = actual.map((yi, i) => yi - predicted[i]);
  
  // Basic metrics
  const mse = residuals.reduce((acc, r) => acc + r * r, 0) / n;
  const rmse = Math.sqrt(mse);
  const mae = residuals.reduce((acc, r) => acc + Math.abs(r), 0) / n;
  
  // R-squared and adjusted R-squared
  const meanY = actual.reduce((a, b) => a + b, 0) / n;
  const totalSS = actual.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0);
  const residualSS = residuals.reduce((acc, r) => acc + r * r, 0);
  const rSquared = 1 - (residualSS / totalSS);
  let rSquaredAdj;
  if (numFeatures !== undefined) {
    rSquaredAdj = 1 - ((1 - rSquared) * (n - 1)) / (n - numFeatures - 1);
  } else {
    rSquaredAdj = 1 - ((1 - rSquared) * (n - 1)) / (n - 2);
  }
  
  // Information criteria
  const k = numFeatures !== undefined ? numFeatures : 2; // number of parameters (slope and intercept)
  const aic = n * Math.log(mse) + 2 * k;
  const bic = n * Math.log(mse) + Math.log(n) * k;
  
  // Durbin-Watson test for autocorrelation
  const dw = residuals.slice(1).reduce((acc, curr, i) => 
    acc + Math.pow(curr - residuals[i], 2), 0) / residualSS;
  
  return {
    mse,
    rmse,
    mae,
    rSquared,
    r2Score: rSquared, // Add r2Score for UI compatibility
    rSquaredAdj,
    adjustedR2: rSquaredAdj, // Add adjustedR2 for UI compatibility
    aic,
    bic,
    durbinWatson: dw
  };
}

// Import unified metric calculations from MLFormulas
import { calculateRSquared } from '../ml/MLFormulas';

// Re-export for backward compatibility
export { calculateRSquared };

export function calculateAIC(n: number, mse: number, p: number): number {
  return n * Math.log(mse) + 2 * p;
}

export function calculateBIC(n: number, mse: number, p: number): number {
  return n * Math.log(mse) + Math.log(n) * p;
}

export function calculateConfidenceIntervals(
  predictions: number[],
  residuals: number[],
  confidence = 0.95
): {
  upper: number[];
  lower: number[];
} {
  const n = predictions.length;
  const standardError = Math.sqrt(
    residuals.reduce((acc, r) => acc + r * r, 0) / (n - 2)
  );
  const tValue = getTValue(n - 2, 1 - (1 - confidence) / 2);
  const margin = tValue * standardError;
  
  return {
    upper: predictions.map(p => p + margin),
    lower: predictions.map(p => p - margin)
  };
}

export function calculateDurbinWatson(residuals: number[]): number {
  let numerator = 0;
  for (let i = 1; i < residuals.length; i++) {
    numerator += Math.pow(residuals[i] - residuals[i - 1], 2);
  }
  const denominator = residuals.reduce((sum, r) => sum + Math.pow(r, 2), 0);
  return numerator / denominator;
}

/**
 * Performs k-fold cross-validation for a regression model.
 * @param x - Feature array
 * @param y - Target array
 * @param k - Number of folds (default 5)
 * @param regressionFn - Function to train and return coefficients (e.g., performLinearRegression)
 * @returns Object with metrics for each fold and their average
 */
export function crossValidateRegression(
  x: number[],
  y: number[],
  k: number = 5,
  regressionFn: (xTrain: number[], yTrain: number[]) => { coefficients: number[] }
) {
  const n = x.length;
  if (n !== y.length || n < k) {
    throw new Error('Invalid input lengths or not enough data for k folds');
  }
  const indices = Array.from({ length: n }, (_, i) => i);
  // Shuffle indices
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const foldSize = Math.floor(n / k);
  const metrics: any[] = [];
  for (let fold = 0; fold < k; fold++) {
    const testIdx = indices.slice(fold * foldSize, (fold + 1) * foldSize);
    const trainIdx = indices.filter(idx => !testIdx.includes(idx));
    const xTrain = trainIdx.map(i => x[i]);
    const yTrain = trainIdx.map(i => y[i]);
    const xTest = testIdx.map(i => x[i]);
    const yTest = testIdx.map(i => y[i]);
    const { coefficients } = regressionFn(xTrain, yTrain);
    const yPred = linearRegressionPredictFromCoefficients(coefficients, xTest);
    const foldMetrics = calculateRegressionMetrics(yTest, yPred, 1);
    metrics.push(foldMetrics);
  }
  // Average metrics
  const avgMetrics = metrics.reduce((acc, m) => ({
    r2Score: acc.r2Score + m.r2Score / k,
    rmse: acc.rmse + m.rmse / k,
    mae: acc.mae + m.mae / k,
    adjustedR2: acc.adjustedR2 + m.adjustedR2 / k,
  }), { r2Score: 0, rmse: 0, mae: 0, adjustedR2: 0 });
  return { metrics, avgMetrics };
}

/**
 * Helper function to predict using linear regression coefficients.
 * @param coefficients - [intercept, slope]
 * @param xTest - Test feature array
 * @returns Predicted values for xTest
 */
function linearRegressionPredictFromCoefficients(coefficients: number[], xTest: number[]): number[] {
  const [intercept, slope] = coefficients;
  return xTest.map(x => intercept + slope * x);
}

/**
 * Helper function to add cross-validation to any regression model
 */
export function addCrossValidationToMetrics(
  x: number[],
  y: number[],
  crossValidationFolds: number,
  regressionFn: (xTrain: number[], yTrain: number[]) => { coefficients: number[] }
  // predictFn: (coefficients: number[], xTest: number[]) => number[] // Unused parameter
) {
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
  
  const n = Math.min(x.length, y.length);
  
  if (n >= crossValidationFolds * 2) {
    try {
      const cvResult = crossValidateRegression(
        x, 
        y, 
        crossValidationFolds,
        regressionFn
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
  
  return { crossValidationScore, crossValidationDetails };
}
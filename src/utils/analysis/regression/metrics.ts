// @ts-ignore
import { jStat } from 'jstat';


/**
 * Regression Metrics and Analysis Functions
 * 
 * This module provides comprehensive regression analysis tools including:
 * - Linear and polynomial regression
 * - Various regression metrics (R², Adjusted R², RMSE, MAE, etc.)
 * - Matrix operations for solving normal equations
 * - T-distribution based confidence intervals and hypothesis testing
 * 
 * Degrees of Freedom Notes:
 * - For simple linear regression: p = 2 (intercept + slope)
 * - For polynomial regression of degree d: p = d + 1 (including intercept)
 * - Adjusted R² uses (n - p - 1) degrees of freedom
 * - Standard error uses (n - p - 1) degrees of freedom
 * - T-distribution uses (n - p - 1) degrees of freedom
 * 
 * All calculations are consistent with standard statistical formulas.
 */

// Matrix operations helper functions
function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

function multiply(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

function solve(A: number[][], b: number[][]): number[][] {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i][0]]);
  
  // Gaussian elimination
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = j;
      }
    }
    
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    
    for (let j = i + 1; j < n; j++) {
      const factor = augmented[j][i] / augmented[i][i];
      for (let k = i; k <= n; k++) {
        augmented[j][k] -= factor * augmented[i][k];
      }
    }
  }
  
  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += augmented[i][j] * x[j];
    }
    x[i] = (augmented[i][n] - sum) / augmented[i][i];
  }
  
  return x.map(xi => [xi]);
}

interface RegressionMetrics {
  r2Score: number;
  rmse: number;
  mae: number;
  adjustedR2: number;
}

/**
 * Calculates regression metrics for a given field
 */
export function calculateRegressionMetrics(
  actual: number[],
  predicted: number[],
  numFeatures: number = 1
): RegressionMetrics {
  if (actual.length !== predicted.length || actual.length === 0) {
    return {
      r2Score: NaN,
      rmse: NaN,
      mae: NaN,
      adjustedR2: NaN
    };
  }

  const n = actual.length;
  const residuals = actual.map((y, i) => y - predicted[i]);
  
  // Enhanced metrics using the ML Formulas
  
  // 5. MAE (Mean Absolute Error) - Formula: MAE = (1/n) * Σ|y_i - ŷ_i|
  const mae = residuals.reduce((acc, r) => acc + Math.abs(r), 0) / n;
  
  // 4. R² Score (Coefficient of Determination) - Formula: R² = 1 - [Σ(y_i - ŷ_i)² / Σ(y_i - ȳ)²]
  const meanActual = actual.reduce((sum, val) => sum + val, 0) / n;
  const ssResidual = residuals.reduce((acc, r) => acc + r * r, 0);
  const ssTotal = actual.reduce((acc, val) => acc + Math.pow(val - meanActual, 2), 0);
  const rSquared = ssTotal === 0 ? 1 : 1 - (ssResidual / ssTotal);
  
  // Basic metrics
  const mse = residuals.reduce((acc, r) => acc + r * r, 0) / n;
  const rmse = Math.sqrt(mse);
  
  const adjustedR2 = calculateAdjustedRSquared(actual, predicted, numFeatures);
  
  console.log('=== Enhanced Regression Metrics ===');
  console.log('MAE (using formula):', mae);
  console.log('R² Score (using formula):', rSquared);
  console.log('SS Residual:', ssResidual);
  console.log('SS Total:', ssTotal);
  console.log('Mean Actual:', meanActual);
  console.log('==============================');
  
  return {
    r2Score: rSquared,
    rmse,
    mae,
    adjustedR2
  };
}

/**
 * Returns dynamic t-critical value for any confidence level
 */
export function getTValue(degreesOfFreedom: number, confidenceLevel: number): number {
  const alpha = 1 - confidenceLevel;
  return jStat.studentt.inv(1 - alpha / 2, degreesOfFreedom); // two-tailed
}

/**
 * Calculates the standard error of regression coefficients
 * SE(βᵢ) = sqrt(MSE / Σ(xᵢ - x̄)²)
 */
function calculateCoefficientStandardError(
  x: number[],
  residuals: number[],
  numParameters: number
): number[] {
  const n = x.length;
  const degreesOfFreedom = n - numParameters - 1;
  const mse = residuals.reduce((sum, r) => sum + r * r, 0) / degreesOfFreedom;
  
  const xMean = x.reduce((sum, xi) => sum + xi, 0) / n;
  const sumSquaredDeviations = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
  
  // For simple linear regression: intercept and slope standard errors
  const slopeSE = Math.sqrt(mse / sumSquaredDeviations);
  const interceptSE = Math.sqrt(mse * (1/n + Math.pow(xMean, 2) / sumSquaredDeviations));
  
  return [interceptSE, slopeSE];
}

/**
 * Calculates t-statistics for regression coefficients
 * t = βᵢ / SE(βᵢ)
 */
function calculateTStatistics(
  coefficients: number[],
  standardErrors: number[]
): number[] {
  return coefficients.map((coef, i) => coef / standardErrors[i]);
}

/**
 * Calculates p-values for t-statistics (approximation)
 * Uses t-distribution approximation for two-tailed test
 */
export function calculatePValues(tStats: number[], degreesOfFreedom: number): number[] {
  return tStats.map(t => {
    const absT = Math.abs(t);
    const p = 2 * (1 - jStat.studentt.cdf(absT, degreesOfFreedom)); // two-tailed
    return p;
  });
}

/**
 * Performs linear regression on a data field with t-statistics
 */
export function performLinearRegression(x: number[], y: number[]) {
  if (x.length !== y.length) throw new Error("x and y arrays must be same length");

  const n = x.length;
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (y[i] - yMean);
    denominator += (x[i] - xMean) ** 2;
  }

  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  const predictions = x.map(xi => intercept + slope * xi);
  const residuals = y.map((yi, i) => yi - predictions[i]);

  const ssRes = residuals.reduce((a, b) => a + b ** 2, 0);
  const ssTot = y.reduce((a, b) => a + (b - yMean) ** 2, 0);

  const r2 = 1 - ssRes / ssTot;
  // For linear regression: p = 2 (intercept + slope)
  const adjR2 = calculateAdjustedRSquared(y, predictions, 2);
  const rmse = Math.sqrt(ssRes / n);
  const mae = residuals.reduce((a, b) => a + Math.abs(b), 0) / n;

  // AIC, BIC
  const aic = n * Math.log(ssRes / n) + 2 * 2;
  const bic = n * Math.log(ssRes / n) + Math.log(n) * 2;

  // T-statistics and confidence intervals
  const coefficients = [intercept, slope];
  const standardErrors = calculateCoefficientStandardError(x, residuals, 2);
  const tStats = calculateTStatistics(coefficients, standardErrors);
  const degreesOfFreedom = n - 2 - 1; // n - p - 1
  const pValues = calculatePValues(tStats, degreesOfFreedom);
  
  // Confidence intervals for coefficients
  const tValue = getTValue(degreesOfFreedom, 0.95);
  const coefficientCIs = coefficients.map((coef, i) => ({
    lower: coef - tValue * standardErrors[i],
    upper: coef + tValue * standardErrors[i]
  }));

  return {
    coefficients: [intercept, slope],
    predictions,
    residuals,
    metrics: {
      r2,
      adjR2,
      rmse,
      mae,
      aic,
      bic
    },
    statistics: {
      standardErrors,
      tStats,
      pValues,
      degreesOfFreedom,
      coefficientCIs
    }
  };
}

export function performPolynomialRegression(x: number[], y: number[], degree: number) {
  // Create design matrix X with polynomial terms
  const X = x.map(xi => {
    const row: number[] = [];
    for (let d = 0; d <= degree; d++) {
      row.push(Math.pow(xi, d));
    }
    return row;
  });

  const Xt = transpose(X);
  const XtX = multiply(Xt, X);
  const XtY = multiply(Xt, y.map(yi => [yi]));
  const coefficients = solve(XtX, XtY).map(row => row[0]);

  const predictions = X.map((row: number[]) => {
    return row.reduce((sum, x, i) => sum + x * coefficients[i], 0);
  });

  // Pass the correct number of parameters (degree + 1 for polynomial regression)
  const metrics = calculateRegressionMetrics(y, predictions, degree + 1);

  return {
    coefficients,
    predictions,
    metrics
  };
}

// Import unified metric calculations from MLFormulas
import { 
  calculateRSquared, 
  calculateAdjustedRSquared, 
  calculateStandardError, 
  calculateRMSE, 
  calculateMAE 
} from '../ml/MLFormulas';

// Re-export for backward compatibility
export { calculateRSquared, calculateAdjustedRSquared, calculateStandardError, calculateRMSE, calculateMAE };

/**
 * Calculates confidence intervals for predictions using t-distribution
 * CI = ŷ ± (t * SE)
 * where t is the t-score for (n-p-1) degrees of freedom
 * and SE is the standard error
 */
export const calculateConfidenceIntervals = (
  predictions: number[],
  standardError: number,
  numParameters: number = 2,
  confidenceLevel: number = 0.95
): { upper: number[]; lower: number[] } => {
  const n = predictions.length;
  const degreesOfFreedom = n - numParameters - 1;
  const tValue = getTValue(degreesOfFreedom, confidenceLevel);

  // Debug logs
  console.log('calculateConfidenceIntervals debug:', {
    n,
    numParameters,
    degreesOfFreedom,
    confidenceLevel,
    tValue
  });

  return {
    upper: predictions.map(p => p + tValue * standardError),
    lower: predictions.map(p => p - tValue * standardError)
  };
};

/**
 * Calculates prediction intervals using t-distribution
 * PI = ŷ ± (t * SE_pred)
 * where SE_pred includes both model uncertainty and prediction uncertainty
 */
export const calculatePredictionIntervals = (
  predictions: number[],
  standardError: number,
  x: number[],
  numParameters: number = 2,
  confidenceLevel: number = 0.95
): { upper: number[]; lower: number[] } => {
  const n = predictions.length;
  const degreesOfFreedom = n - numParameters - 1;
  const tValue = getTValue(degreesOfFreedom, confidenceLevel);
  
  const xMean = x.reduce((sum, xi) => sum + xi, 0) / n;
  const sumSquaredDeviations = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
  
  return {
    upper: predictions.map((p, i) => {
      const sePred = standardError * Math.sqrt(1 + 1/n + Math.pow(x[i] - xMean, 2) / sumSquaredDeviations);
      return p + tValue * sePred;
    }),
    lower: predictions.map((p, i) => {
      const sePred = standardError * Math.sqrt(1 + 1/n + Math.pow(x[i] - xMean, 2) / sumSquaredDeviations);
      return p - tValue * sePred;
    })
  };
};

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
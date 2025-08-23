import { RegressionResult, RegressionModelType, RegressionDiagnostics } from '@/types/regression';
import { createError } from '@/utils/error';
import { ERROR_CODES } from '@/utils/error/constants';
import { calculateLinearRegression } from './linear';
import { calculatePolynomialRegression } from './polynomial';
import { calculateRidgeRegression } from './ridge';
import { calculateLassoRegression } from './lasso';
import { DataField } from '@/types/data';

interface InternalRegressionResult extends RegressionResult {
  modelName: string;
}

function processDataField(field: DataField): number[] {
  if (Array.isArray(field.value)) {
    return field.value.map(v => typeof v === 'number' ? v : NaN);
  }
  return [];
}

async function performRegression(x: number[], y: number[], modelType: RegressionModelType, options?: { degree?: number; alpha?: number }): Promise<InternalRegressionResult> {
  try {
    // Convert x to 2D array format expected by regression functions
    const X = x.map(xi => [xi]);
    const featureNames = ['x'];

    let result: RegressionResult;

    switch (modelType) {
      case 'linear':
        result = await performLinearRegression(X, y);
        break;
      case 'polynomial':
        if (!options?.degree) throw createError(ERROR_CODES.INVALID_INPUT, 'Degree required for polynomial regression');
        result = await performPolynomialRegression(X, y, featureNames, options.degree);
        break;
      case 'ridge':
        if (!options?.alpha) throw createError(ERROR_CODES.INVALID_INPUT, 'Alpha required for ridge regression');
        result = await performRidgeRegression(X, y, featureNames, options.alpha);
        break;
      case 'lasso':
        if (!options?.alpha) throw createError(ERROR_CODES.INVALID_INPUT, 'Alpha required for lasso regression');
        result = await performLassoRegression(X, y, featureNames, options.alpha);
        break;
      default:
        throw createError(ERROR_CODES.INVALID_INPUT, 'Invalid regression model type');
    }

    // Calculate diagnostics
    const diagnostics = calculateModelDiagnostics(result);

    return {
      ...result,
      modelName: `${modelType} regression`,
      diagnostics
    };
  } catch (error) {
    console.error('Regression failed:', error);
    return {
      model: modelType,
      modelName: `${modelType} regression`,
      equation: '',
      coefficients: {},
      metrics: {
        r2: 0,
        adjustedR2: 0,
        mse: 0,
        rmse: 0,
        mae: 0
      },
      predictions: [],
      residuals: [],
      actualValues: y,
      featureImportance: {},
      diagnostics: {
        residualNormality: false,
        homoscedasticity: false,
        multicollinearity: false,
        outliers: []
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function analyzeRegression(
  xField: DataField,
  yField: DataField,
  modelType: RegressionModelType,
  options?: { degree?: number; alpha?: number }
): Promise<InternalRegressionResult> {
  const x = processDataField(xField);
  const y = processDataField(yField);

  if (x.length === 0 || y.length === 0 || x.length !== y.length) {
    throw createError(ERROR_CODES.INVALID_INPUT, 'Invalid input data');
  }

  return performRegression(x, y, modelType, options);
}

function calculateModelDiagnostics(result: RegressionResult): RegressionDiagnostics {
  const { predictions, residuals } = result;
  
  // Calculate diagnostic metrics
  const normalityTest = testResidualNormality(residuals);
  const heteroscedasticityTest = testHeteroscedasticity(predictions, residuals);
  const multicollinearityTest = testMulticollinearity(result.featureImportance);
  
  // Find outliers using IQR method
  const sortedResiduals = [...residuals].sort((a, b) => a - b);
  const q1 = sortedResiduals[Math.floor(sortedResiduals.length * 0.25)];
  const q3 = sortedResiduals[Math.floor(sortedResiduals.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const outliers = residuals
    .map((r, i) => (r < lowerBound || r > upperBound) ? i : -1)
    .filter(i => i !== -1);
  
  return {
    residualNormality: normalityTest.pValue > 0.05,
    homoscedasticity: heteroscedasticityTest.pValue > 0.05,
    multicollinearity: multicollinearityTest.vif < 5,
    outliers
  };
}

function testResidualNormality(residuals: number[]) {
  // Shapiro-Wilk test approximation
  const n = residuals.length;
  const sorted = [...residuals].sort((a, b) => a - b);
  let W = 0;
  let S2 = 0;
  
  // Calculate W statistic
  for (let i = 0; i < n; i++) {
    S2 += Math.pow(sorted[i] - sorted[n-1-i], 2);
  }
  
  W = Math.pow(S2, 2) / (n * residuals.reduce((a, b) => a + b * b, 0));
  const pValue = 1 - W;
  
  return { statistic: W, pValue };
}

function testHeteroscedasticity(predictions: number[], residuals: number[]) {
  // Breusch-Pagan test approximation
  const n = residuals.length;
  const squaredResiduals = residuals.map(r => r * r);
  
  // Fit squared residuals against predictions
  let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumXY += predictions[i] * squaredResiduals[i];
    sumX += predictions[i];
    sumY += squaredResiduals[i];
    sumX2 += predictions[i] * predictions[i];
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const statistic = Math.abs(slope);
  const pValue = 1 / (1 + Math.exp(statistic));
  
  return { statistic, pValue };
}

function testMulticollinearity(featureImportance: Record<string, number>) {
  // Variance Inflation Factor approximation
  const importances = Object.values(featureImportance);
  const mean = importances.reduce((a, b) => a + b, 0) / importances.length;
  const variance = importances.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / importances.length;
  const vif = 1 / (1 - variance);
  
  return { vif };
}

function standardizeFeatures(X: number[][]): number[][] {
  const n = X.length;
  const p = X[0].length;
  const standardizedX = Array(n).fill(0).map(() => Array(p).fill(0));
  
  // Calculate mean and standard deviation for each feature
  for (let j = 0; j < p; j++) {
    const column = X.map(row => row[j]);
    const mean = column.reduce((a, b) => a + b, 0) / n;
    const stdDev = Math.sqrt(
      column.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n
    );
    
    // Standardize each value
    for (let i = 0; i < n; i++) {
      standardizedX[i][j] = stdDev === 0 ? 0 : (X[i][j] - mean) / stdDev;
    }
  }
  
  return standardizedX;
}

async function performLinearRegression(x: number[][], y: number[]): Promise<RegressionResult> {
  // Convert 2D x array to 1D by taking first column
  const x1D = x.map(row => row[0]);
  const coeffs = await calculateLinearRegression(x1D, y);
  const predicted = x.map(xi => coeffs.coefficients['x'] * xi[0] + coeffs.coefficients.intercept);
  const residuals = y.map((yi, i) => yi - predicted[i]);
  const metrics = {
    r2: calculateR2(y, predicted),
    adjustedR2: calculateAdjustedR2(y, predicted, 2),
    mse: calculateMSE(y, predicted),
    rmse: calculateRMSE(y, predicted),
    mae: calculateMAE(y, predicted)
  };
  
  const result: RegressionResult = {
    model: 'linear' as RegressionModelType,
    equation: `y = ${coeffs.coefficients['x'].toFixed(4)}x + ${coeffs.coefficients.intercept.toFixed(4)}`,
    coefficients: { x: coeffs.coefficients['x'], intercept: coeffs.coefficients.intercept },
    metrics,
    predictions: predicted,
    residuals,
    actualValues: y,
    featureImportance: { 'x': Math.abs(coeffs.coefficients['x']) },
    diagnostics: {
      residualNormality: true,
      homoscedasticity: true,
      multicollinearity: false,
      outliers: []
    }
  };
  return result;
}

async function performPolynomialRegression(x: number[][], y: number[], featureNames: string[], degree: number): Promise<RegressionResult> {
  return calculatePolynomialRegression(x, y, featureNames, degree);
}

async function performRidgeRegression(x: number[][], y: number[], featureNames: string[], alpha: number): Promise<RegressionResult> {
  const standardizedX = standardizeFeatures(x);
  return calculateRidgeRegression(standardizedX, y, featureNames, alpha);
}

async function performLassoRegression(x: number[][], y: number[], featureNames: string[], alpha: number): Promise<RegressionResult> {
  const standardizedX = standardizeFeatures(x);
  return calculateLassoRegression(standardizedX, y, featureNames, alpha);
}

export function solveSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i]]);

  // Gaussian elimination
  for (let i = 0; i < n; i++) {
    // Partial pivoting
    let maxRow = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = j;
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    // Elimination
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
    x[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j];
    }
    x[i] /= augmented[i][i];
  }

  return x;
}

// Helper functions for metrics calculation
function calculateR2(actual: number[], predicted: number[]): number {
  const meanActual = actual.reduce((a, b) => a + b, 0) / actual.length;
  const totalSS = actual.reduce((acc, y) => acc + Math.pow(y - meanActual, 2), 0);
  const residualSS = predicted.reduce((acc, yHat, i) => acc + Math.pow(actual[i] - yHat, 2), 0);
  return 1 - (residualSS / totalSS);
}

function calculateAdjustedR2(actual: number[], predicted: number[], numFeatures: number): number {
  const n = actual.length;
  const r2 = calculateR2(actual, predicted);
  return 1 - ((1 - r2) * (n - 1)) / (n - numFeatures - 1);
}

function calculateMSE(actual: number[], predicted: number[]): number {
  return predicted.reduce((acc, yHat, i) => acc + Math.pow(actual[i] - yHat, 2), 0) / actual.length;
}

function calculateRMSE(actual: number[], predicted: number[]): number {
  return Math.sqrt(calculateMSE(actual, predicted));
}

function calculateMAE(actual: number[], predicted: number[]): number {
  return predicted.reduce((acc, yHat, i) => acc + Math.abs(actual[i] - yHat), 0) / actual.length;
}

export {
  performRegression
};
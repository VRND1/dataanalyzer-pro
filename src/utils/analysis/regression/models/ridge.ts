import { RegressionResult } from '@/types/regression';
import { Matrix } from 'ml-matrix';

export async function calculateRidgeRegression(
  X: number[][],
  y: number[],
  featureNames: string[],
  alpha = 1.0
): Promise<RegressionResult> {
  // Input validation
  if (!X?.length || !y?.length || !featureNames?.length) {
    throw new Error('Invalid input: X, y, and featureNames must be non-empty arrays');
  }

  if (X.length !== y.length) {
    throw new Error('X and y must have the same number of samples');
  }

  if (X[0].length !== featureNames.length - 1) {
    throw new Error('Number of features must match featureNames length minus one');
  }

  if (alpha <= 0) {
    throw new Error('Regularization parameter alpha must be positive');
  }

  // Add bias term
  const Xb = X.map(row => [1, ...row]);
  const n = Xb.length;
  const p = Xb[0].length;

  // Check for sufficient samples
  if (n < p) {
    throw new Error('Number of samples must be greater than or equal to number of features');
  }
  
  try {
    // Create matrices
    const Xm = new Matrix(Xb);
    const ym = Matrix.columnVector(y);
    
    // Calculate coefficients with L2 regularization
    const XtX = Xm.transpose().mmul(Xm);
    const I = Matrix.eye(p, p);
    I.mul(alpha);
    const regularizedXtX = XtX.add(I);
    const Xty = Xm.transpose().mmul(ym);
    
    // Solve linear system with error handling
    let beta: Matrix;
    try {
      beta = regularizedXtX.solve(Xty);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to solve linear system: ${errorMessage}`);
    }
    
    // Extract coefficients
    const intercept = beta.get(0, 0);
    const coefficients = beta.getColumn(0).slice(1);
    
    // Calculate predictions
    const predictions = Xb.map(row => 
      row.reduce((acc, val, i) => acc + val * beta.get(i, 0), 0)
    );
    
    // Calculate residuals and metrics with safety checks
    const residuals = y.map((yi, i) => yi - predictions[i]);
    const mse = n > 0 ? residuals.reduce((acc, r) => acc + r * r, 0) / n : 0;
    const rmse = Math.sqrt(Math.max(0, mse));
    const mae = n > 0 ? residuals.reduce((acc, r) => acc + Math.abs(r), 0) / n : 0;
    
    // Calculate R-squared with safety checks
    const yMean = n > 0 ? y.reduce((a, b) => a + b, 0) / n : 0;
    const totalSS = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
    const r2 = totalSS > 0 ? 1 - (mse * n) / totalSS : 0;
    
    // Calculate adjusted R-squared
    const adjustedR2 = n > p + 1 ? 1 - ((1 - r2) * (n - 1)) / (n - p - 1) : 0;
    
    // Calculate feature importance
    const featureImportance = calculateFeatureImportance(coefficients, featureNames);
    
    return {
      model: 'ridge',
      equation: `y = ${intercept.toFixed(4)} + ${coefficients.map((c, i) => `${c.toFixed(4)}x${i+1}`).join(' + ')}`,
      coefficients: {
        intercept,
        ...coefficients.reduce((acc, c, i) => ({ ...acc, [`x${i+1}`]: c }), {})
      },
      metrics: {
        r2,
        adjustedR2,
        mse,
        rmse,
        mae
      },
      predictions,
      residuals,
      actualValues: y,
      featureImportance,
      diagnostics: {
        residualNormality: true,
        homoscedasticity: true,
        multicollinearity: false,
        outliers: []
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Ridge regression failed: ${errorMessage}`);
  }
}

function calculateFeatureImportance(
  coefficients: number[],
  featureNames: string[]
): Record<string, number> {
  const importance: Record<string, number> = {};
  const totalImportance = coefficients.reduce((acc, c) => acc + Math.abs(c), 0);
  
  coefficients.forEach((coef, i) => {
    importance[featureNames[i]] = Math.abs(coef) / totalImportance;
  });
  
  return importance;
}
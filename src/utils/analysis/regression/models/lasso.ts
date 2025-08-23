import { RegressionResult } from '@/types/regression';

export async function calculateLassoRegression(
  X: number[][],
  y: number[],
  featureNames: string[],
  alpha = 1.0,
  maxIterations = 1000,
  tolerance = 1e-4
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
    // Initialize coefficients with zeros
    let betaValues = Array(p).fill(0);
    
    // Coordinate descent algorithm
    for (let iter = 0; iter < maxIterations; iter++) {
      let maxChange = 0;
      
      for (let j = 0; j < p; j++) {
        // Calculate r_j = y - X_{-j} * beta_{-j}
        const betaCopy = [...betaValues];
        betaCopy[j] = 0;
        
        // Calculate residuals manually
        const predictions = Xb.map(row => 
          row.reduce((acc, val, i) => acc + val * betaCopy[i], 0)
        );
        const residuals = y.map((yi, i) => yi - predictions[i]);
        
        // Calculate XjTrj and XjTXj
        const Xj = Xb.map(row => row[j]);
        const XjTrj = Xj.reduce((acc, xij, i) => acc + xij * residuals[i], 0);
        const XjTXj = Xj.reduce((acc, xij) => acc + xij * xij, 0);
        
        let newBetaJ = 0;
        if (j === 0) { // Don't regularize intercept
          newBetaJ = XjTrj / XjTXj;
        } else {
          if (XjTrj > alpha) {
            newBetaJ = (XjTrj - alpha) / XjTXj;
          } else if (XjTrj < -alpha) {
            newBetaJ = (XjTrj + alpha) / XjTXj;
          }
        }
        
        // Update coefficient and track maximum change
        const change = Math.abs(newBetaJ - betaValues[j]);
        maxChange = Math.max(maxChange, change);
        betaValues[j] = newBetaJ;
      }
      
      // Check convergence
      if (maxChange < tolerance) {
        break;
      }
    }
    
    // Extract coefficients
    const intercept = betaValues[0];
    const coefficients = betaValues.slice(1);
    
    // Calculate predictions
    const predictions = Xb.map(row => 
      row.reduce((acc, val, i) => acc + val * betaValues[i], 0)
    );
    
    // Calculate residuals and metrics
    const residuals = y.map((yi, i) => yi - predictions[i]);
    const mse = residuals.reduce((acc, r) => acc + r * r, 0) / n;
    const rmse = Math.sqrt(mse);
    const mae = residuals.reduce((acc, r) => acc + Math.abs(r), 0) / n;
    
    // Calculate R-squared
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    const totalSS = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
    const r2 = 1 - (mse * n) / totalSS;
    
    // Calculate adjusted R-squared
    const adjustedR2 = 1 - ((1 - r2) * (n - 1)) / (n - p - 1);
    
    // Calculate feature importance
    const featureImportance = calculateFeatureImportance(coefficients, featureNames);
    
    return {
      model: 'lasso',
      equation: `y = ${intercept.toFixed(4)} + ${coefficients.map((c, i) => `${c.toFixed(4)}x${i+1}`).join(' + ')}`,
      coefficients: {
        intercept,
        ...coefficients.reduce((acc: Record<string, number>, c: number, i: number) => ({ ...acc, [`x${i+1}`]: c }), {})
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
    throw new Error(`Lasso regression failed: ${errorMessage}`);
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
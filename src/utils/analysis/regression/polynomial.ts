import { DataField } from '@/types/data';
import { RegressionResult } from './types';
import { standardize, calculateRobustStandardError, getTValue, calculateRegressionMetrics, crossValidateRegression } from './utils';

export function calculatePolynomialRegression(
  dependent: DataField,
  independent: DataField,
  degree: number = 2,
  crossValidationFolds: number = 5
): RegressionResult {
  // Standardize values for numerical stability
  const y = standardize(dependent.value as number[]);
  const x = standardize(independent.value as number[]);
  
  const n = Math.min(x.length, y.length);
  
  // Create design matrix with polynomial terms
  // degree >= 2
  const X = Array.from({ length: n }, (_, i) => {
    const row = [1]; // intercept
    for (let d = 1; d <= degree; d++) {
      row.push(Math.pow(x[i], d));
    }
    return row;
  });
  
  // Solve (XᵀX)β = Xᵀy (no regularization here)
  // Make sure we're not collapsing it back to 2×2
  const XtX = multiplyMatrix(transposeMatrix(X), X);
  const Xty = multiplyMatrix(transposeMatrix(X), y.map(yi => [yi]));
  const coefficients = solveLinearSystem(XtX, Xty).map(row => row[0]);
  
  // Calculate predictions
  const predictions = X.map(row => {
    return row.reduce((sum, feature, i) => sum + feature * coefficients[i], 0);
  });
  
  // Calculate metrics
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  const totalSS = y.reduce((ss, yi) => ss + Math.pow(yi - meanY, 2), 0);
  const residualSS = y.reduce((ss, yi, i) => ss + Math.pow(yi - predictions[i], 2), 0);
  const rSquared = 1 - (residualSS / totalSS);
  
  // Calculate robust standard error
  const standardError = calculateRobustStandardError(y, predictions, 1000);
  
  // Calculate confidence intervals
  const tValue = getTValue(n - degree - 1, 0.975); // 95% confidence level
  
  // Calculate prediction intervals
  const confidence = {
    upper: predictions.map(pred => pred + tValue * standardError),
    lower: predictions.map(pred => pred - tValue * standardError)
  };
  
  // Calculate additional metrics
  const metrics = calculateRegressionMetrics(y, predictions);
  
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
          // Polynomial regression for cross-validation
          const nTrain = xTrain.length;
          const X = Array.from({ length: nTrain }, (_, i) => {
            const row = [1]; // intercept
            for (let d = 1; d <= degree; d++) {
              row.push(Math.pow(xTrain[i], d));
            }
            return row;
          });
          
          const XtX = multiplyMatrix(transposeMatrix(X), X);
          const Xty = multiplyMatrix(transposeMatrix(X), yTrain.map(yi => [yi]));
          const coefficients = solveLinearSystem(XtX, Xty).map(row => row[0]);
          
          return { coefficients };
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
  
  // Generate equation string
  let equation = `${dependent.name} = ${coefficients[0].toFixed(3)}`;
  for (let i = 1; i <= degree; i++) {
    equation += ` + ${coefficients[i].toFixed(3)}×${independent.name}^${i}`;
  }
  
  return {
    field: dependent.name,
    type: 'polynomial',
    coefficients: coefficients.slice(1), // Remove intercept from coefficients array
    intercept: coefficients[0],
    rSquared,
    standardError,
    predictions,
    actualValues: y,
    equation: `${dependent.name} = ${coefficients[0].toFixed(3)} + ${coefficients.slice(1).map((coef, i) => `${coef.toFixed(3)}×${independent.name}^${i + 1}`).join(' + ')}`,
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

// Helper functions for matrix operations
function transposeMatrix(matrix: number[][]): number[][] {
  return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

function multiplyMatrix(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < b.length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

function solveLinearSystem(a: number[][], b: number[][]): number[][] {
  const n = a.length;
  const augmented = a.map((row, i) => [...row, b[i][0]]);
  
  // Gaussian elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = j;
      }
    }
    
    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    
    // Eliminate column
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
    let sum = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= augmented[i][j] * x[j];
    }
    x[i] = sum / augmented[i][i];
  }
  
  return x.map(val => [val]);
} 
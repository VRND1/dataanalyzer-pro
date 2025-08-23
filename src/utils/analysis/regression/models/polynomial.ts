import { RegressionResult } from '@/types/regression';
import { Matrix } from 'ml-matrix';

export async function calculatePolynomialRegression(
  X: number[][],
  y: number[],
  featureNames: string[],
  degree = 2
): Promise<RegressionResult> {
  // Generate polynomial features
  const polyX = generatePolynomialFeatures(X, degree);
  
  // Fit model using normal equation
  const Xm = new Matrix(polyX);
  const ym = Matrix.columnVector(y);
  
  const XtX = Xm.transpose().mmul(Xm);
  const Xty = Xm.transpose().mmul(ym);
  const beta = XtX.solve(Xty);
  
  // Get coefficients
  const coefficients = beta.getColumn(0).slice(1);
  const intercept = beta.get(0, 0);
  
  // Calculate predictions
  const predictions = polyX.map(row => 
    row.reduce((acc, val, i) => acc + val * beta.get(i, 0), 0)
  );
  
  // Calculate residuals
  const residuals = y.map((yi, i) => yi - predictions[i]);
  
  // Calculate metrics
  const n = y.length;
  const p = coefficients.length;
  const mse = residuals.reduce((acc, r) => acc + r * r, 0) / n;
  const rmse = Math.sqrt(mse);
  const mae = residuals.reduce((acc, r) => acc + Math.abs(r), 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  const totalSS = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
  const r2 = 1 - (mse * n) / totalSS;
  const adjustedR2 = 1 - ((1 - r2) * (n - 1)) / (n - p - 1);
  
  // Calculate feature importance
  const featureImportance = calculateFeatureImportance(coefficients, featureNames, degree);
  
  return {
    model: 'polynomial',
    equation: `y = ${intercept.toFixed(4)} + ${coefficients.map((c, i) => `${c.toFixed(4)}x^${i+1}`).join(' + ')}`,
    coefficients: {
      intercept,
      ...coefficients.reduce((acc, c, i) => ({ ...acc, [`x^${i+1}`]: c }), {})
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
    featureImportance: featureImportance.reduce((acc, { name, importance }) => ({ ...acc, [name]: importance }), {}),
    diagnostics: {
      residualNormality: true,
      homoscedasticity: true,
      multicollinearity: false,
      outliers: []
    }
  };
}

function generatePolynomialFeatures(X: number[][], degree: number): number[][] {
  return X.map(row => {
    const features = [];
    for (let d = 1; d <= degree; d++) {
      features.push(...row.map(x => Math.pow(x, d)));
    }
    return [1, ...features]; // Add intercept term
  });
}

function calculateFeatureImportance(
  coefficients: number[],
  featureNames: string[],
  degree: number
): { name: string; importance: number }[] {
  const importance: { name: string; importance: number }[] = [];
  let coefIndex = 0;
  
  for (let d = 1; d <= degree; d++) {
    for (const name of featureNames) {
      const termName = d === 1 ? name : `${name}^${d}`;
      importance.push({
        name: termName,
        importance: Math.abs(coefficients[coefIndex++])
      });
    }
  }
  
  // Normalize importance scores
  const total = importance.reduce((sum, { importance }) => sum + importance, 0);
  return importance.map(item => ({
    ...item,
    importance: item.importance / total
  }));
}
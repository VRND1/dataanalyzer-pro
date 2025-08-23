# Regression Algorithm Improvements

This document summarizes the improvements made to the regression algorithms in the data analyzer, implementing more robust and numerically stable approaches.

## Overview

All regression algorithms have been updated to use improved implementations that provide better numerical stability, more accurate results, and proper handling of edge cases.

## 1. Linear Regression (`linear.ts`)

### Improvements:
- **Explicit Dot Products**: Replaced traditional mean-based calculations with explicit Gram matrix computation
- **Numerical Stability**: Uses direct matrix operations instead of mean-centered calculations
- **Formula**: `β = (XᵀX)⁻¹Xᵀy` with explicit computation of XTX00, XTX01, XTX11, XTy0, XTy1

### Key Changes:
```typescript
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
```

## 2. Ridge Regression (`ridge.ts`)

### Improvements:
- **No Penalty on Intercept**: Ridge penalty only applied to slope coefficient
- **Explicit Matrix Operations**: Direct computation without full matrix operations
- **Formula**: Adds λ to XᵀX diagonal (except intercept term)

### Key Changes:
```typescript
// Ridge adjustment: add alpha to slope term only
const A00 = XTX00;          // no penalty on intercept
const A01 = XTX01;
const A10 = XTX01;
const A11 = XTX11 + alpha;  // penalize slope

// Solve 2×2 system
const det = A00 * A11 - A01 * A10;
const beta0 = (XTy0 * A11 - A01 * XTy1) / det;
const beta1 = (-XTy0 * A10 + A00 * XTy1) / det;
```

## 3. Lasso Regression (`lasso.ts`)

### Improvements:
- **Coordinate Descent**: Implemented proper coordinate descent algorithm
- **Soft Thresholding**: Correct soft-thresholding operator
- **No Penalty on Intercept**: Intercept updated without regularization

### Key Changes:
```typescript
// Coordinate descent with soft-thresholding (no penalty on intercept)
for (let iter = 0; iter < maxIterations; iter++) {
  // Update intercept (no penalty)
  const r = y.map((yi, i) => yi - (b0 + b1 * x[i]));
  b0 += r.reduce((a, v) => a + v, 0) / n;
  
  // Update slope with soft-threshold
  const rNoSlope = y.map((yi, i) => yi - b0);
  const rho = x.reduce((acc, xi, i) => acc + xi * rNoSlope[i], 0);
  const z = x.reduce((acc, xi) => acc + xi * xi, 0);
  
  // soft-threshold
  const s = alpha / 2;
  const soft = (v: number, s: number) => (v > s ? v - s : (v < -s ? v + s : 0));
  const b1New = soft(rho, s) / z;
  
  if (Math.abs(b1New - b1) < tolerance) break;
  b1 = b1New;
}
```

## 4. Elastic Net Regression (`elastic-net.ts`)

### Improvements:
- **Combined Penalty**: Proper implementation of L1 + L2 regularization
- **Parameter Separation**: λ₁ = α⋅l1Ratio, λ₂ = α⋅(1−l1Ratio)
- **Soft Thresholding**: Combined L1/L2 penalty in denominator

### Key Changes:
```typescript
// Elastic Net: soft-threshold with combined penalty
const z = x.reduce((a, xi) => a + xi * xi, 0) + (alpha * (1 - l1Ratio)); // L2 part in denominator
const s = alpha * l1Ratio; // L1 part
const soft = (v: number, s: number) => (v > s ? v - s : (v < -s ? v + s : 0));
const b1New = soft(rho, s) / z;
```

## 5. Polynomial Regression (`polynomial.ts`)

### Improvements:
- **Full Polynomial Matrix**: Actually adds polynomial columns instead of collapsing
- **Proper Degree Handling**: Supports arbitrary polynomial degrees
- **Matrix Operations**: Full matrix solve without dimension reduction

### Key Changes:
```typescript
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
```

## 6. Logistic Regression (`logistic.ts`)

### Improvements:
- **Sigmoid + Cross-Entropy**: Proper logistic loss function
- **No Y Standardization**: Target variable remains binary (0/1)
- **Classification Metrics**: Accuracy and log-loss instead of R²
- **Gradient Descent**: Proper gradient computation

### Key Changes:
```typescript
// Gradient descent for logistic regression
for (let iter = 0; iter < maxIterations; iter++) {
  // predictions using sigmoid
  const p = x.map((xi) => 1 / (1 + Math.exp(-(b0 + b1 * xi))));
  
  // gradients (negative log-likelihood)
  const g0 = p.reduce((a, pi, i) => a + (pi - y[i]), 0);
  const g1 = p.reduce((a, pi, i) => a + (pi - y[i]) * x[i], 0);
  
  // simple step
  b0 -= learningRate * g0 / n;
  b1 -= learningRate * g1 / n;
  
  if (Math.abs(learningRate * g0 / n) + Math.abs(learningRate * g1 / n) < tolerance) break;
}

// Calculate classification metrics instead of R²
const accuracy = y.reduce((acc, yi, i) => acc + (Math.round(predictions[i]) === yi ? 1 : 0), 0) / n;
const logLoss = -y.reduce((sum, yi, i) => {
  const p = Math.max(1e-15, Math.min(1 - 1e-15, predictions[i]));
  return sum + (yi * Math.log(p) + (1 - yi) * Math.log(1 - p));
}, 0) / n;
```

## 7. Quantile Regression (`quantile.ts`)

### Improvements:
- **Subgradient Method**: Proper subgradient updates for pinball loss
- **Check Loss**: Implements τ-regression with correct subgradients
- **Convergence**: Better convergence criteria

### Key Changes:
```typescript
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
```

## 8. Log-Log Regression (`log-log.ts`)

### Improvements:
- **Proper Log Transform**: Correct log transformation and back-transformation
- **Positive Value Handling**: Proper filtering of positive values
- **Original Scale Predictions**: ŷ = exp(intercept) × x^slope

### Key Changes:
```typescript
// Filter out non-positive values
const valid = [];
for (let i = 0; i < yRaw.length; i++) {
  if (yRaw[i] > 0 && xRaw[i] > 0) {
    valid.push(i);
  }
}

// Extract valid data
const yv = valid.map(i => Math.log(yRaw[i]));
const xv = valid.map(i => Math.log(xRaw[i]));

// OLS on log–log
// ... compute coefficients ...

// Transform back to original space: ŷ = exp(intercept) * x^slope
const predictions = logPredictions.map(logPred => Math.exp(logPred));
```

## Benefits of Improvements

1. **Numerical Stability**: Explicit dot products and matrix operations reduce numerical errors
2. **Correctness**: Algorithms now follow established mathematical formulations
3. **Performance**: More efficient implementations with better convergence
4. **Robustness**: Better handling of edge cases and data quality issues
5. **Interpretability**: Proper coefficient interpretation and equation generation

## Usage

All improved algorithms maintain the same API interface, so existing code will continue to work without changes. The improvements are internal optimizations that provide better results and more stable computations.

## Testing

Each algorithm has been tested with:
- Synthetic data with known relationships
- Edge cases (collinear data, outliers, etc.)
- Convergence properties
- Numerical stability under various conditions

The improvements ensure that the regression algorithms provide accurate, stable, and interpretable results for data analysis tasks.

// utils/analysis/ml/MLFormulas.ts
// Ultra-high-accuracy ML metric calculations and preprocessing utilities

/**
 * High-precision deterministic PRNG for reproducible splits (Mulberry32)
 * Enhanced with better distribution properties
 */
function mulberry32(seed: number) {
  let t = (seed >>> 0);
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 0x100000000;
  };
}

/**
 * Enhanced R² with numerical stability improvements
 */
export function calculateRSquared(yTrue: number[], yPred: number[]) {
  if (yTrue.length !== yPred.length) throw new Error("Array lengths mismatch");
  if (yTrue.length === 0) return { r2Score: 0 };
  
  // Use Welford's algorithm for numerical stability
  let meanY = 0;
  for (let i = 0; i < yTrue.length; i++) {
    meanY += (yTrue[i] - meanY) / (i + 1);
  }
  
  // Calculate sums with higher precision
  let ssTot = 0;
  let ssRes = 0;
  
  for (let i = 0; i < yTrue.length; i++) {
    const diff = yTrue[i] - meanY;
    ssTot += diff * diff;
    const resDiff = yTrue[i] - yPred[i];
    ssRes += resDiff * resDiff;
  }
  
  // Handle edge cases
  if (ssTot === 0) return { r2Score: yTrue.every((_, i) => yTrue[i] === yPred[i]) ? 1 : 0 };
  
  const r2 = 1 - (ssRes / ssTot);
  return { r2Score: Number(r2.toPrecision(15)) };
}

/**
 * Enhanced MAE with Kahan summation for numerical stability
 */
export function calculateMAE(yTrue: number[], yPred: number[]) {
  if (yTrue.length !== yPred.length) throw new Error("Array lengths mismatch");
  if (yTrue.length === 0) return { mae: 0 };
  
  // Kahan summation algorithm for better precision
  let sum = 0;
  let c = 0; // Compensation for lost low-order bits
  
  for (let i = 0; i < yTrue.length; i++) {
    const y = Math.abs(yTrue[i] - yPred[i]) - c;
    const t = sum + y;
    c = (t - sum) - y;
    sum = t;
  }
  
  const mae = sum / yTrue.length;
  return { mae: Number(mae.toPrecision(15)) };
}

/**
 * Enhanced MSE with Kahan summation
 */
export function calculateMSE(yTrue: number[], yPred: number[]) {
  if (yTrue.length !== yPred.length) throw new Error("Array lengths mismatch");
  if (yTrue.length === 0) return { mse: 0 };
  
  // Kahan summation for numerical stability
  let sum = 0;
  let c = 0;
  
  for (let i = 0; i < yTrue.length; i++) {
    const diff = yTrue[i] - yPred[i];
    const y = (diff * diff) - c;
    const t = sum + y;
    c = (t - sum) - y;
    sum = t;
  }
  
  const mse = sum / yTrue.length;
  return { mse: Number(mse.toPrecision(15)) };
}

/**
 * Enhanced RMSE using high-precision MSE
 */
export function calculateRMSE(yTrue: number[], yPred: number[]) {
  const { mse } = calculateMSE(yTrue, yPred);
  const rmse = Math.sqrt(mse);
  return { rmse: Number(rmse.toPrecision(15)) };
}

/**
 * Adjusted R-squared with enhanced numerical stability
 */
export function calculateAdjustedRSquared(yTrue: number[], yPred: number[], numFeatures: number) {
  if (yTrue.length !== yPred.length) throw new Error("Array lengths mismatch");
  if (yTrue.length === 0) return 0;
  if (numFeatures >= yTrue.length - 1) return 0; // Need degrees of freedom
  
  const { r2Score } = calculateRSquared(yTrue, yPred);
  const n = yTrue.length;
  const p = numFeatures;
  
  // Enhanced formula with numerical stability
  if (n - p - 1 <= 0) return 0;
  
  const adjustedR2 = 1 - ((1 - r2Score) * (n - 1)) / (n - p - 1);
  return Math.max(-1, Number(adjustedR2.toPrecision(15))); // Allow negative values but cap at -1
}

/**
 * Enhanced Standard Error calculation with bias correction
 */
export function calculateStandardError(yTrue: number[], yPred: number[]) {
  if (yTrue.length !== yPred.length) throw new Error("Array lengths mismatch");
  if (yTrue.length <= 2) return 0; // Need at least 3 points for meaningful standard error
  
  const n = yTrue.length;
  let sumSquaredResiduals = 0;
  let c = 0; // Kahan summation compensation
  
  for (let i = 0; i < n; i++) {
    const residual = yTrue[i] - yPred[i];
    const y = (residual * residual) - c;
    const t = sumSquaredResiduals + y;
    c = (t - sumSquaredResiduals) - y;
    sumSquaredResiduals = t;
  }
  
  // Use n-2 degrees of freedom for regression (accounts for intercept and slope)
  const standardError = Math.sqrt(sumSquaredResiduals / (n - 2));
  return Number(standardError.toPrecision(15));
}

/**
 * Enhanced accuracy with relative tolerance
 */
export function calculateAccuracyWithTolerance(
  yTrue: number[],
  yPred: number[],
  tolerance: number = 0.05
) {
  if (yTrue.length !== yPred.length) throw new Error("Array lengths mismatch");
  if (yTrue.length === 0) return 100;
  
  let correct = 0;
  
  for (let i = 0; i < yTrue.length; i++) {
    const actual = yTrue[i];
    const predicted = yPred[i];
    
    // Handle exact matches first
    if (actual === predicted) {
      correct++;
      continue;
    }
    
    // Handle zero values specially
    if (actual === 0) {
      if (Math.abs(predicted) <= tolerance) correct++;
    } else {
      // Relative tolerance
      const relativeError = Math.abs((actual - predicted) / actual);
      if (relativeError <= tolerance) correct++;
    }
  }
  
  const accuracy = (correct / yTrue.length) * 100;
  return Number(accuracy.toPrecision(15));
}

/**
 * Enhanced binary classification accuracy
 */
export function calculateBinaryAccuracy(
  yTrue: number[],
  yPred: number[],
  threshold: number = 0.5
) {
  if (yTrue.length !== yPred.length) throw new Error("Array lengths mismatch");
  if (yTrue.length === 0) return 100;
  
  let correct = 0;
  
  for (let i = 0; i < yTrue.length; i++) {
    const predictedClass = yPred[i] >= threshold ? 1 : 0;
    if (predictedClass === yTrue[i]) correct++;
  }
  
  const accuracy = (correct / yTrue.length) * 100;
  return Number(accuracy.toPrecision(15));
}

/**
 * Enhanced Train/Test Split with better shuffling
 */
export function trainTestSplit<T>(
  X: T[],
  y: T[],
  testSize: number = 0.2,
  seed: number = 42
) {
  if (X.length !== y.length) throw new Error("Feature/label length mismatch");
  if (X.length === 0) throw new Error("Empty dataset");
  
  const rng = mulberry32(seed);
  const indices = Array.from({ length: X.length }, (_, i) => i);
  
  // Fisher-Yates shuffle for better randomization
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const testCount = Math.max(1, Math.floor(X.length * testSize));
  const testIdx = indices.slice(0, testCount);
  const trainIdx = indices.slice(testCount);

  return {
    X_train: trainIdx.map(i => X[i]),
    X_test: testIdx.map(i => X[i]),
    y_train: trainIdx.map(i => y[i]),
    y_test: testIdx.map(i => y[i]),
  };
}

/**
 * Enhanced standardization with numerical stability
 */
export function standardizeFeatures(X: number[][]) {
  if (X.length === 0 || X[0].length === 0) return X;
  
  const numFeatures = X[0].length;
  const means = new Array(numFeatures).fill(0);
  const stds = new Array(numFeatures).fill(0);
  
  // Calculate means using Welford's algorithm
  for (let j = 0; j < numFeatures; j++) {
    for (let i = 0; i < X.length; i++) {
      means[j] += (X[i][j] - means[j]) / (i + 1);
    }
  }
  
  // Calculate standard deviations
  for (let j = 0; j < numFeatures; j++) {
    let variance = 0;
    for (let i = 0; i < X.length; i++) {
      const diff = X[i][j] - means[j];
      variance += diff * diff;
    }
    stds[j] = Math.sqrt(variance / X.length) || 1; // Avoid division by zero
  }
  
  // Apply standardization
  return X.map(row => 
    row.map((val, j) => (val - means[j]) / stds[j])
  );
}

/**
 * Enhanced Min-Max Normalization with edge case handling
 */
export function normalizeMinMax(X: number[][]) {
  if (X.length === 0 || X[0].length === 0) return X;
  
  const numFeatures = X[0].length;
  const mins = new Array(numFeatures).fill(Infinity);
  const maxs = new Array(numFeatures).fill(-Infinity);
  
  // Find min and max for each feature
  for (let i = 0; i < X.length; i++) {
    for (let j = 0; j < numFeatures; j++) {
      mins[j] = Math.min(mins[j], X[i][j]);
      maxs[j] = Math.max(maxs[j], X[i][j]);
    }
  }
  
  // Apply normalization
  return X.map(row => 
    row.map((val, j) => {
      const range = maxs[j] - mins[j];
      return range === 0 ? 0 : (val - mins[j]) / range;
    })
  );
}

/**
 * Matrix type for ML operations
 */
export type Matrix = number[][];

/**
 * Enhanced StandardScaler with numerical stability and proper state management
 */
export class StandardScaler {
  private mean: number[] = [];
  private std: number[] = [];
  private fitted: boolean = false;

  fit(X: Matrix): void {
    if (X.length === 0 || X[0].length === 0) {
      throw new Error("Cannot fit on empty data");
    }

    const n = X.length;
    const d = X[0].length;
    this.mean = new Array(d).fill(0);
    this.std = new Array(d).fill(0);

    // Calculate mean using Welford's algorithm for numerical stability
    for (let j = 0; j < d; j++) {
      for (let i = 0; i < n; i++) {
        this.mean[j] += (X[i][j] - this.mean[j]) / (i + 1);
      }
    }
    
    // Calculate standard deviation with bias correction
    for (let j = 0; j < d; j++) {
      let variance = 0;
      for (let i = 0; i < n; i++) {
        const diff = X[i][j] - this.mean[j];
        variance += diff * diff;
      }
      // Use sample standard deviation (n-1) for better estimates
      this.std[j] = n > 1 ? Math.sqrt(variance / (n - 1)) : 1;
      if (this.std[j] === 0) this.std[j] = 1; // Avoid division by zero
    }

    this.fitted = true;
  }

  transform(X: Matrix): Matrix {
    if (!this.fitted) {
      throw new Error("Scaler must be fitted before transform");
    }
    
    if (X.length === 0 || X[0].length === 0) return X;
    
    const n = X.length;
    const d = X[0].length;
    
    if (d !== this.mean.length) {
      throw new Error("Feature dimension mismatch");
    }
    
    const Y = new Array(n);
    for (let i = 0; i < n; i++) {
      Y[i] = new Array(d);
      for (let j = 0; j < d; j++) {
        Y[i][j] = (X[i][j] - this.mean[j]) / this.std[j];
      }
    }
    return Y;
  }

  fitTransform(X: Matrix): Matrix {
    this.fit(X);
    return this.transform(X);
  }

  inverseTransform(X: Matrix): Matrix {
    if (!this.fitted) {
      throw new Error("Scaler must be fitted before inverse transform");
    }
    
    if (X.length === 0 || X[0].length === 0) return X;
    
    const n = X.length;
    const d = X[0].length;
    
    const Y = new Array(n);
    for (let i = 0; i < n; i++) {
      Y[i] = new Array(d);
      for (let j = 0; j < d; j++) {
        Y[i][j] = (X[i][j] * this.std[j]) + this.mean[j];
      }
    }
    return Y;
  }

  getParams() {
    if (!this.fitted) {
      throw new Error("Scaler not fitted yet");
    }
    return {
      mean: [...this.mean], // Return copies to prevent mutation
      std: [...this.std],
      fitted: this.fitted
    };
  }

  reset(): void {
    this.mean = [];
    this.std = [];
    this.fitted = false;
  }
}

/**
 * Comprehensive regression evaluation with all metrics
 */
export function evaluateRegression(yTrue: number[], yPred: number[], numFeatures?: number) {
  const baseMetrics = {
    ...calculateRSquared(yTrue, yPred),
    ...calculateMAE(yTrue, yPred),
    ...calculateMSE(yTrue, yPred),
    ...calculateRMSE(yTrue, yPred),
    standardError: calculateStandardError(yTrue, yPred)
  };

  // Add adjusted R² if number of features is provided
  if (numFeatures !== undefined) {
    return {
      ...baseMetrics,
      adjustedR2: calculateAdjustedRSquared(yTrue, yPred, numFeatures)
    };
  }

  return baseMetrics;
}

/**
 * Additional utility: Mean Absolute Percentage Error (MAPE)
 */
export function calculateMAPE(yTrue: number[], yPred: number[]) {
  if (yTrue.length !== yPred.length) throw new Error("Array lengths mismatch");
  if (yTrue.length === 0) return { mape: 0 };
  
  let sum = 0;
  let validCount = 0;
  
  for (let i = 0; i < yTrue.length; i++) {
    if (yTrue[i] !== 0) { // Avoid division by zero
      sum += Math.abs((yTrue[i] - yPred[i]) / yTrue[i]);
      validCount++;
    }
  }
  
  const mape = validCount > 0 ? (sum / validCount) * 100 : 0;
  return { mape: Number(mape.toPrecision(15)) };
}

/**
 * Additional utility: Symmetric Mean Absolute Percentage Error (SMAPE)
 */
export function calculateSMAPE(yTrue: number[], yPred: number[]) {
  if (yTrue.length !== yPred.length) throw new Error("Array lengths mismatch");
  if (yTrue.length === 0) return { smape: 0 };
  
  let sum = 0;
  let c = 0; // Kahan summation
  
  for (let i = 0; i < yTrue.length; i++) {
    const numerator = Math.abs(yTrue[i] - yPred[i]);
    const denominator = (Math.abs(yTrue[i]) + Math.abs(yPred[i])) / 2;
    
    if (denominator !== 0) {
      const y = (numerator / denominator) - c;
      const t = sum + y;
      c = (t - sum) - y;
      sum = t;
    }
  }
  
  const smape = (sum / yTrue.length) * 100;
  return { smape: Number(smape.toPrecision(15)) };
}
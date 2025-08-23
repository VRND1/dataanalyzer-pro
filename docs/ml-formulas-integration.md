# Machine Learning Formulas Integration Guide

This document explains how to use the enhanced machine learning formulas that have been integrated into your data analyzer system.

## Overview

The following formulas have been implemented and integrated into your system:

1. **Train-Test Split (80/20)** - `X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)`
2. **Normalization (Standardization)** - `X_scaled = (X - μ_X) / σ_X` and `y_scaled = (y - μ_y) / σ_y`
3. **Neural Network Training** - MLPRegressor with MSE loss: `Loss = (1/n) * Σ(y_i - ŷ_i)²`
4. **R² Score (Coefficient of Determination)** - `R² = 1 - [Σ(y_i - ŷ_i)² / Σ(y_i - ȳ)²]`
5. **MAE (Mean Absolute Error)** - `MAE = (1/n) * Σ|y_i - ŷ_i|`

## Files Modified

### 1. New ML Formulas Implementation
- **File**: `src/utils/analysis/ml/MLFormulas.ts`
- **Purpose**: Contains all the mathematical formulas as standalone functions
- **Key Functions**:
  - `trainTestSplit()` - Implements 80/20 data splitting
  - `normalizeData()` - Implements standardization formulas
  - `trainNeuralNetwork()` - Implements neural network training with MSE loss
  - `calculateRSquared()` - Implements R² calculation formula
  - `calculateMAE()` - Implements MAE calculation formula
  - `runCompleteMLPipeline()` - Combines all formulas into one pipeline

### 2. Enhanced Universal ML Service
- **File**: `src/utils/analysis/ml/UniversalMLService.ts`
- **Changes**: Updated `calculateMetrics()` function to use the new formulas
- **Integration**: Now uses `calculateRSquared()` and `calculateMAE()` from MLFormulas

### 3. Enhanced Backend Regression
- **File**: `backend-node/routes/regression.js`
- **Changes**: Updated `calculateRegressionMetrics()` function
- **Integration**: Now uses the exact formulas from the documentation

### 4. Enhanced Regression Metrics
- **File**: `src/utils/analysis/regression/metrics.ts`
- **Changes**: Updated `calculateRegressionMetrics()` function
- **Integration**: Now uses the enhanced formulas with detailed logging

## Usage Examples

### Example 1: Using Individual Formulas

```typescript
import { 
  trainTestSplit, 
  normalizeData, 
  trainNeuralNetwork, 
  calculateRSquared, 
  calculateMAE 
} from './src/utils/analysis/ml/MLFormulas';

// Sample data
const X = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6]];
const y = [2, 4, 6, 8, 10];

// Step 1: Train-Test Split (80/20)
const { X_train, X_test, y_train, y_test } = trainTestSplit(X, y, 0.2);

// Step 2: Normalization using training stats
const normalizationTrain = normalizeData(X_train, y_train);

const X_train_scaled = normalizationTrain.X_scaled;
const y_train_scaled = normalizationTrain.y_scaled;

// Normalize test data using train means/stds
const X_test_scaled = X_test.map(row => 
  row.map((val, j) => {
    const std = normalizationTrain.featureStds[j];
    return std === 0 ? 0 : (val - normalizationTrain.featureMeans[j]) / std;
  })
);

const y_test_scaled = y_test.map(val => 
  normalizationTrain.targetStd === 0 ? 0 : (val - normalizationTrain.targetMean) / normalizationTrain.targetStd
);

// Step 3: Neural Network Training
const trainingResult = trainNeuralNetwork(X_train_scaled, y_train_scaled, {
  learningRate: 0.001,
  epochs: 50,
  batchSize: 32,
  earlyStoppingPatience: 10
});

// Step 4: Make predictions
const predictions = X_test_scaled.map(x => {
  let pred = trainingResult.biases[0];
  for (let k = 0; k < trainingResult.weights[0].length; k++) {
    pred += trainingResult.weights[0][k] * x[k];
  }
  return pred;
});

// Step 5: Calculate metrics using formulas
const r2Result = calculateRSquared(y_test_scaled, predictions);
const maeResult = calculateMAE(y_test_scaled, predictions);

console.log('R² Score:', r2Result.r2Score);
console.log('MAE:', maeResult.mae);
```

### Example 2: Using Complete Pipeline

```typescript
import { runCompleteMLPipeline } from './src/utils/analysis/ml/MLFormulas';

// Sample data
const X = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6]];
const y = [2, 4, 6, 8, 10];

// Run complete pipeline with all formulas
const result = runCompleteMLPipeline(X, y, {
  learningRate: 0.001,
  epochs: 50,
  batchSize: 32,
  earlyStoppingPatience: 10
});

console.log('Complete Pipeline Results:');
console.log('R² Score:', result.metrics.r2Score);
console.log('MAE:', result.metrics.mae);
console.log('Final Loss:', result.metrics.finalLoss);
console.log('Training Time:', result.metrics.trainingTime);
```

### Example 3: Using Enhanced ML Service

```typescript
import { UniversalMLService } from './src/utils/analysis/ml/UniversalMLService';

const mlService = UniversalMLService.getInstance();

// Configure the service
mlService.configure({
  trainTestSplit: 0.8,
  epochs: 50,
  learningRate: 0.001,
  normalizeData: true
});

// The service now uses the enhanced formulas internally
// All calculations will use the exact formulas from the documentation
```

## Formula Details

### 1. Train-Test Split (80/20)
```typescript
// Formula: X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
const { X_train, X_test, y_train, y_test } = trainTestSplit(X, y, 0.2);
```

### 2. Normalization (Standardization)
```typescript
// Formula: X_scaled = (X - μ_X) / σ_X
// Formula: y_scaled = (y - μ_y) / σ_y
const { X_scaled, y_scaled } = normalizeData(X, y);
```

### 3. Neural Network Training
```typescript
// Model: MLPRegressor (multi-layer perceptron)
// Settings: Learning Rate = 0.001, Epochs = 50, Batch Size = 32
// Formula: Loss = (1/n) * Σ(y_i - ŷ_i)²
const trainingResult = trainNeuralNetwork(X_train, y_train, config);
```

### 4. R² Score (Coefficient of Determination)
```typescript
// Formula: R² = 1 - [Σ(y_i - ŷ_i)² / Σ(y_i - ȳ)²]
const r2Result = calculateRSquared(actual, predicted);
```

### 5. MAE (Mean Absolute Error)
```typescript
// Formula: MAE = (1/n) * Σ|y_i - ŷ_i|
const maeResult = calculateMAE(actual, predicted);
```

## Integration Points

### Frontend Integration
The formulas are now integrated into:
- `UniversalMLService.calculateMetrics()` - Uses enhanced R² and MAE calculations
- All regression analysis components
- ML analysis views and components

### Backend Integration
The formulas are integrated into:
- `backend-node/routes/regression.js` - Enhanced metrics calculation
- All regression endpoints
- Cross-validation and feature importance calculations

### Console Logging
All calculations now include detailed logging:
```
=== Enhanced Metrics Calculation with ML Formulas ===
MAE (using formula): 0.123
R² Score (using formula): 0.987
SS Residual: 0.045
SS Total: 3.456
Mean Actual: 5.2
==============================
```

## Benefits

1. **Mathematical Accuracy**: All calculations now use the exact formulas from the documentation
2. **Consistency**: Same formulas used across frontend and backend
3. **Transparency**: Detailed logging shows intermediate calculations
4. **Modularity**: Formulas can be used independently or as a complete pipeline
5. **Extensibility**: Easy to add new formulas or modify existing ones

## Testing the Integration

To verify the integration is working:

1. Run any regression analysis in your application
2. Check the browser console for the enhanced logging messages
3. Verify that the R² and MAE values are calculated using the new formulas
4. Compare results with the original calculations to ensure accuracy

The enhanced formulas are now fully integrated into your data analyzer system and will be used automatically for all machine learning calculations. 
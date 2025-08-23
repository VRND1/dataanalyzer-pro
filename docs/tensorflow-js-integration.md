# TensorFlow.js Neural Network Integration

This document explains the new TensorFlow.js neural network implementation that has been integrated into your data analyzer system.

## Overview

The TensorFlow.js integration provides a more sophisticated neural network implementation that complements the existing custom neural network implementation. It offers:

- **Advanced Architecture**: Multi-layer perceptron with configurable layers
- **Optimized Training**: Uses TensorFlow.js optimizers and loss functions
- **GPU Acceleration**: Automatic GPU utilization when available
- **Better Convergence**: More sophisticated optimization algorithms
- **Production Ready**: Industry-standard deep learning framework

## New Functions Added

### 1. `trainNeuralNetworkTFJS(X, y, config)`

The main TensorFlow.js neural network training function.

**Parameters:**
- `X: number[][]` - Feature matrix
- `y: number[]` - Target values
- `config: object` - Training configuration

**Configuration Options:**
```typescript
{
  trainSplit: 0.75,        // Training/test split ratio
  normalizeData: true,      // Whether to normalize data
  learningRate: 0.001,      // Learning rate for optimizer
  epochs: 50,              // Number of training epochs
  batchSize: 32            // Batch size for training
}
```

**Returns:**
```typescript
{
  r2: number,              // R-squared score
  mae: number,             // Mean absolute error
  y_pred: number[],        // Predicted values
  y_test: number[]         // Actual test values
}
```

### 2. `standardizeTrainTest(X_train, X_test)`

Standardizes training and test data using training statistics only.

**Parameters:**
- `X_train: number[][]` - Training feature matrix
- `X_test: number[][]` - Test feature matrix

**Returns:**
```typescript
{
  X_train_scaled: number[][],  // Scaled training data
  X_test_scaled: number[][],   // Scaled test data
  featureMeans: number[],       // Feature means from training data
  featureStds: number[]         // Feature standard deviations from training data
}
```

## Usage Examples

### Basic Usage

```typescript
import { trainNeuralNetworkTFJS } from './src/utils/analysis/ml/MLFormulas';

// Sample data
const X = [
  [1, 2, 3],
  [2, 3, 4],
  [3, 4, 5],
  [4, 5, 6],
  [5, 6, 7],
  [6, 7, 8]
];
const y = [6, 9, 12, 15, 18, 21];

// Configuration
const config = {
  trainSplit: 0.75,
  normalizeData: true,
  learningRate: 0.001,
  epochs: 50,
  batchSize: 32
};

// Train neural network
const result = await trainNeuralNetworkTFJS(X, y, config);

console.log('R² Score:', result.r2);
console.log('MAE:', result.mae);
console.log('Predictions:', result.y_pred);
```

### Advanced Usage with Custom Configuration

```typescript
import { trainNeuralNetworkTFJS, standardizeTrainTest } from './src/utils/analysis/ml/MLFormulas';

// Large dataset
const X = Array.from({ length: 1000 }, (_, i) => [
  i * 0.1,
  Math.sin(i * 0.1),
  Math.cos(i * 0.1),
  Math.random()
]);
const y = X.map(([x1, x2, x3, x4]) => 
  2 * x1 + 3 * x2 - x3 + 0.5 * x4 + Math.random() * 0.1
);

// Advanced configuration
const config = {
  trainSplit: 0.8,
  normalizeData: true,
  learningRate: 0.0005,  // Lower learning rate for stability
  epochs: 100,           // More epochs for complex data
  batchSize: 64          // Larger batch size for efficiency
};

const result = await trainNeuralNetworkTFJS(X, y, config);

console.log('Advanced Training Results:');
console.log('R² Score:', result.r2);
console.log('MAE:', result.mae);
```

### Using StandardizeTrainTest Directly

```typescript
import { standardizeTrainTest } from './src/utils/analysis/ml/MLFormulas';

const X_train = [
  [1, 2, 3],
  [2, 3, 4],
  [3, 4, 5]
];

const X_test = [
  [2.5, 3.5, 4.5],
  [4, 5, 6]
];

const { X_train_scaled, X_test_scaled, featureMeans, featureStds } = 
  standardizeTrainTest(X_train, X_test);

console.log('Feature means:', featureMeans);
console.log('Feature standard deviations:', featureStds);
console.log('Scaled training data:', X_train_scaled);
console.log('Scaled test data:', X_test_scaled);
```

## Comparison with Original Implementation

### Original Neural Network (`trainNeuralNetwork`)

**Advantages:**
- Lightweight and fast for small datasets
- No external dependencies
- Customizable architecture
- Good for educational purposes

**Use Cases:**
- Small datasets (< 1000 samples)
- Simple regression problems
- Educational demonstrations
- Resource-constrained environments

### TensorFlow.js Neural Network (`trainNeuralNetworkTFJS`)

**Advantages:**
- Industry-standard framework
- GPU acceleration support
- Advanced optimization algorithms
- Better convergence for complex problems
- Production-ready implementation

**Use Cases:**
- Large datasets (> 1000 samples)
- Complex regression problems
- Production applications
- When GPU acceleration is available

## Performance Comparison

| Metric | Original | TensorFlow.js |
|--------|----------|---------------|
| Small Dataset (< 100 samples) | ⚡ Fast | 🐌 Slower (overhead) |
| Large Dataset (> 1000 samples) | 🐌 Slow | ⚡ Fast |
| GPU Acceleration | ❌ No | ✅ Yes |
| Memory Usage | 💚 Low | 🟡 Medium |
| Convergence | 🟡 Good | 💚 Excellent |

## Integration with Existing System

The TensorFlow.js implementation integrates seamlessly with your existing ML formulas system:

1. **Uses existing metrics**: `calculateRSquared` and `calculateMAE`
2. **Compatible data format**: Same input/output format as original
3. **Consistent preprocessing**: Uses `standardizeTrainTest` for normalization
4. **Unified interface**: Similar configuration and return format

## Error Handling

The implementation includes robust error handling:

```typescript
try {
  const result = await trainNeuralNetworkTFJS(X, y, config);
  console.log('Training successful:', result);
} catch (error) {
  console.error('Training failed:', error.message);
  
  // Common error scenarios:
  // - Invalid data format
  // - Empty dataset
  // - NaN values in data
  // - TensorFlow.js initialization issues
}
```

## Best Practices

### 1. Data Preprocessing

```typescript
// Always normalize data for neural networks
const config = {
  normalizeData: true,
  // ... other config
};
```

### 2. Hyperparameter Tuning

```typescript
// For small datasets
const smallDatasetConfig = {
  learningRate: 0.001,
  epochs: 50,
  batchSize: 16
};

// For large datasets
const largeDatasetConfig = {
  learningRate: 0.0005,
  epochs: 100,
  batchSize: 64
};
```

### 3. Model Evaluation

```typescript
// Always evaluate on test set
const result = await trainNeuralNetworkTFJS(X, y, config);

// Check for overfitting
if (result.r2 > 0.95 && result.mae < 0.01) {
  console.log('Model may be overfitting');
}

// Check for underfitting
if (result.r2 < 0.5) {
  console.log('Model may be underfitting - try more epochs or features');
}
```

## Troubleshooting

### Common Issues

1. **"TensorFlow.js not initialized"**
   - Solution: Ensure TensorFlow.js is properly imported and initialized

2. **"Out of memory"**
   - Solution: Reduce batch size or dataset size

3. **"NaN predictions"**
   - Solution: Check for NaN values in input data, normalize data

4. **"Poor convergence"**
   - Solution: Adjust learning rate, increase epochs, normalize data

### Debug Mode

Enable detailed logging:

```typescript
const config = {
  // ... other config
  verbose: 1  // Enable TensorFlow.js verbose output
};
```

## Future Enhancements

Planned improvements:

1. **Model Persistence**: Save and load trained models
2. **Advanced Architectures**: LSTM, CNN support
3. **Hyperparameter Optimization**: Automatic tuning
4. **Cross-validation**: K-fold validation support
5. **Feature Importance**: Model interpretability

## Conclusion

The TensorFlow.js integration provides a powerful, production-ready neural network implementation that complements your existing ML system. Use it for complex problems and large datasets, while the original implementation remains excellent for simple cases and educational purposes.

Both implementations use the same mathematical formulas and evaluation metrics, ensuring consistency across your data analyzer system. 
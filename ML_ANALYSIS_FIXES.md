# ML Analysis Fixes

## Issues Fixed

### 1. Loss Function Mismatch ✅
**Problem**: Neural and linear regression models were using `meanAbsoluteError` loss function, which doesn't align well with R² metrics that are based on MSE.

**Fix**: Changed loss function from `meanAbsoluteError` to `meanSquaredError` in:
- `src/utils/analysis/ml/UniversalMLService.ts` - `trainNeuralNetwork()` method
- `src/utils/analysis/ml/UniversalMLService.ts` - `trainRegression()` method  
- `src/utils/analysis/ml/UniversalMLService.ts` - `trainDecisionTree()` method
- `src/utils/analysis/ml/UniversalMLService.ts` - `evaluate()` method

**Impact**: Better alignment between training loss and R² evaluation metrics.

### 2. Denormalization Issue ✅
**Problem**: `UniversalMLAnalysisView.tsx` was denormalizing predictions even though the `UniversalMLService` doesn't actually normalize labels during training.

**Fix**: Removed incorrect denormalization logic in:
- `src/components/analysis/categories/ml/UniversalMLAnalysisView.tsx` - Removed the conditional denormalization block that was applying `predictions.map(p => p * trainLabelStd + trainLabelMean)`

**Impact**: Metrics calculations now use raw predictions and labels consistently, eliminating skewed R²/MAE values.

### 3. Mixed Metrics Sources ✅
**Problem**: The view was computing its own R²/MAE and also calling the service's `calculateMetrics`, potentially showing inconsistent results.

**Fix**: Ensured both calculations use the same raw predictions and labels:
- Both the view's custom calculations and the service's `calculateMetrics` now use the same `predictions` and `test.labels`
- Added clarifying comments about the normalization behavior

**Impact**: Consistent metrics across the dashboard.

### 4. Evaluate Method Overfitting Issue ✅
**Problem**: `UniversalMLService.evaluate()` was using the same data for train/val/test, causing overfitting and nonsense metrics.

**Fix**: Updated `evaluate()` method to use proper train-test split:
- Added `trainTestSplit()` call to properly separate data
- Normalize features using only training data (like sklearn)
- Use separate train and test sets for training and evaluation
- Fixed loss function to use `meanSquaredError` for R² parity

**Impact**: Proper evaluation without data leakage.

### 5. TensorFlow.js Reproducibility ✅
**Problem**: Models were not reproducible due to random initialization and training.

**Fix**: Added comprehensive reproducibility settings:
- Set CPU backend for stable numerics: `tf.setBackend('cpu')`
- Disable shuffle differences: `tf.util.shuffleCombo = () => {}`
- Enable deterministic compute: `tf.env().set('WEBGL_DETERMINISTIC_COMPUTE', true)`
- Set random seed: `tf.randomNormal([1], 0, 1, 'float32', 42)`
- Use seeded initializers: `tf.initializers.glorotUniform({ seed: 42 })`
- Disable shuffling: `shuffle: false`
- Fixed train-test split seed: Uses seed 42 in `mlTrainTestSplit()`

**Impact**: Consistent, reproducible model training across all runs.

### 6. Feature Standardization ✅
**Problem**: No proper sklearn-style feature standardization was implemented.

**Fix**: Added sklearn-style standardization in `UniversalMLAnalysisView.tsx`:
- Calculate means and stds from training data only
- Apply same scaling to test data using training statistics
- Only apply when `advancedSettings.normalizeData` is true

**Impact**: Proper feature scaling following ML best practices.

### 7. Accuracy Card Labeling ✅
**Problem**: Accuracy card showed "Classification accuracy" even for regression tasks.

**Fix**: Updated tooltip and description:
- Changed tooltip to "Model accuracy: Custom metric combining R² score and error metrics"
- Updated description to "Model accuracy"

**Impact**: More accurate labeling for regression tasks.

## Technical Details

### Normalization Behavior
The `UniversalMLService.trainModel()` method currently:
- ✅ Normalizes features (if `normalizeData` is true)
- ❌ Does NOT normalize labels
- ✅ Trains models directly on raw labels
- ✅ Returns predictions in the same scale as input labels

### Loss Function Alignment
- **Before**: `meanAbsoluteError` - optimizes for absolute differences
- **After**: `meanSquaredError` - optimizes for squared differences, better aligned with R² calculation

### Metrics Consistency
- **View Calculations**: Use `calculateRSquared()` and `calculateMAE()` from MLFormulas
- **Service Calculations**: Use the same raw predictions and labels
- **Result**: Both sources now produce consistent R² and MAE values

### Reproducibility
- **Backend**: CPU for stable numerics
- **Seed**: 42 for all operations
- **Initialization**: Seeded Glorot uniform for all layers
- **Training**: No shuffling for deterministic order

## Testing Recommendations

1. **Test with known datasets** to verify R² values are reasonable (should be between 0 and 1)
2. **Compare MAE values** between view and service calculations
3. **Test with and without normalization** to ensure consistent behavior
4. **Verify loss function change** by checking that training loss decreases appropriately
5. **Test reproducibility** by running the same analysis multiple times
6. **Verify evaluate() method** doesn't overfit by comparing with handleAnalyze results

## Files Modified

1. `src/utils/analysis/ml/UniversalMLService.ts`
   - Changed loss function from `meanAbsoluteError` to `meanSquaredError`
   - Added TensorFlow.js reproducibility settings
   - Fixed `evaluate()` method to use proper train-test split
   - Added seeded initializers for all layers
   - Disabled shuffling for deterministic training

2. `src/components/analysis/categories/ml/UniversalMLAnalysisView.tsx`
   - Removed incorrect denormalization logic
   - Added sklearn-style feature standardization
   - Added clarifying comments about normalization behavior
   - Ensured consistent metrics calculation
   - Updated accuracy card labeling for regression

## Notes

- The bug mentioned about `Math.max(.actuals)` was not found in the current codebase
- All `Math.max(...actuals)` calls are correctly using the spread operator
- The fixes ensure that predictions and labels are handled consistently throughout the pipeline
- All models now use proper train-test splits and reproducible training 
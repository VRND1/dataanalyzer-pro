# Regression Type Mapping Fix

## Problem Description

You were getting the same analysis results for every regression model because of incorrect type mapping between the frontend UI components and the backend regression algorithms.

## Root Cause

The issue was in the `RegressionDashboard.tsx` component where the model selection was using incorrect string transformations:

```typescript
// PROBLEMATIC CODE (before fix)
const regressionResults = await performRegression(fields, {
  type: selectedModel.toLowerCase().replace(/\s+/g, '_') as any
});
```

The `regressionFilters` array contained display names like:
- "Ridge (L2)" → became "ridge_(l2)" ❌
- "Lasso (L1)" → became "lasso_(l1)" ❌  
- "Elastic Net" → became "elastic_net" ❌
- "Time Series" → became "time_series" ❌
- "Log-Log" → became "log-log" ✅ (only this one was correct)

But the actual `RegressionType` enum expected:
- `'ridge'` ✅
- `'lasso'` ✅
- `'elastic-net'` ✅
- `'time-series'` ✅
- `'log-log'` ✅

Since none of the transformed strings matched the expected types, the switch statement in `performRegression()` always fell through to the `default` case, which always executed `calculateLinearRegression()`.

## Solution

### 1. Fixed RegressionDashboard.tsx

Created a proper mapping function:

```typescript
// SOLUTION: Proper type mapping
const getRegressionType = (displayName: string): RegressionType => {
  const mapping: Record<string, RegressionType> = {
    "Linear": "linear",
    "Multiple Linear": "linear", // Multiple linear uses the same linear algorithm
    "Logistic": "logistic",
    "Polynomial": "polynomial",
    "Ridge (L2)": "ridge",
    "Lasso (L1)": "lasso",
    "Elastic Net": "elastic-net",
    "Stepwise": "linear", // Stepwise uses linear as base
    "Time Series": "time-series",
    "Quantile": "quantile",
    "Log-Log": "log-log"
  };
  
  return mapping[displayName] || "linear";
};
```

### 2. Fixed RegressionAnalysis.tsx

Updated the model types array to use correct `RegressionType` values:

```typescript
// BEFORE (incorrect types)
const modelTypes = [
  { type: 'multiple_linear', label: 'Multiple Linear', ... }, // ❌
  { type: 'elastic_net', label: 'Elastic Net', ... }, // ❌
  { type: 'time_series', label: 'Time Series', ... }, // ❌
  { type: 'log_log', label: 'Log-Log', ... } // ❌
];

// AFTER (correct types)
const modelTypes = [
  { type: 'linear', label: 'Multiple Linear', ... }, // ✅
  { type: 'elastic-net', label: 'Elastic Net', ... }, // ✅
  { type: 'time-series', label: 'Time Series', ... }, // ✅
  { type: 'log-log', label: 'Log-Log', ... } // ✅
];
```

### 3. Updated Switch Statement

Replaced the old switch statement with proper function calls:

```typescript
// BEFORE (always defaulted to linear)
switch (selectedModel) {
  case 'linear':
    regressionResult = performLinearRegression(x, y);
    break;
  case 'polynomial':
    regressionResult = performPolynomialRegression(x, y, polynomialDegree);
    break;
  case 'ridge':
  case 'lasso':
  case 'elastic_net': // ❌ Wrong type name
    // Always fell through to default
    break;
  default:
    regressionResult = performLinearRegression(x, y); // Always executed
}

// AFTER (proper function calls)
switch (selectedModel) {
  case 'linear':
    regressionResult = calculateLinearRegression(targetField, featureField);
    break;
  case 'polynomial':
    regressionResult = calculatePolynomialRegression(targetField, featureField, polynomialDegree);
    break;
  case 'ridge':
    regressionResult = calculateRidgeRegression(targetField, featureField, regularizationStrength);
    break;
  case 'lasso':
    regressionResult = calculateLassoRegression(targetField, featureField, regularizationStrength);
    break;
  case 'elastic-net': // ✅ Correct type name
    regressionResult = calculateElasticNetRegression(targetField, featureField, regularizationStrength, 0.5);
    break;
  // ... other cases
}
```

## Verification

To verify the fix is working:

1. **Different R² Scores**: Each regression type should produce different R² scores
2. **Different Coefficients**: Each algorithm should produce different coefficients
3. **Different Equations**: The equation strings should reflect the different algorithms
4. **Correct Type Labels**: The result.type should match the selected model

## Expected Results

Now when you select different regression models, you should see:

- **Linear**: Simple linear relationship
- **Polynomial**: Higher R² due to polynomial terms
- **Ridge**: Similar to linear but with regularization
- **Lasso**: May have zero coefficients due to L1 penalty
- **Elastic Net**: Combination of L1 and L2 regularization
- **Logistic**: Classification metrics instead of R²
- **Quantile**: Robust regression for different quantiles
- **Log-Log**: Power law relationship

## Files Modified

1. `src/components/analysis/categories/regression/RegressionDashboard.tsx`
   - Added `getRegressionType()` mapping function
   - Updated regression call with proper options

2. `src/components/analysis/categories/regression/RegressionAnalysis.tsx`
   - Fixed model types array
   - Updated switch statement
   - Added proper imports

3. `docs/regression-type-mapping-fix.md` (this file)
   - Documentation of the issue and solution

## Testing

You can now test by:
1. Uploading a dataset with numeric columns
2. Selecting different regression models
3. Observing that each produces different results
4. Checking that the R² scores, coefficients, and equations vary appropriately

The fix ensures that each regression algorithm is properly called and produces its unique analysis results.

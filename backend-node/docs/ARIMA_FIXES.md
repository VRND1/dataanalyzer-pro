# ARIMA Analysis Fixes and Usage Guide

## Issues Fixed

### 1. Method Mismatch in Route Calls
**Problem**: The route was calling `arimaService.generateForecast()` but the service only had `forecast()` method.

**Solution**: Added the missing `generateForecast()` method to the service with proper parameter handling.

### 2. Missing Service Methods
**Problem**: Routes called `calculateResiduals()` and `calculateFittedValues()` which didn't exist.

**Solution**: Implemented both methods in the ARIMA service:
- `calculateResiduals(data, fittedValues)` - Calculates residuals between original and fitted data
- `calculateFittedValues(data, arParams, maParams, ...)` - Calculates fitted values for the time series

### 3. Data Validation Requirements
**Problem**: Backend requires ≥10 data points but validation messages weren't clear.

**Solution**: Enhanced validation with:
- Clear error messages showing actual vs required data points
- Warnings for limited data (10-20 points)
- Better data format validation

### 4. Method Signature Mismatches
**Problem**: Route expected different parameter structures than service provided.

**Solution**: Updated service methods to match route expectations and added proper error handling.

## How to Use the ARIMA API

### Data Requirements

**Minimum**: 10 data points (for basic analysis)
**Recommended**: 20-30+ data points (for reliable results)
**Format**: Array of objects with `timestamp` and `value` properties

```json
{
  "data": [
    { "timestamp": 1640995200000, "value": 100.5 },
    { "timestamp": 1641081600000, "value": 102.3 },
    { "timestamp": 1641168000000, "value": 98.7 }
  ]
}
```

### Basic ARIMA Analysis

**Endpoint**: `POST /api/arima/analyze`

```json
{
  "data": [
    { "timestamp": 1640995200000, "value": 100.5 },
    { "timestamp": 1641081600000, "value": 102.3 }
  ],
  "parameters": {
    "p": 1,
    "d": 1,
    "q": 1,
    "seasonal": false,
    "seasonalPeriod": 12
  },
  "forecastPeriods": 12,
  "confidenceLevel": 0.95
}
```

### Auto-Detect Parameters

**Endpoint**: `POST /api/arima/auto-detect`

```json
{
  "data": [
    { "timestamp": 1640995200000, "value": 100.5 },
    { "timestamp": 1641081600000, "value": 102.3 }
  ]
}
```

### Generate Forecasts

**Endpoint**: `POST /api/arima/forecast`

```json
{
  "data": [100.5, 102.3, 98.7, 105.2],
  "parameters": {
    "ar": [0.5],
    "ma": [0.3],
    "seasonal_ar": [],
    "seasonal_ma": [],
    "d": 1,
    "seasonal_period": 12
  },
  "periods": 12
}
```

## Common Issues and Solutions

### 1. "Insufficient data" Error
**Cause**: Less than 10 data points provided
**Solution**: 
- Aggregate your data to daily/weekly totals
- Collect more historical data
- Use a different analysis method for small datasets

### 2. "No valid numeric data points found"
**Cause**: Data contains non-numeric values or NaN/Infinity
**Solution**:
- Clean your data to remove invalid values
- Ensure all `value` fields are numbers
- Check for missing or corrupted data

### 3. Extended Forecast Failures
**Cause**: Complex seasonal parameters or insufficient data
**Solution**:
- Use basic ARIMA parameters (p=1, d=1, q=1)
- Ensure you have enough data points
- The system will fall back to standard forecast if extended fails

## Data Preparation Best Practices

### 1. Aggregation
For transaction data, aggregate to consistent time periods:
```javascript
// Daily aggregation example
const dailyTotals = transactions.reduce((acc, txn) => {
  const date = new Date(txn.timestamp).toDateString();
  acc[date] = (acc[date] || 0) + txn.amount;
  return acc;
}, {});
```

### 2. Sorting
Ensure data is sorted by timestamp:
```javascript
data.sort((a, b) => a.timestamp - b.timestamp);
```

### 3. Handling Missing Values
```javascript
// Simple forward fill
let lastValue = null;
const cleanedData = data.map(item => {
  if (item.value === null || isNaN(item.value)) {
    item.value = lastValue;
  } else {
    lastValue = item.value;
  }
  return item;
});
```

## Performance Considerations

### 1. Data Size Limits
- **Optimal**: 50-200 data points
- **Maximum**: 1000+ data points (may be slow)
- **Minimum**: 10 data points (unreliable results)

### 2. Parameter Ranges
- **p (AR order)**: 0-5 (higher = more complex)
- **d (Differencing)**: 0-2 (usually 1 for non-stationary data)
- **q (MA order)**: 0-5 (higher = more complex)

### 3. Seasonal Parameters
- **seasonalPeriod**: 2-24 (12 for monthly, 4 for quarterly)
- **P, D, Q**: 0-3 (seasonal AR, differencing, MA orders)

## Error Handling

The API now provides detailed error messages:

```json
{
  "success": false,
  "error": "Validation error",
  "details": ["\"data\" must contain at least 10 items"],
  "requirements": {
    "minimumDataPoints": 10,
    "dataFormat": "Array of objects with timestamp and value properties",
    "example": {
      "data": [
        { "timestamp": 1640995200000, "value": 100.5 }
      ]
    }
  }
}
```

## Testing Your Data

Before running full analysis, validate your data:

1. **Check data length**: Ensure ≥10 points
2. **Verify data types**: All values should be numbers
3. **Sort by timestamp**: Ensure chronological order
4. **Remove outliers**: Consider data cleaning
5. **Test with auto-detect**: Use `/api/arima/auto-detect` first

## Example Response

```json
{
  "success": true,
  "data": {
    "originalData": [100.5, 102.3, 98.7],
    "fittedValues": [100.2, 102.1, 98.9],
    "residuals": [0.3, 0.2, -0.2],
    "forecast": [105.1, 107.2, 109.3],
    "forecastIntervals": {
      "lower": [103.1, 105.2, 107.3],
      "upper": [107.1, 109.2, 111.3]
    },
    "parameters": {
      "ar": [0.5],
      "ma": [0.3],
      "d": 1,
      "seasonal_ar": [],
      "seasonal_ma": []
    },
    "metrics": {
      "aic": 45.2,
      "bic": 48.1,
      "rmse": 0.25,
      "mae": 0.23
    }
  }
}
```

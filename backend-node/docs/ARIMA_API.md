# ARIMA Analysis API Documentation

## Overview

The ARIMA (AutoRegressive Integrated Moving Average) API provides comprehensive time series analysis capabilities with accurate statistical modeling, parameter estimation, and forecasting.

## Features

- **Accurate Statistical Modeling**: Implements proper ARIMA methodology with Yule-Walker equations and maximum likelihood estimation
- **Parameter Auto-Detection**: Automatically finds optimal ARIMA parameters using information criteria
- **Seasonal ARIMA Support**: Handles seasonal patterns with SARIMA models
- **Model Diagnostics**: Comprehensive residual analysis and model validation
- **Confidence Intervals**: Provides forecast uncertainty quantification
- **Stationarity Testing**: Augmented Dickey-Fuller test for time series stationarity

## API Endpoints

### 1. ARIMA Analysis

**Endpoint:** `POST /api/arima/analyze`

**Description:** Perform complete ARIMA analysis on time series data

**Request Body:**
```json
{
  "data": [
    {
      "timestamp": 1640995200000,
      "value": 100.5,
      "field": "sales"
    }
  ],
  "parameters": {
    "p": 1,
    "d": 1,
    "q": 1,
    "seasonal": false,
    "seasonalPeriod": 12,
    "P": 0,
    "D": 0,
    "Q": 0
  },
  "forecastPeriods": 12,
  "confidenceLevel": 0.95
}
```

**Parameters:**
- `p`: AR order (0-5)
- `d`: Differencing order (0-2)
- `q`: MA order (0-5)
- `seasonal`: Enable seasonal components
- `seasonalPeriod`: Seasonal period (2-24)
- `P`: Seasonal AR order (0-3)
- `D`: Seasonal differencing (0-1)
- `Q`: Seasonal MA order (0-3)

**Response:**
```json
{
  "success": true,
  "data": {
    "originalData": [100.5, 101.2, ...],
    "fittedValues": [100.1, 101.0, ...],
    "residuals": [0.4, 0.2, ...],
    "forecast": [105.3, 106.1, ...],
    "forecastIntervals": {
      "lower": [103.1, 103.9, ...],
      "upper": [107.5, 108.3, ...]
    },
    "parameters": {
      "ar": [0.8],
      "ma": [0.3],
      "seasonal_ar": [],
      "seasonal_ma": [],
      "d": 1,
      "seasonal_period": 12
    },
    "metrics": {
      "rmse": 2.45,
      "mae": 1.89,
      "mape": 1.85,
      "aic": 245.67,
      "bic": 252.34,
      "logLikelihood": -120.83
    },
    "diagnostics": {
      "stationarity": true,
      "adfStatistic": -3.45,
      "criticalValues": {
        "1%": -3.43,
        "5%": -2.86,
        "10%": -2.57
      },
      "ljungBox": 12.34,
      "jarqueBera": 3.21,
      "durbinWatson": 1.98,
      "residualAutocorrelation": [0.1, -0.05, ...]
    },
    "modelInfo": {
      "order": { "p": 1, "d": 1, "q": 1 },
      "seasonal": null,
      "dataPoints": 100,
      "analysisDate": "2024-01-15T10:30:00.000Z"
    },
    "metadata": {
      "analysisType": "ARIMA",
      "parameters": { ... },
      "forecastPeriods": 12,
      "confidenceLevel": 0.95,
      "dataPoints": 100,
      "analysisDate": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 2. Auto-Detect Parameters

**Endpoint:** `POST /api/arima/auto-detect`

**Description:** Automatically find optimal ARIMA parameters

**Request Body:**
```json
{
  "data": [
    {
      "timestamp": 1640995200000,
      "value": 100.5
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "optimalParameters": {
      "p": 2,
      "d": 1,
      "q": 1
    },
    "dataPoints": 100,
    "analysisDate": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Generate Forecast

**Endpoint:** `POST /api/arima/forecast`

**Description:** Generate forecasts using existing ARIMA model

**Request Body:**
```json
{
  "data": [100.5, 101.2, 102.1, ...],
  "parameters": {
    "ar": [0.8],
    "ma": [0.3],
    "seasonal_ar": [],
    "seasonal_ma": [],
    "d": 1,
    "seasonal_period": 12
  },
  "periods": 12
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "forecast": [105.3, 106.1, 106.8, ...],
    "confidenceIntervals": {
      "lower": [103.1, 103.9, 104.6, ...],
      "upper": [107.5, 108.3, 109.0, ...]
    },
    "periods": 12,
    "parameters": { ... },
    "forecastDate": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Model Diagnostics

**Endpoint:** `POST /api/arima/diagnostics`

**Description:** Perform detailed model diagnostics

**Request Body:**
```json
{
  "residuals": [0.4, 0.2, -0.1, ...],
  "originalData": [100.5, 101.2, 102.1, ...],
  "parameters": {
    "ar": [0.8],
    "ma": [0.3],
    "seasonal_ar": [],
    "seasonal_ma": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "diagnostics": {
      "ljungBox": 12.34,
      "jarqueBera": 3.21,
      "durbinWatson": 1.98,
      "residualAutocorrelation": [0.1, -0.05, ...]
    },
    "metrics": {
      "rmse": 2.45,
      "mae": 1.89,
      "aic": 245.67,
      "bic": 252.34
    },
    "additionalTests": {
      "normalityTest": {
        "skewness": 0.12,
        "kurtosis": 3.05
      },
      "stationarityTest": {
        "isStationary": true,
        "adfStatistic": -3.45
      },
      "autocorrelationTest": {
        "acf": [0.1, -0.05, ...],
        "significantLags": [
          { "lag": 1, "acf": 0.1, "significant": true }
        ]
      }
    },
    "dataPoints": 100,
    "analysisDate": "2024-01-15T10:30:00.000Z"
  }
}
```

### 5. Health Check

**Endpoint:** `GET /api/arima/health`

**Description:** Check service health status

**Response:**
```json
{
  "success": true,
  "service": "ARIMA Analysis Service",
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "details": ["Detailed error messages"],
  "message": "Additional error information"
}
```

Common error codes:
- `400`: Validation error or invalid parameters
- `500`: Internal server error

## Usage Examples

### JavaScript/Node.js

```javascript
// Basic ARIMA analysis
const response = await fetch('/api/arima/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: timeSeriesData,
    parameters: { p: 1, d: 1, q: 1 }
  })
});

const result = await response.json();
console.log('Forecast:', result.data.forecast);
```

### Python

```python
import requests

# Auto-detect parameters
response = requests.post('http://localhost:8000/api/arima/auto-detect', json={
    'data': time_series_data
})

optimal_params = response.json()['data']['optimalParameters']
print(f"Optimal parameters: {optimal_params}")
```

### cURL

```bash
# Perform ARIMA analysis
curl -X POST http://localhost:8000/api/arima/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "data": [{"timestamp": 1640995200000, "value": 100.5}],
    "parameters": {"p": 1, "d": 1, "q": 1}
  }'
```

## Technical Details

### Statistical Methods

1. **Parameter Estimation**:
   - AR parameters: Yule-Walker equations
   - MA parameters: Innovations algorithm
   - Maximum likelihood estimation for refinement

2. **Stationarity Testing**:
   - Augmented Dickey-Fuller test
   - Critical values for 1%, 5%, 10% significance levels

3. **Model Diagnostics**:
   - Ljung-Box test for residual autocorrelation
   - Jarque-Bera test for normality
   - Durbin-Watson test for serial correlation

4. **Forecasting**:
   - Recursive forecasting algorithm
   - Confidence interval calculation
   - Uncertainty propagation

### Performance Considerations

- Minimum data points: 10
- Maximum parameter orders: p,q ≤ 5, d ≤ 2
- Seasonal periods: 2-24
- Forecast periods: 1-60
- Memory usage: O(n²) for parameter estimation

### Dependencies

- `ml-matrix`: Matrix operations
- `simple-statistics`: Basic statistics
- `ml-array-autocorrelation`: Autocorrelation calculation
- `ml-array-mean`: Array mean calculation
- `ml-array-variance`: Array variance calculation

## Testing

Run the test suite:

```bash
node test-arima.js
```

This will test:
- Basic ARIMA analysis
- Seasonal ARIMA analysis
- Parameter auto-detection
- Model diagnostics
- Forecast generation
- Data validation
- API endpoints

## Troubleshooting

### Common Issues

1. **Insufficient data**: Ensure at least 10 data points
2. **Invalid parameters**: Check parameter ranges
3. **Non-stationary data**: Increase differencing order
4. **Seasonal patterns**: Enable seasonal components

### Performance Tips

1. Use appropriate parameter orders
2. Consider data preprocessing
3. Validate model assumptions
4. Monitor diagnostic statistics

## Version History

- **v1.0.0**: Initial release with basic ARIMA functionality
- Enhanced parameter estimation
- Comprehensive model diagnostics
- Seasonal ARIMA support
- Auto-detection capabilities 
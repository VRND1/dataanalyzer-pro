# Holt Exponential Smoothing Forecasting

This document describes the implementation of Holt's linear (additive) exponential smoothing for time series forecasting.

## Overview

Holt's method extends simple exponential smoothing to allow forecasting of data with a trend. It uses two smoothing parameters:
- **α (alpha)**: Controls the level smoothing
- **β (beta)**: Controls the trend smoothing

## Implementation

### Backend (Node.js/Express)

The backend implementation is located in:
- `backend-node/services/holtForecast.js` - Core forecasting logic
- `backend-node/routes/forecast.js` - API endpoint

#### API Endpoint

**POST** `/api/advanced/forecast/exponential`

**Request Body:**
```json
{
  "series": [100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320],
  "horizon": 12,
  "holdout": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "model": "Holt(add)",
    "alpha": 0.8,
    "beta": 0.2,
    "horizon": 12,
    "metrics": {
      "MAE": 5.23,
      "RMSE": 6.78,
      "MAPE": 2.45,
      "sMAPE": 2.12
    },
    "pointForecasts": [340, 360, 380, ...],
    "intervals": [
      {
        "lower": 326.44,
        "upper": 353.56,
        "point": 340
      }
    ],
    "fittedTrain": [100, 120, 140, ...]
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "request_id": "uuid"
}
```

### Frontend (TypeScript/React)

The frontend implementation is located in:
- `src/utils/analysis/timeSeries/predictor.ts` - Core forecasting logic
- `src/services/holtForecastService.ts` - API service
- `src/components/analysis/ExponentialSmoothingView.tsx` - React component

#### Local Computation

```typescript
import { bestHoltForecast } from './utils/analysis/timeSeries/predictor';

const series = [100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320];
const result = bestHoltForecast(series, 12);
console.log(result.pointForecasts);
```

#### API Call

```typescript
import { computeHoltForecast } from './services/holtForecastService';

const series = [100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320];
const result = await computeHoltForecast(series, 12);
console.log(result.pointForecasts);
```

#### React Component

```tsx
import ExponentialSmoothingView from './components/analysis/ExponentialSmoothingView';

function MyComponent() {
  const series = [100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320];
  
  return (
    <ExponentialSmoothingView 
      series={series} 
      horizon={12} 
      useAPI={false} // Set to true to use API
    />
  );
}
```

## Algorithm Details

### Model

The Holt model uses the following equations:

1. **Level**: `l_t = α * y_t + (1 - α) * (l_{t-1} + b_{t-1})`
2. **Trend**: `b_t = β * (l_t - l_{t-1}) + (1 - β) * b_{t-1}`
3. **Forecast**: `F_{t+h} = l_t + h * b_t`

Where:
- `y_t` is the actual value at time t
- `l_t` is the level at time t
- `b_t` is the trend at time t
- `F_{t+h}` is the forecast h periods ahead

### Parameter Optimization

The implementation uses grid search to find optimal α and β values:

- **α grid**: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
- **β grid**: [0.05, 0.1, 0.2, 0.3, 0.4]

The best parameters are selected based on minimizing RMSE on a holdout set.

### Confidence Intervals

Confidence intervals are calculated using:
- Standard deviation of residuals from the training set
- 95% confidence level (z = 1.96)
- Formula: `[forecast ± z * residual_std]`

## Usage Examples

### Basic Usage

```javascript
// Simple forecast
const series = [10, 12, 14, 16, 18, 20];
const forecast = bestHoltForecast(series, 3);
console.log(forecast.pointForecasts); // [22, 24, 26]
```

### With Holdout

```javascript
// Use last 3 points as holdout for validation
const series = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28];
const forecast = bestHoltForecast(series, 5, 3);
console.log(forecast.metrics); // Validation metrics
```

### API Usage

```bash
curl -X POST http://localhost:8000/api/advanced/forecast/exponential \
  -H "Content-Type: application/json" \
  -d '{
    "series": [100, 120, 140, 160, 180, 200],
    "horizon": 6
  }'
```

## Error Handling

The implementation includes comprehensive error handling:

- **Input validation**: Ensures series has at least 3 data points
- **Numeric validation**: Filters out non-finite values
- **API errors**: Proper HTTP status codes and error messages
- **React errors**: Loading states and error boundaries

## Performance Considerations

- **Grid search**: O(n * |α| * |β|) where n is series length
- **Memory usage**: O(n + horizon) for storing fitted values and forecasts
- **API calls**: Consider caching for repeated requests with same data

## Testing

Run the test file to verify the implementation:

```bash
cd backend-node
node src/utils/analysis/timeSeries/test-holt.js
```

## Dependencies

### Backend
- No external dependencies (pure JavaScript)

### Frontend
- React (for components)
- TypeScript (for type safety)

## Future Enhancements

Potential improvements:
- Add seasonal Holt-Winters method
- Implement automatic parameter selection using AIC/BIC
- Add support for multiplicative trends
- Include more forecast accuracy metrics
- Add visualization components for forecast plots

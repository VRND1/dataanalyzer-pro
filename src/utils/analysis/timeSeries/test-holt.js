// test-holt.js
// Simple test to verify Holt forecasting works

import { bestHoltForecast } from './holtForecast.js';

// Test data - monthly sales data
const testSeries = [100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320];

console.log('Testing Holt Exponential Smoothing...');
console.log('Input series:', testSeries);

try {
  const result = bestHoltForecast(testSeries, 6);
  
  console.log('\nResults:');
  console.log('Model:', result.model);
  console.log('Alpha:', result.alpha);
  console.log('Beta:', result.beta);
  console.log('Horizon:', result.horizon);
  console.log('Metrics:', result.metrics);
  console.log('Point Forecasts:', result.pointForecasts);
  console.log('Confidence Intervals:', result.intervals);
  
  console.log('\nForecast Summary:');
  result.pointForecasts.forEach((forecast, i) => {
    const interval = result.intervals[i];
    console.log(`Period ${i + 1}: ${forecast.toFixed(2)} [${interval.lower.toFixed(2)}, ${interval.upper.toFixed(2)}]`);
  });
  
  console.log('\nTest completed successfully!');
} catch (error) {
  console.error('Test failed:', error);
}

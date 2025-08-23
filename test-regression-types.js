// Test script to verify different regression types produce different results
const { performRegression } = require('./src/utils/analysis/regression/index.ts');

// Sample data
const sampleData = [
  {
    name: 'x',
    type: 'number',
    value: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  {
    name: 'y',
    type: 'number',
    value: [2.1, 3.8, 7.2, 13.5, 26.0, 38.0, 75.0, 140.0, 280.0, 550.0]
  }
];

// Test different regression types
const regressionTypes = [
  'linear',
  'polynomial',
  'ridge',
  'lasso',
  'elastic-net',
  'logistic',
  'quantile',
  'log-log'
];

console.log('Testing different regression types...\n');

regressionTypes.forEach(type => {
  try {
    const results = performRegression(sampleData, { type });
    const result = results[0];
    
    console.log(`${type.toUpperCase()} REGRESSION:`);
    console.log(`  R² Score: ${result.rSquared.toFixed(4)}`);
    console.log(`  Intercept: ${result.intercept.toFixed(4)}`);
    console.log(`  Coefficient: ${result.coefficients[0].toFixed(4)}`);
    console.log(`  Equation: ${result.equation}`);
    console.log(`  Type: ${result.type}`);
    console.log('');
  } catch (error) {
    console.log(`${type.toUpperCase()} REGRESSION: ERROR - ${error.message}\n`);
  }
});

console.log('Test completed!');

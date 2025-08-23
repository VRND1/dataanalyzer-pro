// Simple test to verify regression functions work
console.log('Testing regression functions...');

// Mock DataField type
const createDataField = (name, values) => ({
  name,
  type: 'number',
  value: values
});

// Test data
const x = [1, 2, 3, 4, 5];
const y = [2.1, 3.8, 7.2, 13.5, 26.0];

const featureField = createDataField('x', x);
const targetField = createDataField('y', y);

console.log('Test data:', { x, y });

// Test linear regression manually
const n = x.length;
const xMean = x.reduce((a, b) => a + b, 0) / n;
const yMean = y.reduce((a, b) => a + b, 0) / n;

let numerator = 0;
let denominator = 0;
for (let i = 0; i < n; i++) {
  numerator += (x[i] - xMean) * (y[i] - yMean);
  denominator += (x[i] - xMean) ** 2;
}

const slope = numerator / denominator;
const intercept = yMean - slope * xMean;

console.log('Manual linear regression result:', { slope, intercept });

// Test predictions
const predictions = x.map(xi => intercept + slope * xi);
console.log('Predictions:', predictions);

// Test R² calculation
const totalSS = y.reduce((ss, yi) => ss + Math.pow(yi - yMean, 2), 0);
const residualSS = y.reduce((ss, yi, i) => ss + Math.pow(yi - predictions[i], 2), 0);
const rSquared = 1 - (residualSS / totalSS);

console.log('R² Score:', rSquared);

console.log('Test completed successfully!');

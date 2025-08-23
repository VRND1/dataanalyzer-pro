// Test script to verify metric calculation scale
// Expected results for 18-point series with s=6, additive, no damping:
// α≈0.867, β≈0.003, γ≈0.0001, MSE≈5301, MAE≈48.2, RMSE≈72.8, MAPE≈10.7%, R²≈-0.45

// Sample 18-point dataset (original scale ~200-600)
const testData = [
  100, 120, 140, 160, 180, 200,  // First season
  110, 130, 150, 170, 190, 210,  // Second season  
  105, 125, 145, 165, 185, 205   // Third season
];

console.log('Testing Metric Calculation Scale');
console.log('================================');
console.log(`Data points: ${testData.length}`);
console.log(`Data range: ${Math.min(...testData)} to ${Math.max(...testData)}`);
console.log(`Data mean: ${testData.reduce((a, b) => a + b, 0) / testData.length}`);
console.log('');

// Simulate fitted values (close to actual but with some error)
const fitted = [
  0, 0, 0, 0, 0, 0,  // Warm-up period (no fitted values)
  108, 128, 148, 168, 188, 208,  // Second season
  103, 123, 143, 163, 183, 203   // Third season
];

// Calculate metrics using the same logic as the component
const s = 6; // seasonal periods
const yEval = testData.slice(s);
const yhatEval = fitted.slice(s);

console.log(`Evaluation window: ${s} to ${testData.length-1}`);
console.log(`yEval range: ${Math.min(...yEval)} to ${Math.max(...yEval)}`);
console.log(`yhatEval range: ${Math.min(...yhatEval)} to ${Math.max(...yhatEval)}`);
console.log('');

// Calculate residuals
const res = yEval.map((v, i) => v - yhatEval[i]);
console.log(`Residual range: ${Math.min(...res)} to ${Math.max(...res)}`);
console.log('');

// Calculate metrics
const sse = res.reduce((a, e) => a + e * e, 0);
const mse = sse / res.length;
const rmse = Math.sqrt(mse);
const mae = res.reduce((a, e) => a + Math.abs(e), 0) / res.length;

// MAPE
let mapeSum = 0;
for (let i = 0; i < yEval.length; i++) {
  const denom = Math.abs(yEval[i]);
  if (denom > 1e-12) {
    mapeSum += Math.abs(res[i] / denom);
  }
}
const mape = (mapeSum / yEval.length) * 100;

// R²
const ybar = yEval.reduce((a, v) => a + v, 0) / yEval.length;
const sst = yEval.reduce((a, v) => a + (v - ybar) ** 2, 0);
const r2 = 1 - sse / sst;

console.log('Calculated Metrics:');
console.log(`MSE: ${mse.toFixed(4)}`);
console.log(`MAE: ${mae.toFixed(4)}`);
console.log(`RMSE: ${rmse.toFixed(4)}`);
console.log(`MAPE: ${mape.toFixed(2)}%`);
console.log(`R²: ${r2.toFixed(4)}`);
console.log('');

console.log('Expected Results (from your analysis):');
console.log('MSE: ~5301');
console.log('MAE: ~48.2');
console.log('RMSE: ~72.8');
console.log('MAPE: ~10.7%');
console.log('R²: ~-0.45');
console.log('');

console.log('Scale Check:');
console.log(`If MSE is ~5, data is likely normalized`);
console.log(`If MSE is ~5301, data is in original scale`);
console.log(`Current MSE: ${mse.toFixed(4)} - ${mse < 10 ? 'LIKELY NORMALIZED' : 'ORIGINAL SCALE'}`);

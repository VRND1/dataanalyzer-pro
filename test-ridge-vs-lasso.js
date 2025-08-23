// Test script to demonstrate Ridge vs Lasso differences
console.log('Testing Ridge vs Lasso Regression Differences...');

// Mock DataField type
const createDataField = (name, values) => ({
  name,
  type: 'number',
  value: values
});

// Test data with some noise
const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const y = [2.1, 3.8, 7.2, 13.5, 26.0, 45.2, 78.1, 120.5, 180.2, 250.0];

const featureField = createDataField('x', x);
const targetField = createDataField('y', y);

console.log('Test data:', { x, y });

// Test different alpha values
const alphaValues = [0.01, 0.1, 0.5, 1.0, 2.0];

console.log('\n=== Testing with different alpha values ===');

alphaValues.forEach(alpha => {
  console.log(`\nAlpha = ${alpha}:`);
  
  // Test Ridge
  try {
    const ridgeResult = calculateRidgeRegression(targetField, featureField, alpha);
    console.log(`  Ridge: β₁ = ${ridgeResult.coefficients[0].toFixed(4)}, R² = ${ridgeResult.rSquared.toFixed(4)}`);
  } catch (error) {
    console.log(`  Ridge failed: ${error.message}`);
  }
  
  // Test Lasso
  try {
    const lassoResult = calculateLassoRegression(targetField, featureField, alpha);
    console.log(`  Lasso: β₁ = ${lassoResult.coefficients[0].toFixed(4)}, R² = ${lassoResult.rSquared.toFixed(4)}`);
  } catch (error) {
    console.log(`  Lasso failed: ${error.message}`);
  }
});

// Test with standardized data to see the effect
console.log('\n=== Testing with standardized data ===');

// Manual standardization
const xMean = x.reduce((a, b) => a + b, 0) / x.length;
const yMean = y.reduce((a, b) => a + b, 0) / y.length;
const xStd = Math.sqrt(x.reduce((acc, xi) => acc + Math.pow(xi - xMean, 2), 0) / x.length);
const yStd = Math.sqrt(y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0) / y.length);

const xStdData = x.map(xi => (xi - xMean) / xStd);
const yStdData = y.map(yi => (yi - yMean) / yStd);

const featureFieldStd = createDataField('x_std', xStdData);
const targetFieldStd = createDataField('y_std', yStdData);

console.log('Standardized data stats:', {
  xMean: xMean.toFixed(3),
  yMean: yMean.toFixed(3),
  xStd: xStd.toFixed(3),
  yStd: yStd.toFixed(3)
});

alphaValues.forEach(alpha => {
  console.log(`\nAlpha = ${alpha} (standardized):`);
  
  try {
    const ridgeResult = calculateRidgeRegression(targetFieldStd, featureFieldStd, alpha);
    console.log(`  Ridge: β₁ = ${ridgeResult.coefficients[0].toFixed(4)}, R² = ${ridgeResult.rSquared.toFixed(4)}`);
  } catch (error) {
    console.log(`  Ridge failed: ${error.message}`);
  }
  
  try {
    const lassoResult = calculateLassoRegression(targetFieldStd, featureFieldStd, alpha);
    console.log(`  Lasso: β₁ = ${lassoResult.coefficients[0].toFixed(4)}, R² = ${lassoResult.rSquared.toFixed(4)}`);
  } catch (error) {
    console.log(`  Lasso failed: ${error.message}`);
  }
});

console.log('\n=== Key Differences ===');
console.log('1. Ridge (L2): Shrinks coefficients toward zero but never exactly to zero');
console.log('2. Lasso (L1): Can set coefficients exactly to zero (feature selection)');
console.log('3. With small alpha: Both methods are similar to OLS');
console.log('4. With large alpha: Ridge shrinks more, Lasso can zero out coefficients');
console.log('5. Standardized data shows the regularization effect more clearly');

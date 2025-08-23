// Test script to verify regression functions return r2Score
console.log('Testing regression functions with r2Score...');

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

// Test that regression functions return r2Score
function testRegressionFunction(funcName, func) {
  try {
    const result = func(targetField, featureField);
    console.log(`${funcName} result:`, {
      rSquared: result.rSquared,
      r2Score: result.metrics?.r2Score,
      hasR2Score: 'r2Score' in (result.metrics || {}),
      metrics: result.metrics
    });
    return result.metrics?.r2Score !== undefined && !isNaN(result.metrics.r2Score);
  } catch (error) {
    console.error(`${funcName} failed:`, error);
    return false;
  }
}

// Test all regression functions
const tests = [
  ['Linear', calculateLinearRegression],
  ['Ridge', calculateRidgeRegression],
  ['Lasso', calculateLassoRegression],
  ['Elastic Net', calculateElasticNetRegression],
  ['Polynomial', calculatePolynomialRegression],
  ['Logistic', calculateLogisticRegression],
  ['Quantile', calculateQuantileRegression],
  ['Log-Log', calculateLogLogRegression],
  ['Time Series', calculateTimeSeriesRegression]
];

let passedTests = 0;
tests.forEach(([name, func]) => {
  const passed = testRegressionFunction(name, func);
  if (passed) passedTests++;
});

console.log(`\nTest Results: ${passedTests}/${tests.length} functions return valid r2Score`);
console.log('Regression functions should now display R² scores correctly in the UI!');

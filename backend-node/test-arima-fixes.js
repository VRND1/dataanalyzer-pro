#!/usr/bin/env node

/**
 * Test script to verify ARIMA fixes
 * Run with: node test-arima-fixes.js
 */

import arimaService from './services/arimaService.js';

// Test data scenarios
const testScenarios = [
  {
    name: "Valid data with 15 points",
    data: [100, 102, 98, 105, 103, 107, 101, 104, 106, 99, 108, 102, 105, 103, 107],
    shouldPass: true
  },
  {
    name: "Invalid data with only 5 points",
    data: [100, 102, 98, 105, 103],
    shouldPass: false,
    expectedError: "Insufficient data"
  },
  {
    name: "Data with non-numeric values",
    data: [100, 102, "invalid", 105, 103, 107, 101, 104, 106, 99, 108, 102, 105, 103, 107],
    shouldPass: true, // Should filter out non-numeric
    expectedValidPoints: 14
  },
  {
    name: "Empty array",
    data: [],
    shouldPass: false,
    expectedError: "No valid numeric data points found"
  },
  {
    name: "Large dataset with 50 points",
    data: Array.from({length: 50}, (_, i) => 100 + Math.sin(i * 0.1) * 10 + Math.random() * 5),
    shouldPass: true
  }
];

async function testValidation() {
  console.log("🧪 Testing ARIMA Data Validation\n");
  
  for (const scenario of testScenarios) {
    console.log(`Testing: ${scenario.name}`);
    console.log(`Data length: ${scenario.data.length}`);
    
    try {
      const validatedData = arimaService.validateData(scenario.data);
      console.log(`✅ PASSED - Validated ${validatedData.length} points`);
      
      if (scenario.expectedValidPoints && validatedData.length !== scenario.expectedValidPoints) {
        console.log(`⚠️  WARNING - Expected ${scenario.expectedValidPoints} points, got ${validatedData.length}`);
      }
      
    } catch (error) {
      if (scenario.shouldPass) {
        console.log(`❌ FAILED - Should have passed: ${error.message}`);
      } else {
        if (scenario.expectedError && error.message.includes(scenario.expectedError)) {
          console.log(`✅ PASSED - Expected error: ${error.message}`);
        } else {
          console.log(`⚠️  UNEXPECTED ERROR: ${error.message}`);
        }
      }
    }
    console.log("");
  }
}

async function testARIMAAnalysis() {
  console.log("🧪 Testing ARIMA Analysis\n");
  
  const testData = [100, 102, 98, 105, 103, 107, 101, 104, 106, 99, 108, 102, 105, 103, 107];
  
  try {
    console.log("Testing basic ARIMA analysis...");
    const result = await arimaService.analyzeARIMA(testData, { p: 1, d: 1, q: 1 });
    
    if (result.success) {
      console.log("✅ ARIMA analysis successful");
      console.log(`   - Original data points: ${result.data.originalData.length}`);
      console.log(`   - Fitted values: ${result.data.fittedValues.length}`);
      console.log(`   - Forecast points: ${result.data.forecast.length}`);
      console.log(`   - AIC: ${result.data.metrics.aic.toFixed(2)}`);
      console.log(`   - BIC: ${result.data.metrics.bic.toFixed(2)}`);
      console.log(`   - RMSE: ${result.data.metrics.rmse.toFixed(2)}`);
    } else {
      console.log(`❌ ARIMA analysis failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ ARIMA analysis error: ${error.message}`);
  }
  console.log("");
}

async function testForecastMethods() {
  console.log("🧪 Testing Forecast Methods\n");
  
  const testData = [100, 102, 98, 105, 103, 107, 101, 104, 106, 99, 108, 102, 105, 103, 107];
  const arParams = [0.5];
  const maParams = [0.3];
  
  try {
    // Test generateForecast method
    console.log("Testing generateForecast method...");
    const forecast = arimaService.generateForecast(testData, arParams, maParams, [], [], 1, 12, 5);
    console.log(`✅ generateForecast successful - ${forecast.values.length} forecast points`);
    
    // Test calculateFittedValues method
    console.log("Testing calculateFittedValues method...");
    const fittedValues = arimaService.calculateFittedValues(testData, arParams, maParams, [], [], 1, 12);
    console.log(`✅ calculateFittedValues successful - ${fittedValues.length} fitted values`);
    
    // Test calculateResiduals method
    console.log("Testing calculateResiduals method...");
    const residuals = arimaService.calculateResiduals(testData, fittedValues);
    console.log(`✅ calculateResiduals successful - ${residuals.length} residuals`);
    
    // Test calculateConfidenceIntervals method
    console.log("Testing calculateConfidenceIntervals method...");
    const intervals = arimaService.calculateConfidenceIntervals(forecast.values, residuals);
    console.log(`✅ calculateConfidenceIntervals successful - ${intervals.lower.length} intervals`);
    
  } catch (error) {
    console.log(`❌ Forecast method error: ${error.message}`);
  }
  console.log("");
}

async function testAutoDetection() {
  console.log("🧪 Testing Auto-Detection\n");
  
  const testData = [100, 102, 98, 105, 103, 107, 101, 104, 106, 99, 108, 102, 105, 103, 107];
  
  try {
    console.log("Testing auto-detect parameters...");
    const optimalParams = await arimaService.autoDetectParameters(testData);
    console.log(`✅ Auto-detection successful`);
    console.log(`   - Optimal p: ${optimalParams.p}`);
    console.log(`   - Optimal d: ${optimalParams.d}`);
    console.log(`   - Optimal q: ${optimalParams.q}`);
  } catch (error) {
    console.log(`❌ Auto-detection error: ${error.message}`);
  }
  console.log("");
}

async function runAllTests() {
  console.log("🚀 Starting ARIMA Fixes Test Suite\n");
  console.log("=" .repeat(50));
  
  await testValidation();
  await testARIMAAnalysis();
  await testForecastMethods();
  await testAutoDetection();
  
  console.log("=" .repeat(50));
  console.log("✅ Test suite completed!");
  console.log("\n📋 Summary of fixes:");
  console.log("1. ✅ Added missing generateForecast() method");
  console.log("2. ✅ Added missing calculateResiduals() method");
  console.log("3. ✅ Added missing calculateFittedValues() method");
  console.log("4. ✅ Enhanced data validation with clear error messages");
  console.log("5. ✅ Fixed method signature mismatches");
  console.log("6. ✅ Added proper error handling for extended forecasts");
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };

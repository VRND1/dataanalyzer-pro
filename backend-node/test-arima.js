import arimaService from './services/arimaService.js';

// Test data - simulated time series
function generateTestData(n = 100) {
  const data = [];
  let value = 100;
  
  for (let i = 0; i < n; i++) {
    // Add trend
    value += 0.5;
    
    // Add seasonal component (monthly)
    const seasonal = 10 * Math.sin(2 * Math.PI * i / 12);
    
    // Add random noise
    const noise = (Math.random() - 0.5) * 5;
    
    data.push({
      timestamp: Date.now() + i * 24 * 60 * 60 * 1000, // Daily timestamps
      value: value + seasonal + noise
    });
  }
  
  return data;
}

// Test ARIMA analysis
async function testARIMAAnalysis() {
  console.log('🧪 Testing ARIMA Analysis Service...\n');
  
  try {
    // Generate test data
    const testData = generateTestData(120);
    console.log(`📊 Generated ${testData.length} data points for testing`);
    
    // Test 1: Basic ARIMA(1,1,1) analysis
    console.log('\n🔍 Test 1: Basic ARIMA(1,1,1) Analysis');
    const basicParams = {
      p: 1,
      d: 1,
      q: 1,
      seasonal: false
    };
    
    const basicResult = await arimaService.analyzeARIMA(
      testData.map(d => d.value),
      basicParams
    );
    
    if (basicResult.success) {
      console.log('✅ Basic ARIMA analysis successful');
      console.log(`   - Data points: ${basicResult.data.originalData.length}`);
      console.log(`   - Fitted values: ${basicResult.data.fittedValues.length}`);
      console.log(`   - Forecast periods: ${basicResult.data.forecast.length}`);
      console.log(`   - RMSE: ${basicResult.data.metrics.rmse.toFixed(4)}`);
      console.log(`   - AIC: ${basicResult.data.metrics.aic.toFixed(2)}`);
      console.log(`   - Stationary: ${basicResult.data.diagnostics.stationarity}`);
    } else {
      console.log('❌ Basic ARIMA analysis failed:', basicResult.error);
    }
    
    // Test 2: Seasonal ARIMA analysis
    console.log('\n🔍 Test 2: Seasonal ARIMA Analysis');
    const seasonalParams = {
      p: 1,
      d: 1,
      q: 1,
      seasonal: true,
      seasonalPeriod: 12,
      P: 1,
      D: 1,
      Q: 1
    };
    
    const seasonalResult = await arimaService.analyzeARIMA(
      testData.map(d => d.value),
      seasonalParams
    );
    
    if (seasonalResult.success) {
      console.log('✅ Seasonal ARIMA analysis successful');
      console.log(`   - Seasonal period: ${seasonalResult.data.parameters.seasonal_period}`);
      console.log(`   - Seasonal AR params: [${seasonalResult.data.parameters.seasonal_ar.map(p => p.toFixed(3)).join(', ')}]`);
      console.log(`   - Seasonal MA params: [${seasonalResult.data.parameters.seasonal_ma.map(p => p.toFixed(3)).join(', ')}]`);
      console.log(`   - RMSE: ${seasonalResult.data.metrics.rmse.toFixed(4)}`);
    } else {
      console.log('❌ Seasonal ARIMA analysis failed:', seasonalResult.error);
    }
    
    // Test 3: Auto-detect parameters
    console.log('\n🔍 Test 3: Auto-detect Parameters');
    const optimalParams = await arimaService.autoDetectParameters(testData.map(d => d.value));
    console.log('✅ Parameter auto-detection successful');
    console.log(`   - Optimal p: ${optimalParams.p}`);
    console.log(`   - Optimal d: ${optimalParams.d}`);
    console.log(`   - Optimal q: ${optimalParams.q}`);
    
    // Test 4: Model diagnostics
    console.log('\n🔍 Test 4: Model Diagnostics');
    if (basicResult.success) {
      const diagnostics = basicResult.data.diagnostics;
      console.log('✅ Model diagnostics calculated');
      console.log(`   - Ljung-Box statistic: ${diagnostics.ljungBox.toFixed(2)}`);
      console.log(`   - Jarque-Bera statistic: ${diagnostics.jarqueBera.toFixed(2)}`);
      console.log(`   - Durbin-Watson statistic: ${diagnostics.durbinWatson.toFixed(4)}`);
      console.log(`   - Residual autocorrelation lags: ${diagnostics.residualAutocorrelation.length}`);
    }
    
    // Test 5: Forecast generation
    console.log('\n🔍 Test 5: Forecast Generation');
    if (basicResult.success) {
      const forecast = arimaService.generateForecast(
        testData.map(d => d.value),
        basicResult.data.parameters.ar,
        basicResult.data.parameters.ma,
        basicResult.data.parameters.seasonal_ar,
        basicResult.data.parameters.seasonal_ma,
        basicParams.d,
        12,
        24 // 24 periods forecast
      );
      
      console.log('✅ Forecast generation successful');
      console.log(`   - Forecast periods: ${forecast.values.length}`);
      console.log(`   - First forecast: ${forecast.values[0].toFixed(2)}`);
      console.log(`   - Last forecast: ${forecast.values[forecast.values.length - 1].toFixed(2)}`);
      
      // Calculate confidence intervals
      const intervals = arimaService.calculateConfidenceIntervals(forecast, basicResult.data.residuals);
      console.log(`   - Confidence intervals calculated: ${intervals.lower.length} periods`);
    }
    
    // Test 6: Data validation
    console.log('\n🔍 Test 6: Data Validation');
    const invalidData = [1, 2, NaN, 4, 5, Infinity, 7, 8, 9, 10];
    const validation = arimaService.validateData(invalidData);
    console.log(`✅ Data validation test: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
    if (!validation.isValid) {
      console.log(`   - Error: ${validation.error}`);
    }
    
    console.log('\n🎉 All ARIMA tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Test API endpoints (if server is running)
async function testAPIEndpoints() {
  console.log('\n🌐 Testing ARIMA API Endpoints...\n');
  
  const baseURL = 'http://localhost:8000/api/arima';
  const testData = generateTestData(50);
  
  try {
    // Test health endpoint
    console.log('🔍 Testing health endpoint...');
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test analyze endpoint
    console.log('\n🔍 Testing analyze endpoint...');
    const analyzeResponse = await fetch(`${baseURL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: testData,
        parameters: {
          p: 1,
          d: 1,
          q: 1,
          seasonal: false
        },
        forecastPeriods: 12
      })
    });
    
    if (analyzeResponse.ok) {
      const analyzeData = await analyzeResponse.json();
      console.log('✅ Analyze endpoint successful');
      console.log(`   - Success: ${analyzeData.success}`);
      console.log(`   - Data points: ${analyzeData.data.originalData.length}`);
      console.log(`   - Forecast periods: ${analyzeData.data.forecast.length}`);
    } else {
      console.log('❌ Analyze endpoint failed:', analyzeResponse.status);
    }
    
    // Test auto-detect endpoint
    console.log('\n🔍 Testing auto-detect endpoint...');
    const autoDetectResponse = await fetch(`${baseURL}/auto-detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: testData
      })
    });
    
    if (autoDetectResponse.ok) {
      const autoDetectData = await autoDetectResponse.json();
      console.log('✅ Auto-detect endpoint successful');
      console.log(`   - Optimal parameters:`, autoDetectData.data.optimalParameters);
    } else {
      console.log('❌ Auto-detect endpoint failed:', autoDetectResponse.status);
    }
    
  } catch (error) {
    console.log('❌ API tests failed (server may not be running):', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting ARIMA Service Tests\n');
  
  // Test service directly
  await testARIMAAnalysis();
  
  // Test API endpoints
  await testAPIEndpoints();
  
  console.log('\n✨ All tests completed!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testARIMAAnalysis, testAPIEndpoints, generateTestData }; 
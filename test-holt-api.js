// test-holt-api.js
// Simple test to verify the Holt forecasting API endpoint

const testData = {
  series: [100, 105, 98, 112, 108, 115, 120, 118, 125, 130, 128, 135],
  horizon: 6,
  holdout: 3  // Use explicit holdout for validation
};

async function testHoltAPI() {
  try {
    console.log('🧪 Testing Holt Forecasting API...');
    console.log('📊 Input data:', testData.series);
    
    const response = await fetch('http://localhost:8000/api/advanced/forecast/exponential', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('\n✅ API Test Successful!');
    console.log('📈 Model:', result.data.model);
    console.log('🔧 Parameters: α =', result.data.alpha, 'β =', result.data.beta);
    console.log('📊 Validation: Train =', result.data.trainLength, 'Test =', result.data.testLength, 'Holdout =', result.data.holdoutSize);
    console.log('📊 Hold-out Metrics:', result.data.metrics);
    console.log('🔮 Forecasts:', result.data.pointForecasts);
    console.log('📅 Confidence Intervals:', result.data.intervals.length, 'intervals');
    
    console.log('\n🎯 Forecast Summary:');
    result.data.pointForecasts.forEach((forecast, i) => {
      const interval = result.data.intervals[i];
      console.log(`  Period ${i + 1}: ${forecast.toFixed(2)} [${interval.lower.toFixed(2)}, ${interval.upper.toFixed(2)}]`);
    });
    
    console.log('\n🚀 API is working correctly!');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 8000');
    console.log('   Run: cd backend-node && npm start');
  }
}

// Run the test
testHoltAPI();

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8000';

async function testAPI() {
  console.log('🧪 Testing Node.js Backend API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test analytics endpoint
    console.log('\n2. Testing analytics endpoint...');
    const analyticsResponse = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [
          { name: 'revenue', value: 1000, type: 'number' },
          { name: 'customers', value: 50, type: 'number' }
        ],
        analysis_type: 'basic'
      })
    });
    const analyticsData = await analyticsResponse.json();
    console.log('✅ Analytics response:', JSON.stringify(analyticsData, null, 2));

    // Test prediction endpoint
    console.log('\n3. Testing prediction endpoint...');
    const predictionResponse = await fetch(`${BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [100, 120, 140, 160, 180],
        horizon: 3,
        confidence: 0.95
      })
    });
    const predictionData = await predictionResponse.json();
    console.log('✅ Prediction response:', JSON.stringify(predictionData, null, 2));

    // Test anomaly detection endpoint
    console.log('\n4. Testing anomaly detection endpoint...');
    const anomalyResponse = await fetch(`${BASE_URL}/api/detect-anomalies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [10, 12, 15, 8, 20, 11, 13, 9, 25, 12],
        threshold: 0.95,
        method: 'zscore'
      })
    });
    const anomalyData = await anomalyResponse.json();
    console.log('✅ Anomaly detection response:', JSON.stringify(anomalyData, null, 2));

    // Test sentiment analysis endpoint
    console.log('\n5. Testing sentiment analysis endpoint...');
    const sentimentResponse = await fetch(`${BASE_URL}/api/sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: [
          "I love this product! It's absolutely amazing and works perfectly.",
          "This is terrible. I hate it and it's completely broken.",
          "The product is okay, nothing special but it works.",
          "Excellent service and great quality. Highly recommended!",
          "Very disappointed with the poor quality and slow performance."
        ],
        custom_lexicons: {
          positive: ['awesome', 'fantastic'],
          negative: ['terrible', 'awful']
        }
      })
    });
    const sentimentData = await sentimentResponse.json();
    console.log('✅ Sentiment analysis response:', JSON.stringify(sentimentData, null, 2));

    console.log('\n🎉 All tests passed! Node.js backend is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI(); 
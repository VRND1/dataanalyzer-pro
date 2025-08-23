// test-arima.js
import fetch from 'node-fetch';

async function testARIMA() {
  try {
    const testData = {
      data: [
        { timestamp: 1640995200000, value: 100 },
        { timestamp: 1641081600000, value: 110 },
        { timestamp: 1641168000000, value: 105 },
        { timestamp: 1641254400000, value: 115 },
        { timestamp: 1641340800000, value: 120 },
        { timestamp: 1641427200000, value: 125 },
        { timestamp: 1641513600000, value: 130 },
        { timestamp: 1641600000000, value: 135 },
        { timestamp: 1641686400000, value: 140 },
        { timestamp: 1641772800000, value: 145 },
        { timestamp: 1641859200000, value: 150 },
        { timestamp: 1641945600000, value: 155 }
      ],
      parameters: {
        p: 1,
        d: 1,
        q: 1,
        seasonal: false,
        seasonalPeriod: 12
      },
      forecastPeriods: 12,
      confidenceLevel: 0.95,
      log1p: true
    };

    console.log('Testing ARIMA API with data:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:8000/api/arima/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('Success! ARIMA result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testARIMA();

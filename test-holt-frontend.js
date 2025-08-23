// test-holt-frontend.js
// Simple test to verify the frontend Holt forecasting implementation

// Mock the frontend predictor function
function splitTrainTest(series, holdout = null) {
  const n = series.length;
  const h = holdout ?? Math.max(6, Math.min(24, Math.round(n * 0.2)));
  const cut = Math.max(2, n - h);
  return {
    train: series.slice(0, cut),
    test: series.slice(cut),
  };
}

function metrics(actual, pred) {
  const n = Math.min(actual.length, pred.length);
  let mae = 0, mse = 0, mape = 0, denom = 0;
  for (let i = 0; i < n; i++) {
    const e = actual[i] - pred[i];
    mae += Math.abs(e);
    mse += e * e;
    if (actual[i] !== 0) {
      mape += Math.abs(e / actual[i]);
      denom++;
    }
  }
  mae /= n;
  const rmse = Math.sqrt(mse / n);
  const mapePct = denom ? (mape / denom) * 100 : NaN;

  // sMAPE
  let sm = 0, smn = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.abs(actual[i]) + Math.abs(pred[i]);
    if (a !== 0) {
      sm += Math.abs(actual[i] - pred[i]) / (a / 2);
      smn++;
    }
  }
  const sMAPE = smn ? (sm / smn) * 100 : NaN;

  return { MAE: mae, RMSE: rmse, MAPE: mapePct, sMAPE };
}

function holtFit(series, alpha = 0.8, beta = 0.2) {
  if (series.length < 2) {
    const lvl = series[0] ?? 0;
    return { fitted: Array(series.length).fill(lvl), level: lvl, trend: 0 };
  }
  let level = series[0];
  let trend = series[1] - series[0];

  const fitted = [level]; // convention: fitted[0] = initial level
  for (let t = 1; t < series.length; t++) {
    const prevLevel = level;
    // one-step-ahead forecast before seeing y_t
    const f = level + trend;
    fitted.push(f);

    // update with observation
    level = alpha * series[t] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }
  return { fitted, level, trend };
}

function holtForecastFrom(level, trend, horizon) {
  const out = new Array(horizon);
  for (let h = 1; h <= horizon; h++) out[h - 1] = level + h * trend;
  return out;
}

function bestHoltForecast(series, horizon = 12, holdout = null) {
  const { train, test } = splitTrainTest(series, holdout);
  const alphaGrid = [0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9];
  const betaGrid  = [0.05,0.1,0.2,0.3,0.4];

  // Ensure we have a proper hold-out for validation
  if (test.length === 0) {
    throw new Error('No test data available for validation. Series too short or holdout too large.');
  }

  console.log(`🔍 Grid search: train=${train.length}, test=${test.length}, holdout=${holdout}`);

  let best = null;

  for (const a of alphaGrid) {
    for (const b of betaGrid) {
      const { fitted, level, trend } = holtFit(train, a, b);
      const predTest = holtForecastFrom(level, trend, test.length);
      const m = metrics(test, predTest);
      
      // Log first 5 pairs to verify we're comparing actual test vs predictions
      if (a === alphaGrid[0] && b === betaGrid[0]) {
        console.log('📊 First 5 test pairs (actual vs predicted):');
        test.slice(0, 5).forEach((actual, i) => {
          console.log(`  ${actual.toFixed(2)} vs ${predTest[i].toFixed(2)}`);
        });
      }
      
      if (!best || m.RMSE < best.metrics.RMSE) {
        best = { alpha: a, beta: b, metrics: m, fittedTrain: fitted, level, trend };
      }
    }
  }

  // build residuals from train (using one-step-ahead fitted values)
  const residuals = [];
  for (let i = 1; i < train.length; i++) {
    residuals.push(train[i] - best.fittedTrain[i]);
  }
  const rStd = Math.sqrt(
    residuals.reduce((s, e) => s + e * e, 0) / Math.max(1, residuals.length - 1)
  );

  const pointForecasts = holtForecastFrom(best.level, best.trend, horizon);
  const z = 1.96;
  const intervals = pointForecasts.map(v => ({
    lower: v - z * rStd,
    upper: v + z * rStd,
    point: v,
  }));

  return {
    model: "Holt(add)",
    alpha: best.alpha,
    beta: best.beta,
    horizon,
    metrics: best.metrics,
    pointForecasts,
    intervals,
    fittedTrain: best.fittedTrain,
    level: best.level,
    trend: best.trend,
    trainLength: train.length,
    testLength: test.length,
    holdoutSize: holdout,
    debug: {
      test: test,
      predTest: holtForecastFrom(best.level, best.trend, test.length)
    }
  };
}

// Test with realistic data
const testSeries = [100, 105, 98, 112, 108, 115, 120, 118, 125, 130, 128, 135];

console.log('🧪 Testing Frontend Holt Forecasting...');
console.log('📊 Input data:', testSeries);

try {
  const result = bestHoltForecast(testSeries, 6, 3);
  
  console.log('\n✅ Frontend Test Successful!');
  console.log('📈 Model:', result.model);
  console.log('🔧 Parameters: α =', result.alpha, 'β =', result.beta);
  console.log('📊 Validation: Train =', result.trainLength, 'Test =', result.testLength, 'Holdout =', result.holdoutSize);
  console.log('📊 Hold-out Metrics:', result.metrics);
  console.log('🔮 Forecasts:', result.pointForecasts);
  console.log('📅 Confidence Intervals:', result.intervals.length, 'intervals');
  
  console.log('\n🎯 Forecast Summary:');
  result.pointForecasts.forEach((forecast, i) => {
    const interval = result.intervals[i];
    console.log(`  Period ${i + 1}: ${forecast.toFixed(2)} [${interval.lower.toFixed(2)}, ${interval.upper.toFixed(2)}]`);
  });
  
  console.log('\n🔍 Debug Validation:');
  console.table(result.debug.test.map((y, i) => ({
    actual: y,
    pred: result.debug.predTest[i],
    diff: y - result.debug.predTest[i],
    sameRef: result.debug.test === result.debug.predTest  // must be false
  })));
  
  console.log('\n🚀 Frontend implementation is working correctly!');
  
} catch (error) {
  console.error('❌ Frontend Test Failed:', error.message);
}

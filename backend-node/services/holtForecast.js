// services/holtForecast.js
// Lightweight Holt forecasting service

function zFor(confidence = 0.95) {
  // 90%≈1.645, 95%≈1.96, 99%≈2.576
  if (confidence >= 0.995) return 2.807;  // optional finer steps
  if (confidence >= 0.99)  return 2.576;
  if (confidence >= 0.95)  return 1.96;
  if (confidence >= 0.90)  return 1.645;
  return 1.96; // default to 95%
}

function splitTrainTest(series, holdout = null) {
  const n = series.length;
  const h = holdout ?? Math.max(6, Math.min(24, Math.round(n * 0.2)));
  const cut = Math.max(2, n - h);
  return { train: series.slice(0, cut), test: series.slice(cut) };
}

function metrics(actual, pred) {
  const EPS = 1e-9;
  const n = Math.min(actual.length, pred.length);
  let mae = 0, mse = 0, mape = 0, denom = 0;

  for (let i = 0; i < n; i++) {
    const e = actual[i] - pred[i];
    mae += Math.abs(e);
    mse += e * e;
    if (Math.abs(actual[i]) > EPS) { mape += Math.abs(e / actual[i]); denom++; }
  }
  mae /= n;
  const rmse = Math.sqrt(mse / n);
  const mapePct = denom ? (mape / denom) * 100 : null;

  // sMAPE
  let sm = 0, smn = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.abs(actual[i]) + Math.abs(pred[i]);
    if (a > EPS) { sm += Math.abs(actual[i] - pred[i]) / (a / 2); smn++; }
  }
  const sMAPE = smn ? (sm / smn) * 100 : null;

  return { MAE: mae, RMSE: rmse, MAPE: mapePct, sMAPE };
}

function holtFit(series, alpha = 0.8, beta = 0.2, phi = 1.0) {
  if (series.length < 2) {
    const lvl = series[0] || 0;
    return { fitted: Array(series.length).fill(lvl), level: lvl, trend: 0 };
  }

  let level = series[0];
  let trend = series[1] - series[0];

  const fitted = [level]; // convention: first fitted equals initial level
  for (let t = 1; t < series.length; t++) {
    const prevLevel = level;
    const f = level + trend;   // one-step-ahead before seeing y_t
    fitted.push(f);

    // updates
    level = alpha * series[t] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }
  return { fitted, level, trend };
}

function holtForecastFrom(level, trend, horizon, phi = 1.0) {
  const out = new Array(horizon);
  for (let h = 1; h <= horizon; h++) {
    if (phi === 1.0) {
      out[h - 1] = level + h * trend;
    } else {
      // Damped trend: level + ((1 - phi^h)/(1 - phi)) * trend
      const sumDamped = (1 - Math.pow(phi, h)) / (1 - phi);
      out[h - 1] = level + sumDamped * trend;
    }
  }
  return out;
}

function gridSearchHolt(series, horizon, alphaGrid, betaGrid, holdout = null, confidence = 0.95, phi = 1.0) {
  const { train, test } = splitTrainTest(series, holdout);
  if (test.length === 0) {
    // Fallback: fit on full series with mid-range α/β
    const { fitted, level, trend } = holtFit(series, 0.5, 0.2, phi);
    const residuals = [];
    for (let i = 1; i < series.length; i++) {
      residuals.push(series[i] - fitted[i]);
    }
    const rStd = Math.sqrt(
      residuals.reduce((s, e) => s + e * e, 0) / Math.max(1, residuals.length - 1)
    );
    const pointForecasts = holtForecastFrom(level, trend, horizon, phi);
    const z = zFor(confidence);
    const intervals = pointForecasts.map(v => ({ lower: v - z * rStd, upper: v + z * rStd, point: v }));
    
    return {
      model: "Holt(add)",
      alpha: 0.5,
      beta: 0.2,
      horizon,
      metrics: { MAE: NaN, RMSE: NaN, MAPE: null, sMAPE: null },
      pointForecasts,
      intervals,
      fittedTrain: fitted,
      level,
      trend,
      trainLength: series.length,
      testLength: 0,
      holdoutSize: holdout
    };
  }

  let best = null;
  for (const a of alphaGrid) {
    for (const b of betaGrid) {
      const { fitted, level, trend } = holtFit(train, a, b, phi);
      const predTest = holtForecastFrom(level, trend, test.length, phi);
      const m = metrics(test, predTest);
      if (!best || m.RMSE < best.metrics.RMSE) {
        best = { alpha: a, beta: b, metrics: m, fittedTrain: fitted, level, trend };
      }
    }
  }

  // Residual std from train fit
  const residuals = [];
  for (let i = 1; i < train.length; i++) residuals.push(train[i] - best.fittedTrain[i]);
  const rStd = Math.sqrt(
    residuals.reduce((s, e) => s + e * e, 0) / Math.max(1, residuals.length - 1)
  );

  const pointForecasts = holtForecastFrom(best.level, best.trend, horizon, phi);
  const z = zFor(confidence);
  const intervals = pointForecasts.map(v => ({ lower: v - z * rStd, upper: v + z * rStd, point: v }));

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
    holdoutSize: holdout
  };
}

function bestHoltForecast(series, horizon = 12, holdout = null, confidence = 0.95, phi = 1.0) {
  const alphaGrid = [0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9];
  const betaGrid = [0.05,0.1,0.2,0.3,0.4];
  return gridSearchHolt(series, horizon, alphaGrid, betaGrid, holdout, confidence, phi);
}

export {
  bestHoltForecast,
  splitTrainTest,
  metrics,
  holtFit,
  holtForecastFrom,
  gridSearchHolt
};

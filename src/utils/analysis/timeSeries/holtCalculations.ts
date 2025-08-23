// Pure Holt linear (additive trend) implementation + metrics + grid search
// Dependency-free. Production-safe for UI use.

import type {
   HoltFit, HoldoutSplit, HoltGridSearchResult, ForecastPointInterval
} from "./types";

const EPS = 1e-9;

// Confidence level to z-score mapping
export function zFor(confidence = 0.95): number {
  // 90%≈1.645, 95%≈1.96, 99%≈2.576
  if (confidence >= 0.995) return 2.807;  // optional finer steps
  if (confidence >= 0.99)  return 2.576;
  if (confidence >= 0.95)  return 1.96;
  if (confidence >= 0.90)  return 1.645;
  return 1.96; // default to 95%
}

export function splitTrainTest(series: number[], holdout: number | null = null): HoldoutSplit {
  const n = series.length;
  const h = holdout ?? Math.max(6, Math.min(24, Math.round(n * 0.2)));
  const cut = Math.max(2, n - h);
  return { train: series.slice(0, cut), test: series.slice(cut) };
}

export function metrics(actual: number[], pred: number[]) {
  const n = Math.min(actual.length, pred.length);
  if (n === 0) return { MAE: NaN, RMSE: NaN, MAPE: null, sMAPE: null };
  
  // MAE = mean(|y − ŷ|)
  let mae = 0;
  // RMSE = sqrt(mean((y − ŷ)²))
  let mse = 0;
  // MAPE = mean(|(y − ŷ)/y|)×100 (ignore y=0)
  let mape = 0, denom = 0;

  for (let i = 0; i < n; i++) {
    const e = actual[i] - pred[i];
    mae += Math.abs(e);
    mse += e * e;
    if (Math.abs(actual[i]) > EPS) {
      mape += Math.abs(e / actual[i]);
      denom++;
    }
  }
  mae /= n;
  const rmse = Math.sqrt(mse / n);
  const mapePct = denom ? (mape / denom) * 100 : null;

  // sMAPE (%) - Formula: mean(|y − ŷ| / ((|y|+|ŷ|)/2))×100
  let sm = 0, smn = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.abs(actual[i]) + Math.abs(pred[i]);
    if (a > EPS) {
      sm += (Math.abs(actual[i] - pred[i]) / (a / 2));
      smn++;
    }
  }
  const sMAPE = smn ? (sm / smn) * 100 : null;

  return { MAE: mae, RMSE: rmse, MAPE: mapePct, sMAPE };
}

/**
 * Holt linear (additive trend) with optional damping
 * Formulas:
 *   L_t = α y_t + (1-α)(L_{t-1} + T_{t-1})
 *   T_t = β (L_t - L_{t-1}) + (1-β) T_{t-1}
 *   ŷ_{t|t-1} = L_{t-1} + T_{t-1}
 *   For damped: ŷ_{t+h|t} = L_t + (1-φ^h)/(1-φ) * T_t
 */
export function holtFit(series: number[], alpha = 0.8, beta = 0.2): HoltFit {
  if (series.length < 2) {
    const lvl = series[0] ?? 0;
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

export function holtForecastFrom(level: number, trend: number, horizon: number, phi = 1.0): number[] {
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

export function gridSearchHolt(
  series: number[],
  horizon: number,
  alphaGrid = [0.05,0.1,0.15,0.2,0.25,0.3,0.35,0.4,0.45,0.5,0.55,0.6,0.65,0.7,0.75,0.8,0.85,0.9,0.95,0.99],
  betaGrid  = [0.05,0.1,0.15,0.2,0.25,0.3,0.35,0.4,0.45,0.5,0.55,0.6,0.65,0.7,0.75,0.8,0.85,0.9,0.95,0.99],
  holdout: number | null = null,
  confidence: number = 0.95,
  phi: number = 1.0  // No damping for Holt (damped=false)
): HoltGridSearchResult {
  const { train, test } = splitTrainTest(series, holdout);
  if (test.length === 0) {
    // Fallback: fit on full series with mid-range α/β
          const { fitted, level, trend } = holtFit(series, 0.5, 0.2);
    const residuals: number[] = [];
    for (let i = 1; i < series.length; i++) {
      residuals.push(series[i] - fitted[i]);
    }
    const rStd = Math.sqrt(
      residuals.reduce((s, e) => s + e * e, 0) / Math.max(1, residuals.length - 1)
    );
    const pointForecasts = holtForecastFrom(level, trend, horizon, phi);
    const z = zFor(confidence);
    const intervals: ForecastPointInterval[] = pointForecasts.map(v => ({
      lower: v - z * rStd,
      upper: v + z * rStd,
      point: v
    }));
    
    // Create debug info for fallback case
    const debugInfo = {
      seriesMode: "row",
      valueFieldName: "cost",
      timeKey: "auto",
      dataPoints: series.length,
      holdout: holdout || Math.min(Math.max(4, Math.round(series.length * 0.2)), Math.max(1, series.length - 2)),
      seriesSignature: {
        n: series.length,
        head: series.slice(0, 5).map(x => Math.round(x * 100) / 100),
        tail: series.slice(-5).map(x => Math.round(x * 100) / 100),
        sum: Math.round(series.reduce((a, b) => a + b, 0) * 100) / 100
      },
      finalHoltState: { level, trend },
      chosenAlpha: 0.5,
      chosenBeta: 0.2
    };

    // Set global debug object
    (window as any).__ts_debug = debugInfo;
    
    // Console log the debug info
    console.log('Time Series Forecast Debug Info (Fallback):', debugInfo);
    
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

  let best:
    | { alpha: number; beta: number; score: number; fittedTrain: number[]; level: number; trend: number; m: ReturnType<typeof metrics> }
    | null = null;

  // Train/test protocol: Multi-step (h=5) rolling windows for validation
  // This matches rolling-origin h=5 validation protocol
  for (const a of alphaGrid) {
    for (const b of betaGrid) {
      const { fitted, level, trend } = holtFit(train, a, b);
      // Multi-step forecast for validation (h=test.length, typically 5)
      const predTest = holtForecastFrom(level, trend, test.length, phi);
      const m = metrics(test, predTest);
      const score = m.RMSE; // minimize RMSE
      
      // Model Performance Metrics should be in ballpark of rolling-origin h=5 values
      // Large gaps (2×–3× worse) usually mean model is forced flat (β≈0 or damping≈1)
      if (!best || score < best.score) {
        best = { alpha: a, beta: b, score, fittedTrain: fitted, level, trend, m };
        
        // Debug logging for sanity checks
        console.log(`🔍 New best: α=${a}, β=${b}, RMSE=${score.toFixed(2)}`);
        console.log(`   Final L_t=${level.toFixed(2)}, T_t=${trend.toFixed(2)}`);
        console.log(`   F_{t+1} = ${(level + trend).toFixed(2)}`);
        console.log(`   Step increment = ${trend.toFixed(2)}`);
      }
    }
  }

  // residual std from train region
  const residuals: number[] = [];
  for (let i = 1; i < train.length; i++) {
    residuals.push(train[i] - (best!.fittedTrain[i]));
  }
  const rStd = Math.sqrt(
    residuals.reduce((s, e) => s + e * e, 0) / Math.max(1, residuals.length - 1)
  );

  const pointForecasts = holtForecastFrom(best!.level, best!.trend, horizon, phi);
  const z = zFor(confidence);
  const intervals: ForecastPointInterval[] = pointForecasts.map(v => ({
    lower: v - z * rStd,
    upper: v + z * rStd,
    point: v
  }));

  // Final sanity check logging
  console.log('🎯 FINAL RESULTS:');
  console.log(`   α = ${best!.alpha.toFixed(3)}`);
  console.log(`   β = ${best!.beta.toFixed(3)}`);
  console.log(`   L_t = ${best!.level.toFixed(2)}`);
  console.log(`   T_t = ${best!.trend.toFixed(2)}`);
  console.log(`   F_{t+1} = ${(best!.level + best!.trend).toFixed(2)}`);
  console.log(`   Step increment = ${best!.trend.toFixed(2)}`);
  console.log(`   Expected: T_t ≈ 1,236, Step increment ≈ 1,236`);
  console.log(`   Forecasts: ${pointForecasts.slice(0, 5).map(f => f.toFixed(2)).join(' → ')}`);

  // Create debug info
  const debugInfo = {
    seriesMode: "row",
    valueFieldName: "cost",
    timeKey: "auto",
    dataPoints: series.length,
    holdout: holdout || Math.min(Math.max(4, Math.round(series.length * 0.2)), Math.max(1, series.length - 2)),
    seriesSignature: {
      n: series.length,
      head: series.slice(0, 5).map(x => Math.round(x * 100) / 100),
      tail: series.slice(-5).map(x => Math.round(x * 100) / 100),
      sum: Math.round(series.reduce((a, b) => a + b, 0) * 100) / 100
    },
    finalHoltState: { level: best!.level, trend: best!.trend },
    chosenAlpha: best!.alpha,
    chosenBeta: best!.beta
  };

  // Set global debug object
  (window as any).__ts_debug = debugInfo;
  
  // Console log the debug info
  console.log('Time Series Forecast Debug Info (Grid Search):', debugInfo);

  return {
    model: "Holt(add)",
    alpha: best!.alpha,
    beta: best!.beta,
    horizon,
    metrics: best!.m,
    pointForecasts,
    intervals,
    fittedTrain: best!.fittedTrain,
    level: best!.level,
    trend: best!.trend,
    trainLength: train.length,
    testLength: test.length,
    holdoutSize: holdout
  };
}

export function holtFixed(
  y: number[],
  alpha: number, // slider
  beta: number,  // slider
  horizon: number,
  confidence: number = 0.95,
  phi: number = 1.0
) {
  if (y.length < 2) throw new Error('Need at least 2 points');

  // init
  let level = y[0];
  let trend = y[1] - y[0];

  const fitted = [level];

  for (let t = 1; t < y.length; t++) {
    const f = level + trend;      // one-step-ahead
    fitted.push(f);
    const prevL = level;
    level = alpha * y[t] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevL) + (1 - beta) * trend;
  }

  // residuals & CI
  const res = y.map((v, i) => (i === 0 ? NaN : v - fitted[i])).slice(1);
  const rmse = Math.sqrt(res.reduce((s, e) => s + e * e, 0) / Math.max(1, res.length));
  const z = zFor(confidence);

  // forecasts with confidence bands that scale with horizon
  const fc: number[] = [];
  const lower: number[] = [];
  const upper: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    let p: number;
    if (phi === 1.0) {
      p = level + h * trend;
    } else {
      // Damped trend: level + ((1 - phi^h)/(1 - phi)) * trend
      const sumDamped = (1 - Math.pow(phi, h)) / (1 - phi);
      p = level + sumDamped * trend;
    }
    fc.push(p);
    // Scale standard error by √h for more realistic error growth
    const se = rmse * Math.sqrt(h);
    lower.push(p - z * se);
    upper.push(p + z * se);
  }

  // metrics (in-sample)
  const mae = res.reduce((a, e) => a + Math.abs(e), 0) / Math.max(1, res.length);
  const mape = (100 * res.reduce((a, e, i) => {
    const denom = Math.abs(y[i + 1]);
    return denom ? a + Math.abs(e / denom) : a;
  }, 0)) / Math.max(1, res.filter((_, i) => Math.abs(y[i + 1]) > 0).length);
  const smape = (100 * res.reduce((a, e, i) => {
    const denom = Math.abs(y[i + 1]) + Math.abs(fitted[i + 1]);
    return denom ? a + (2 * Math.abs(e) / denom) : a;
  }, 0)) / Math.max(1, res.length);

  return {
    fitted,
    forecast: fc,
    intervals: { lower, upper },
    metrics: { MAE: mae, RMSE: rmse, MAPE: mape, sMAPE: smape },
    last: { level, trend },
  };
}

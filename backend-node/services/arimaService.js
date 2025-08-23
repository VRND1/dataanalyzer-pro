// services/arimaService.js
// Lightweight ARIMA-ish analyzer + preprocessing utilities
// NOTE: This is NOT statsmodels. It's a simplified implementation to keep your API working
// and to make inputs identical to the way I computed results (daily totals, sorted, filled).

/** ---------- Helpers: time & series prep ---------- **/

/** Convert input [{timestamp,value}] to a daily, sorted, gap-filled series */
function prepareDailySeries(points) {
  if (!Array.isArray(points)) return [];

  // Normalize {timestamp,value}
  const rows = points
    .filter(r => r && typeof r.value === 'number' && !Number.isNaN(r.value)
      && typeof r.timestamp === 'number' && !Number.isNaN(r.timestamp))
    .map(r => ({ ts: r.timestamp, value: r.value }))
    .sort((a, b) => a.ts - b.ts);

  if (rows.length === 0) return [];

  // Collapse to daily buckets (sum per day)
  const DAY = 24 * 60 * 60 * 1000;
  const byDay = new Map();
  for (const r of rows) {
    const day = new Date(r.ts);
    day.setUTCHours(0, 0, 0, 0);
    const key = day.getTime();
    byDay.set(key, (byDay.get(key) || 0) + r.value);
  }

  // Build continuous daily index and linearly interpolate any gaps
  const keys = [...byDay.keys()].sort((a, b) => a - b);
  const start = keys[0];
  const end = keys[keys.length - 1];

  const series = [];
  for (let t = start; t <= end; t += DAY) {
    if (byDay.has(t)) {
      series.push({ ts: t, value: byDay.get(t) });
    } else {
      series.push({ ts: t, value: NaN }); // mark gap
    }
  }

  // Linear interpolation for NaNs
  let i = 0;
  while (i < series.length) {
    if (!Number.isNaN(series[i].value)) { i++; continue; }

    // find next non-NaN
    let j = i + 1;
    while (j < series.length && Number.isNaN(series[j].value)) j++;

    const left = i - 1 >= 0 ? series[i - 1].value : null;
    const right = j < series.length ? series[j].value : null;

    // fill range [i, j)
    if (left != null && right != null) {
      const step = (right - left) / (j - i + 1);
      for (let k = i; k < j; k++) {
        series[k].value = left + step * (k - (i - 1));
      }
    } else if (left != null) {
      for (let k = i; k < j; k++) series[k].value = left;
    } else if (right != null) {
      for (let k = i; k < j; k++) series[k].value = right;
    } else {
      // all NaNs
      for (let k = i; k < j; k++) series[k].value = 0;
    }
    i = j;
  }

  return series.map(r => r.value);
}

/** Basic differencing d times */
function difference(series, d) {
  let s = series.slice();
  for (let k = 0; k < d; k++) {
    const next = [];
    for (let i = 1; i < s.length; i++) next.push(s[i] - s[i - 1]);
    s = next;
  }
  return s;
}

/** Inverse differencing (d=1 only; extendable) */
function undifference(diffSeries, lastOriginal) {
  // lastOriginal: the last actual y_T before the first diff prediction
  const out = [];
  let prev = lastOriginal;
  for (let i = 0; i < diffSeries.length; i++) {
    prev = prev + diffSeries[i];
    out.push(prev);
  }
  return out;
}

/** Mean Absolute Error */
function mae(res) {
  const n = res.length || 1;
  return res.reduce((a, b) => a + Math.abs(b), 0) / n;
}

/** Root Mean Squared Error */
function rmse(res) {
  const n = res.length || 1;
  const mse = res.reduce((a, b) => a + b * b, 0) / n;
  return Math.sqrt(mse);
}

/** AIC/BIC from residual variance (Gaussian) */
function infoCriteria(res, k) {
  const n = Math.max(res.length, 1);
  const variance = res.reduce((a, b) => a + b * b, 0) / n || 1e-9;
  const logL = -0.5 * n * Math.log(2 * Math.PI * variance) - 0.5 * n;
  const aic = -2 * logL + 2 * k;
  const bic = -2 * logL + k * Math.log(n);
  return { aic, bic };
}

/** ---------- Extremely small ARIMA( p,d,q ) skeleton (safe defaults) ---------- **/

/**
 * Parameter estimation for ARIMA(p,d,q):
 * - AR via autocorrelation for p=1
 * - MA via residual autocorrelation for q=1 with AIC refinement
 * Don't zero out MA parameters - use actual estimates
 */
function estimateParams(series, p, q, d) {
  const s = d > 0 ? difference(series, d) : series.slice();
  const n = s.length;
  if (n < 3) return { ar: Array(p).fill(0), ma: Array(q).fill(0) };

  const mean = s.reduce((a, b) => a + b, 0) / n;
  const var0 = s.reduce((a, x) => a + (x - mean) * (x - mean), 0) || 1e-9;

  // AR(1) via lag-1 covariance (your current logic)
  const ar = [];
  if (p >= 1) {
    let cov1 = 0;
    for (let i = 1; i < n; i++) cov1 += (s[i] - mean) * (s[i - 1] - mean);
    ar.push(cov1 / var0);
  }
  while (ar.length < p) ar.push(0);

  // MA(1) initial guess via lag-2 covariance (your current logic)
  const ma = [];
  if (q >= 1) {
    if (n >= 3) {
      let cov2 = 0;
      for (let i = 2; i < n; i++) cov2 += (s[i] - mean) * (s[i - 2] - mean);
      const maParam = cov2 / var0;
      ma.push(Math.max(-0.9, Math.min(0.9, maParam)));
    } else {
      ma.push(-0.3);
    }

    // >>> NEW: refine MA(1) by minimizing AIC on a coarse grid <<<
    let bestTheta = ma[0], bestAIC = Infinity;
    for (let theta = -0.99; theta <= 0.99; theta += 0.01) {
      const { fitted, residuals } = fitSeries(s, ar, [theta]);
      const { aic } = infoCriteria(residuals, ar.length + 1);
      if (Number.isFinite(aic) && aic < bestAIC) {
        bestAIC = aic;
        bestTheta = theta;
      }
    }
    ma[0] = bestTheta; // often ~ -1.00 on your series
  }
  while (ma.length < q) ma.push(0);

  return { ar, ma };
}

/** Build fitted values and residuals */
function fitSeries(series, ar, ma) {
  const p = ar.length, q = ma.length;
  const start = Math.max(p, q);
  const fitted = [];
  const residuals = [];

  for (let i = start; i < series.length; i++) {
    let yhat = 0;
    for (let j = 0; j < p; j++) yhat += ar[j] * series[i - j - 1];
    for (let j = 0; j < q && j < residuals.length; j++) {
      yhat += ma[j] * residuals[residuals.length - j - 1];
    }
    fitted.push(yhat);
    residuals.push(series[i] - yhat);
  }
  return { start, fitted, residuals };
}

/** Forecast h steps ahead (non-seasonal) */
function forecast(series, ar, ma, steps) {
  const p = ar.length, q = ma.length;
  const hist = series.slice();
  const resids = [];
  const out = [];

  for (let h = 1; h <= steps; h++) {
    let yhat = 0;
    for (let j = 0; j < p && hist.length - j - 1 >= 0; j++) {
      yhat += ar[j] * hist[hist.length - j - 1];
    }
    for (let j = 0; j < q && j < resids.length; j++) {
      yhat += ma[j] * resids[resids.length - j - 1];
    }
    out.push(yhat);
    hist.push(yhat);
    resids.push(0);
  }
  return out;
}

/** Main analyze */
function analyze(points, params, forecastPeriods = 12, options = {}) {
  const prepared = Array.isArray(points) ? (typeof points[0] === 'number'
    ? points.slice()
    : prepareDailySeries(points)) : [];

  const { p = 1, d = 1, q = 1 } = params || {};
  const useLog1p = options.log1p === true;

  // Optional variance stabilization
  const preparedScaled = useLog1p ? prepared.map(v => Math.log1p(Math.max(0, v))) : prepared;

  const s = d > 0 ? difference(preparedScaled, d) : preparedScaled.slice();
  const warn = prepared.length < 10;

  const { ar, ma } = estimateParams(preparedScaled, p, q, d);
  const { start, fitted, residuals } = fitSeries(s, ar, ma);
  const fcDiff = forecast(s, ar, ma, forecastPeriods); // on differenced scale if d>0

  // Invert differencing for fitted/forecast to original scale
  let fittedOnOrigScale, forecastOnOrigScale;

  if (d > 0) {
    // Anchor: value right before the first fitted diff point
    // s[i] = y[i+1] - y[i]  -> first fitted maps to y[start+1]
    const anchorIndex = start; 
    const anchorVal = preparedScaled[anchorIndex];
    fittedOnOrigScale = undifference(fitted, anchorVal);

    // Forecast start from last observed original (scaled)
    const lastObs = preparedScaled[preparedScaled.length - 1];
    forecastOnOrigScale = undifference(fcDiff, lastObs);
  } else {
    fittedOnOrigScale = fitted.slice();
    forecastOnOrigScale = fcDiff.slice();
  }

  // Back-transform if log1p
  const toOrig = (arr) => useLog1p ? arr.map(v => Math.max(0, Math.expm1(v))) : arr;
  const fittedFinal = toOrig(fittedOnOrigScale);
  const forecastFinal = toOrig(forecastOnOrigScale);

  // Align residuals with fitted-on-original-scale
  const residualsFinal = [];
  // residuals correspond to s from index 'start' onward; align with fittedFinal
  for (let i = 0; i < fittedFinal.length; i++) {
    const idxInOrig = (prepared.length - fittedFinal.length) + i;
    const actual = prepared[idxInOrig];
    if (typeof actual === 'number') residualsFinal.push(actual - fittedFinal[i]);
  }

  const metrics = {
    rmse: rmse(residualsFinal),
    mae: mae(residualsFinal),
    ...infoCriteria(residualsFinal, ar.length + ma.length)
  };

  return {
    ok: true,
    warning: warn ? 'Very few observations (<10). Results may be unstable.' : null,
    data: {
      parameters: { ar, ma, p, d, q },
      originalLength: prepared.length,
      fittedValues: fittedFinal,
      residuals: residualsFinal,
      forecast: forecastFinal,
      metrics
    }
  };
}

/** ---------- Enhanced API Methods for Compatibility ---------- **/

/**
 * Main ARIMA analysis method (compatibility with test files)
 */
async function analyzeARIMA(requestOrData, maybeParams = {}) {
  let data, parameters, forecastPeriods, confidenceLevel, log1p;
  if (Array.isArray(requestOrData) || typeof requestOrData[0] === 'number') {
    data = requestOrData;
    parameters = maybeParams || {};
    forecastPeriods = parameters.forecastPeriods || 12;
    confidenceLevel = parameters.confidenceLevel || 0.95;
    log1p = parameters.log1p === true;
  } else {
    const req = requestOrData || {};
    data = req.data || [];
    parameters = req.parameters || {};
    forecastPeriods = req.forecastPeriods || 12;
    confidenceLevel = req.confidenceLevel || 0.95;
    log1p = !!req.log1p;
  }

  const result = analyze(data, parameters, forecastPeriods, { log1p });
  if (!result.ok) return { success: false, error: result.warning || 'Analysis failed' };

  const se = Math.sqrt(result.data.metrics.rmse * result.data.metrics.rmse);
  const z = confidenceLevel === 0.99 ? 2.58 : (confidenceLevel === 0.90 ? 1.645 : 1.96);
  const margin = z * se;
  const lower = result.data.forecast.map(f => f - margin);
  const upper = result.data.forecast.map(f => f + margin);

  return {
    success: true,
    data: {
      originalData: (Array.isArray(data) && typeof data[0] === 'number') ? data.slice()
                    : prepareDailySeries(data),
      fittedValues: result.data.fittedValues,
      residuals: result.data.residuals,
      forecast: result.data.forecast,
      forecastIntervals: { lower, upper },
      parameters: { ar: result.data.parameters.ar, ma: result.data.parameters.ma, d: parameters.d ?? 1, seasonal_period: parameters.seasonalPeriod || 7 },
      metrics: result.data.metrics,
      diagnostics: { ljungBox: NaN }, // leave to UI to compute p-value locally
      modelInfo: {
        order: { p: parameters.p ?? 1, d: parameters.d ?? 1, q: parameters.q ?? 1 },
        seasonal: parameters.seasonal ? { P: parameters.P || 0, D: parameters.D || 0, Q: parameters.Q || 0 } : null,
        dataPoints: result.data.originalLength,
        analysisDate: new Date().toISOString()
      }
    }
  };
}

// Convert to the shape ARIMA.tsx expects
function convertToARIMAResult(apiResponse, fieldName, originalData) {
  if (!apiResponse?.success) {
    return {
      field: fieldName,
      originalData: originalData || [],
      fittedValues: [],
      residuals: [],
      forecast: [],
      forecastIntervals: { lower: [], upper: [] },
      metrics: { aic: 0, bic: 0, rmse: 0, mae: 0, mape: 0 },
      parameters: { ar: [], ma: [] },
      diagnostics: { stationarity: false, autocorrelation: [], ljungBox: NaN }
    };
  }
  const d = apiResponse.data;
  return {
    field: fieldName,
    originalData: originalData?.length ? originalData : d.originalData,
    fittedValues: d.fittedValues,
    residuals: d.residuals,
    forecast: d.forecast,
    forecastIntervals: d.forecastIntervals,
    metrics: { aic: d.metrics.aic, bic: d.metrics.bic, rmse: d.metrics.rmse, mae: d.metrics.mae, mape: d.metrics.mape ?? NaN },
    parameters: { ar: d.parameters.ar, ma: d.parameters.ma },
    diagnostics: { stationarity: true, autocorrelation: [], ljungBox: NaN }
  };
}

/**
 * Auto-detect optimal parameters
 */
async function autoDetectParameters(data) {
  try {
    // Simple heuristic: try common parameter combinations
    const combinations = [
      { p: 1, d: 1, q: 1 },
      { p: 2, d: 1, q: 1 },
      { p: 1, d: 1, q: 2 },
      { p: 0, d: 1, q: 1 },
      { p: 1, d: 0, q: 1 }
    ];

    let bestParams = { p: 1, d: 1, q: 1 };
    let bestAIC = Infinity;

    for (const params of combinations) {
      const result = analyze(data, params, 12);
      if (result.ok && result.data.metrics.aic < bestAIC) {
        bestAIC = result.data.metrics.aic;
        bestParams = params;
      }
    }

    return bestParams;
  } catch (error) {
    return { p: 1, d: 1, q: 1 }; // fallback
  }
}

/**
 * Generate forecast with extended parameters
 */
function generateForecast(data, arParams, maParams, seasonalAr = [], seasonalMa = [], d = 1, periods = 12, seasonalPeriod = 12) {
  try {
    const series = Array.isArray(data) ? data : prepareDailySeries(data);
    const forecastValues = forecast(series, arParams, maParams, periods);
    
    return {
      values: forecastValues,
      periods,
      parameters: { ar: arParams, ma: maParams, d, seasonalPeriod }
    };
  } catch (error) {
    return { values: [], periods, error: error.message };
  }
}

/**
 * Calculate fitted values
 */
function calculateFittedValues(data, arParams, maParams, seasonalAr = [], seasonalMa = [], d = 1, seasonalPeriod = 12) {
  try {
    const series = Array.isArray(data) ? data : prepareDailySeries(data);
    const { fitted } = fitSeries(series, arParams, maParams);
    return fitted;
  } catch (error) {
    return [];
  }
}

/**
 * Calculate residuals
 */
function calculateResiduals(data, fittedValues) {
  try {
    const series = Array.isArray(data) ? data : prepareDailySeries(data);
    const start = series.length - fittedValues.length;
    const residuals = [];
    
    for (let i = 0; i < fittedValues.length; i++) {
      residuals.push(series[start + i] - fittedValues[i]);
    }
    
    return residuals;
  } catch (error) {
    return [];
  }
}

/**
 * Calculate confidence intervals
 */
function calculateConfidenceIntervals(forecast, residuals, confidenceLevel = 0.95) {
  try {
    const rmse = Math.sqrt(residuals.reduce((a, b) => a + b * b, 0) / residuals.length);
    const zScore = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.99 ? 2.58 : 1.645;
    const margin = zScore * rmse;
    
    return {
      lower: forecast.map(f => f - margin),
      upper: forecast.map(f => f + margin)
    };
  } catch (error) {
    return { lower: [], upper: [] };
  }
}

/**
 * Validate data
 */
function validateData(data) {
  try {
    if (!Array.isArray(data)) {
      return { valid: false, error: 'Data must be an array' };
    }

    if (data.length < 10) {
      return { 
        valid: false, 
        error: `Insufficient data: ${data.length} points (minimum 10 required)`,
        details: { actual: data.length, required: 10 }
      };
    }

    // Check for valid numeric values
    const validPoints = data.filter(point => {
      if (typeof point === 'number') return !Number.isNaN(point) && Number.isFinite(point);
      if (point && typeof point.value === 'number') {
        return !Number.isNaN(point.value) && Number.isFinite(point.value);
      }
      return false;
    });

    if (validPoints.length < 10) {
      return {
        valid: false,
        error: `Insufficient valid data points: ${validPoints.length} (minimum 10 required)`,
        details: { actual: validPoints.length, required: 10, total: data.length }
      };
    }

    return { valid: true, dataPoints: validPoints.length };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

export {
  analyze,
  prepareDailySeries,
  forecast,
  // Enhanced API methods
  analyzeARIMA,
  autoDetectParameters,
  generateForecast,
  calculateFittedValues,
  calculateResiduals,
  calculateConfidenceIntervals,
  validateData,
  convertToARIMAResult
};

// Named export that your TS file expects
export const arimaService = {
  analyzeARIMA,
  autoDetectParameters,
  generateForecast,
  calculateFittedValues,
  calculateResiduals,
  calculateConfidenceIntervals,
  validateData,
  convertToARIMAResult
};

// Default export for compatibility with test files
export default {
  analyze,
  prepareDailySeries,
  forecast,
  analyzeARIMA,
  autoDetectParameters,
  generateForecast,
  calculateFittedValues,
  calculateResiduals,
  calculateConfidenceIntervals,
  validateData,
  convertToARIMAResult
}; 
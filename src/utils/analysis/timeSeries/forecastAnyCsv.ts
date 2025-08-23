// forecastAnyCsv.ts
// Dynamic Holt (double) exponential smoothing for any CSV rows.
// - Detects time & value columns
// - Deterministic ordering (date ASC + stable within-date tiebreakers)
// - Works in "row" or "date_sum" mode
// - Auto holdout + optional grid search (n-aware)
// - Configurable confidence level; sqrt(h) CI growth
// - Safe against NaNs & date-only timezone quirks

type Row = Record<string, any>;
export type SeriesMode = "row" | "date_sum";

export type ForecastConfig = {
  timeKey?: string;                 // auto-detect if omitted
  field?: string;                   // default 'sales' (or price*quantity fallback)
  mode?: SeriesMode;                // 'row' (default) or 'date_sum'
  withinDateOrderKeys?: string[];   // stable tiebreakers (default below)
  horizon?: number;                 // default 5
  confidence?: number;              // e.g., 0.95 (default)
  useGrid?: boolean;                // default true
  alpha?: number;                   // used only if useGrid = false
  beta?: number;                    // used only if useGrid = false
};

export type ForecastResult = {
  meta: {
    n: number;
    mode: SeriesMode;
    timeKey: string;
    field: string;
    holdout: number;
    signature: { n: number; head: number[]; tail: number[]; sum: number };
  };
  used: { alpha: number; beta: number; horizon: number; confidence: number };
  state: { level: number; trend: number };
  fitted: number[];                 // one-step-ahead
  forecast: number[];
  intervals: { lower: number[]; upper: number[] };
  metrics: { MAE: number; RMSE: number; MAPE: number | null; sMAPE: number | null };
};

// ---------- helpers ----------
const EPS = 1e-9;
const round2 = (x: number) => Math.round(x * 100) / 100;

function parseTime(v: any) {
  const s = String(v ?? "");
  // prevent timezone flip on date-only strings
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
    ? new Date(s + "T00:00:00").getTime()
    : new Date(s).getTime();
}

function guessTimeKey(cols: string[]): string {
  const lc = cols.map(s => s.toLowerCase());
  const hits = ["date", "timestamp", "time", "dt"];
  const i = lc.findIndex(x => hits.includes(x));
  return i >= 0 ? cols[i] : cols[0];
}

function valueGetter(field: string) {
  const f = field.toLowerCase();
  return (r: Row) => {
    if (f === "sales") {
      if (r.sales != null && r.sales !== "") return Number(r.sales);
      return Number(r.price) * Number(r.quantity); // fallback
    }
    if (f === "dailysales") return Number(r.dailySales);
    if (f === "quantity")   return Number(r.quantity);
    return Number(r[field]); // generic numeric
  };
}

function zFor(conf = 0.95) {
  if (conf >= 0.995) return 2.807;
  if (conf >= 0.99)  return 2.576;
  if (conf >= 0.95)  return 1.96;
  if (conf >= 0.90)  return 1.645;
  return 1.96;
}

function seriesSignature(y: number[]) {
  return {
    n: y.length,
    head: y.slice(0, 5).map(round2),
    tail: y.slice(-5).map(round2),
    sum: round2(y.reduce((a, b) => a + b, 0)),
  };
}

function metrics(actual: number[], pred: number[]) {
  const n = Math.min(actual.length, pred.length);
  if (!n) return { MAE: NaN, RMSE: NaN, MAPE: null, sMAPE: null };
  let mae = 0, mse = 0, mape = 0, den = 0, sm = 0, smn = 0;
  for (let i = 0; i < n; i++) {
    const e = actual[i] - pred[i];
    mae += Math.abs(e); mse += e * e;
    const a = Math.abs(actual[i]);
    if (a > EPS) { mape += Math.abs(e / a); den++; }
    const d = a + Math.abs(pred[i]);
    if (d > EPS) { sm += 2 * Math.abs(e) / d; smn++; }
  }
  return {
    MAE: mae / n,
    RMSE: Math.sqrt(mse / n),
    MAPE: den ? (100 * mape / den) : null,
    sMAPE: smn ? (100 * sm / smn) : null
  };
}

// ---------- series builder (works for ANY file) ----------
export function buildSeriesForAnyFile(
  rows: Row[],
  {
    timeKey,
    field = "sales",
    mode = "row",
    withinDateOrderKeys = ["productName", "category", "id", "__i"],
  }: Pick<ForecastConfig, "timeKey" | "field" | "mode" | "withinDateOrderKeys"> = {}
) {
  if (!rows?.length) throw new Error("No rows");
  const cols = Object.keys(rows[0]);
  const tKey = timeKey ?? guessTimeKey(cols);
  const val = valueGetter(field);

  console.log('Building series with:', {
    totalRows: rows.length,
    columns: cols,
    timeKey: tKey,
    field: field,
    mode: mode,
    sampleRow: rows[0]
  });

  // keep original index for stable tiebreaking
  const withIdx = rows.map((r, i) => ({ ...r, __i: i })) as (Row & { __i: number })[];

  // date ASC, then deterministic within-date
  withIdx.sort((a, b) => {
    const ta = parseTime(a[tKey]); const tb = parseTime(b[tKey]);
    if (ta !== tb) return ta - tb;
    for (const k of withinDateOrderKeys) {
      const va = String(a?.[k] ?? "");
      const vb = String(b?.[k] ?? "");
      if (va < vb) return -1;
      if (va > vb) return 1;
    }
    return 0;
  });

  if (mode === "row") {
    const y = withIdx.map(val).map(Number).filter(Number.isFinite);
    console.log('Row mode - extracted values:', {
      totalValues: y.length,
      sampleValues: y.slice(0, 5),
      field: field
    });
    return { y, meta: { n: y.length, mode, timeKey: tKey, field } };
  }

  // date_sum: collapse identical dates
  const byDate = new Map<number, number>();
  for (const r of withIdx) {
    const t = parseTime(r[tKey]);
    const v = Number(val(r));
    if (Number.isFinite(v)) byDate.set(t, (byDate.get(t) ?? 0) + v);
  }
  const y = Array.from(byDate.entries()).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
  console.log('Date_sum mode - extracted values:', {
    totalValues: y.length,
    sampleValues: y.slice(0, 5),
    field: field
  });
  return { y, meta: { n: y.length, mode, timeKey: tKey, field } };
}

// ---------- Holt core ----------
function holtFit(y: number[], alpha: number, beta: number) {
  let L = y[0];
  let T = (y[1] ?? y[0]) - y[0];
  const fitted = [L];
  for (let t = 1; t < y.length; t++) {
    const f = L + T; fitted.push(f);
    const prevL = L;
    L = alpha * y[t] + (1 - alpha) * (L + T);
    T = beta * (L - prevL) + (1 - beta) * T;
  }
  return { fitted, level: L, trend: T };
}
function holtForecast(level: number, trend: number, h: number) {
  return Array.from({ length: h }, (_, i) => level + (i + 1) * trend);
}

// ---------- grid / auto ----------
function chooseGrid(n: number) {
  const alphas = n <= 24 ? [0.2,0.3,0.4,0.5,0.6,0.7,0.8] : [0.2,0.4,0.6,0.8];
  const betas  = n <= 24 ? [0.05,0.1,0.2,0.3,0.4]        : [0.05,0.15,0.3];
  return { alphas, betas };
}

export function forecastAnyCsv(
  rows: Row[],
  cfg: ForecastConfig = {}
): ForecastResult {
  try {
    console.log('Starting forecast with config:', cfg);
    console.log('Input rows sample:', rows.slice(0, 3));
    
    // Use provided configuration or defaults
    const config = {
      mode: "row" as const,
      field: "sales",
      ...cfg
    };
    
    const { y, meta } = buildSeriesForAnyFile(rows, config);
    
    if (y.length < 2) {
      throw new Error(`Need at least 2 points for Holt, got ${y.length}. Check if the field '${config.field}' contains valid numeric data.`);
    }

    console.log('Series built successfully:', {
      dataPoints: y.length,
      sampleData: y.slice(0, 5),
      meta: meta
    });

    const horizon   = config.horizon ?? 5;
    const confidence= config.confidence ?? 0.95;
    const useGrid   = config.useGrid ?? true;

    // n-aware holdout for grid selection
    const n = y.length;
    const holdout = Math.min(Math.max(4, Math.round(n * 0.2)), Math.max(1, n - 2));
    const cut = Math.max(2, n - holdout);
    const train = y.slice(0, cut);
    const test  = y.slice(cut);

    let alpha = config.alpha ?? 0.3;
    let beta  = config.beta  ?? 0.1;

    if (useGrid) {
      const { alphas, betas } = chooseGrid(n);
      let best: { a:number; b:number; rmse:number } | null = null;
      for (const a of alphas) for (const b of betas) {
        const fit = holtFit(train, a, b);
        const pred = holtForecast(fit.level, fit.trend, test.length);
        const m = metrics(test, pred);
        if (!best || m.RMSE < best.rmse) best = { a, b, rmse: m.RMSE };
      }
      if (best) { alpha = best.a; beta = best.b; }
    }

    // Final fit on full series with chosen params
    const fit = holtFit(y, alpha, beta);
    const fc  = holtForecast(fit.level, fit.trend, horizon);

    // CI: residual-based, widen with sqrt(h)
    const res: number[] = [];
    for (let i = 1; i < y.length; i++) res.push(y[i] - fit.fitted[i]);
    const rmse = Math.sqrt(res.reduce((s,e)=>s+e*e,0) / Math.max(1, res.length));
    const z = zFor(confidence);
    const lower = fc.map((p, i) => p - z * rmse * Math.sqrt(i + 1));
    const upper = fc.map((p, i) => p + z * rmse * Math.sqrt(i + 1));

    const mFull = metrics(y.slice(1), fit.fitted.slice(1));
    const sig = seriesSignature(y);

    // Create debug object
    const debugInfo = {
      seriesMode: meta.mode,
      valueFieldName: meta.field,
      timeKey: meta.timeKey,
      dataPoints: n,
      holdout: holdout,
      seriesSignature: sig,
      finalHoltState: { level: fit.level, trend: fit.trend },
      chosenAlpha: alpha,
      chosenBeta: beta
    };

    // Set global debug object
    (window as any).__ts_debug = debugInfo;
    
    // Console log the debug info
    console.log('Time Series Forecast Debug Info:', debugInfo);

    return {
      meta: { n, mode: meta.mode, timeKey: sig ? (config.timeKey ?? "auto") : "auto", field: meta.field, holdout, signature: sig },
      used: { alpha, beta, horizon, confidence },
      state: { level: fit.level, trend: fit.trend },
      fitted: fit.fitted,
      forecast: fc,
      intervals: { lower, upper },
      metrics: mFull
    };
  } catch (error) {
    console.error('Forecast error:', error);
    console.error('Input data:', { rowsCount: rows?.length, sampleRow: rows?.[0] });
    throw error;
  }
}

export type HoltResult = {
  alpha: number; beta: number; horizon: number;
  fitted: number[]; forecast: number[];
  intervals: { lower: number[]; upper: number[] };
  metrics: { MAE:number; RMSE:number; MAPE:number|null; sMAPE:number|null };
  last: { level:number; trend:number };
  n: number; holdout: number;
};

const EPS = 1e-9;

// Confidence level to z-score mapping
function zFor(confidence = 0.95): number {
  // 90%≈1.645, 95%≈1.96, 99%≈2.576
  if (confidence >= 0.995) return 2.807;  // optional finer steps
  if (confidence >= 0.99)  return 2.576;
  if (confidence >= 0.95)  return 1.96;
  if (confidence >= 0.90)  return 1.645;
  return 1.96; // default to 95%
}

function metrics(actual: number[], pred: number[]) {
  const n = Math.min(actual.length, pred.length);
  if (n === 0) return { MAE: NaN, RMSE: NaN, MAPE: null, sMAPE: null };
  
  let mae=0, mse=0, mape=0, den=0, sm=0, smn=0;
  for (let i=0;i<n;i++){
    const e = actual[i]-pred[i];
    mae += Math.abs(e); mse += e*e;
    const a = Math.abs(actual[i]);
    if (a>EPS){ mape += Math.abs(e/a); den++; }
    const d = a + Math.abs(pred[i]);
    if (d>EPS){ sm += (2*Math.abs(e)/d); smn++; }
  }
  return {
    MAE: mae/n,
    RMSE: Math.sqrt(mse/n),
    MAPE: den? (100*mape/den): null,
    sMAPE: smn? (100*sm/smn): null
  };
}

function holtFit(y:number[], alpha:number, beta:number){
  let L = y[0], T = (y[1] ?? y[0]) - y[0];
  const fitted = [L];
  for (let t=1; t<y.length; t++){
    const f = L + T; fitted.push(f);
    const prevL = L;
    L = alpha*y[t] + (1-alpha)*(L+T);
    T = beta*(L - prevL) + (1-beta)*T;
  }
  return { fitted, level:L, trend:T };
}

function holtForecast(level:number, trend:number, h:number, phi:number = 1.0){
  if (phi === 1.0) {
    return Array.from({length:h}, (_,i)=> level + (i+1)*trend);
  } else {
    // Damped trend: level + ((1 - phi^(i+1))/(1 - phi)) * trend
    return Array.from({length:h}, (_,i)=> {
      const sumDamped = (1 - Math.pow(phi, i+1)) / (1 - phi);
      return level + sumDamped * trend;
    });
  }
}

export function holtAuto(y:number[], {
  horizon = 5,
  useGrid = true,
  confidence = 0.95,
  phi = 1.0
}: { horizon?: number; useGrid?: boolean; confidence?: number; phi?: number } = {}): HoltResult {
  if (y.length < 2) throw new Error('Need ≥ 2 points');

  // n-aware holdout and grids
  const n = y.length;
  const holdout = Math.min(Math.max(4, Math.round(n*0.2)), Math.max(1, n-2));
  const cut = Math.max(2, n - holdout);
  const train = y.slice(0, cut);
  const test  = y.slice(cut);

  const alphaGrid = n <= 24 ? [0.2,0.3,0.4,0.5,0.6,0.7,0.8] : [0.2,0.4,0.6,0.8];
  const betaGrid  = n <= 24 ? [0.05,0.1,0.2,0.3,0.4]        : [0.05,0.15,0.3];

  let best = { alpha:0.3, beta:0.1, score: Number.POSITIVE_INFINITY, fit:null as any };
  if (useGrid) {
    for (const a of alphaGrid){
      for (const b of betaGrid){
        const fit = holtFit(train, a, b);
        const predTest = holtForecast(fit.level, fit.trend, test.length, phi);
        const m = metrics(test, predTest);
        if (m.RMSE < best.score){
          best = { alpha:a, beta:b, score:m.RMSE, fit };
        }
      }
    }
  } else {
    best = { alpha:0.3, beta:0.1, score:0, fit: holtFit(train, 0.3, 0.1) };
  }

  // refit on full series with chosen params
  const finalFit = holtFit(y, best.alpha, best.beta);
  const fc = holtForecast(finalFit.level, finalFit.trend, horizon, phi);

  // residual-based CI (simple, scale with in-sample RMSE)
  const res: number[] = [];
  for (let i=1;i<y.length;i++) res.push(y[i]-finalFit.fitted[i]);
  const rmse = Math.sqrt(res.reduce((s,e)=>s+e*e,0)/Math.max(1,res.length));
  const z = zFor(confidence);
  
  // Scale confidence bands with horizon for more realistic error growth
  const lower = fc.map((p, i) => p - z * rmse * Math.sqrt(i + 1));
  const upper = fc.map((p, i) => p + z * rmse * Math.sqrt(i + 1));

  // metrics on full in-sample
  const mFull = metrics(y.slice(1), finalFit.fitted.slice(1));

  // Create debug info
  const debugInfo = {
    seriesMode: "row",
    valueFieldName: "cost",
    timeKey: "auto",
    dataPoints: n,
    holdout: holdout,
    seriesSignature: {
      n: y.length,
      head: y.slice(0, 5).map(x => Math.round(x * 100) / 100),
      tail: y.slice(-5).map(x => Math.round(x * 100) / 100),
      sum: Math.round(y.reduce((a, b) => a + b, 0) * 100) / 100
    },
    finalHoltState: { level: finalFit.level, trend: finalFit.trend },
    chosenAlpha: best.alpha,
    chosenBeta: best.beta
  };

  // Set global debug object
  (window as any).__ts_debug = debugInfo;
  
  // Console log the debug info
  console.log('Time Series Forecast Debug Info (holtAuto):', debugInfo);

  return {
    alpha: best.alpha, beta: best.beta, horizon,
    fitted: finalFit.fitted, forecast: fc,
    intervals: { lower, upper },
    metrics: mFull,
    last: { level: finalFit.level, trend: finalFit.trend },
    n, holdout
  };
}

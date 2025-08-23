import { DataField } from '@/types/data';

// ====================
// Public Types
// ====================
export interface HypothesisTest {
  name: string;
  testType: 'mean' | 'variance' | 'proportion' | 'correlation';
  nullHypothesis: string;
  alternativeHypothesis: string;
  statistic: number; // test statistic (t, z, chi-square)
  pValue: number;
  criticalValue: number; // positive critical cutoff for the chosen tailing
  alpha: number;
  significant: boolean;
  interpretation: string;
  effectSize: number; // d for mean, h for proportion, |r| for correlation, ratio-1 for variance
  power: number; // approximate
}

export type TestType = 'mean' | 'variance' | 'proportion' | 'correlation';

export type Tail = 'two' | 'left' | 'right';

export interface HypothesisConfig {
  testType?: TestType;           // default 'mean'
  alpha?: number;                // default 0.05
  // Null values (defaults preserve your old behavior)
  mu0?: number;                  // default 0 for mean test
  sigma0Squared?: number;        // default 1 for variance test
  p0?: number;                   // default 0.5 for proportion test
  tails?: Tail;                  // default 'two'
  // For proportion test: define success condition
  successPredicate?: (v: number) => boolean; // default (v)=>v===1
}

// ====================
// Main Entrypoint (Backward compatible)
// ====================
export function performHypothesisTests(
  field: DataField, 
  cfgOrType?: HypothesisConfig | TestType,
  alphaLegacy?: number
): HypothesisTest {
  if (!field || !Array.isArray((field as any).value)) {
    throw new Error('Invalid data field: value must be an array');
  }
  const raw = ((field as any).value as number[]).filter(x => Number.isFinite(x));
  if (raw.length === 0) {
    throw new Error('Data field is empty after filtering non-finite values');
  }

  // Backward-compat: allow (field, testType, alpha)
  const defaultConfig: HypothesisConfig = {
    testType: 'mean',
    alpha: 0.05,
    mu0: 0,
    sigma0Squared: 1,
    p0: 0.5,
    tails: 'two',
    successPredicate: (v: number) => v === 1,
  };

  let config: HypothesisConfig;
  if (typeof cfgOrType === 'string') {
    config = { ...defaultConfig, testType: cfgOrType, alpha: alphaLegacy ?? 0.05 };
  } else {
    config = { ...defaultConfig, ...(cfgOrType || {}) };
  }

  const { testType, alpha, mu0, sigma0Squared, p0, tails, successPredicate } = config;

  // Basic stats
  const n = raw.length;
  const mean = avg(raw);
  const variance = sampleVariance(raw, mean);
  const stdDev = Math.sqrt(variance);

  switch (testType) {
    case 'mean':
      return meanTest(raw, { n, mean, stdDev, alpha: alpha!, mu0: mu0!, tails: tails! });
    case 'variance':
      return varianceTest(raw, { n, variance, alpha: alpha!, sigma0Squared: sigma0Squared!, tails: tails! });
    case 'proportion':
      return proportionTest(raw, { n, alpha: alpha!, p0: p0!, tails: tails!, successPredicate: successPredicate! });
    case 'correlation':
      return correlationTest(raw, { n, alpha: alpha!, tails: tails! });
    default:
      throw new Error(`Unknown testType: ${String(testType)}`);
  }
}

// ====================
// Tests
// ====================
function meanTest(_values: number[], opts: { n: number; mean: number; stdDev: number; alpha: number; mu0: number; tails: Tail; }): HypothesisTest {
  const { n, mean, stdDev, alpha, mu0, tails } = opts;
  const t = (mean - mu0) / (stdDev / Math.sqrt(n));
  const df = n - 1;
  const Ft = tCDF(t, df);
  const p = twoSidedFromCDF(Ft, tails);
  const crit = tCritical(alpha, df, tails);
  const significant = p < alpha;
  const d = (mean - mu0) / stdDev; // Cohen's d
  const power = approxPowerNormal(d * Math.sqrt(n), alpha, tails);

  return {
    name: 'One-sample t-test (mean)',
    testType: 'mean',
    nullHypothesis: `H₀: μ = ${fmt(mu0)}`,
    alternativeHypothesis: altText('μ', mu0, tails),
    statistic: t,
    pValue: p,
    criticalValue: crit,
    alpha,
    significant,
    interpretation: interpret('mean', significant, p, alpha, mean, mu0, n, tails),
    effectSize: Math.abs(d),
    power,
  };
}

function varianceTest(_values: number[], opts: { n: number; variance: number; alpha: number; sigma0Squared: number; tails: Tail; }): HypothesisTest {
  const { n, variance, alpha, sigma0Squared, tails } = opts;
  const df = n - 1;
  const chi2 = (df * variance) / sigma0Squared;
  const Fc = chiSquareCDF(chi2, df);
  const p = twoSidedFromCDF(Fc, tails);
  const crit = chiSquareCritical(alpha, df, tails);
  const significant = p < alpha;
  // effect size as variance ratio minus 1 (simple descriptive)
  const es = Math.abs(variance / sigma0Squared - 1);
  const power = approxPowerNormal(es * Math.sqrt(n), alpha, tails);

  return {
    name: 'Variance test (χ²)',
    testType: 'variance',
    nullHypothesis: `H₀: σ² = ${fmt(sigma0Squared)}`,
    alternativeHypothesis: altText('σ²', sigma0Squared, tails),
    statistic: chi2,
    pValue: p,
    criticalValue: crit,
    alpha,
    significant,
    interpretation: interpret('variance', significant, p, alpha, Math.sqrt(variance), Math.sqrt(sigma0Squared), n, tails),
    effectSize: es,
    power,
  };
}

function proportionTest(values: number[], opts: { n: number; alpha: number; p0: number; tails: Tail; successPredicate: (v: number) => boolean; }): HypothesisTest {
  const { n, alpha, p0, tails, successPredicate } = opts;
  const successes = values.reduce((s, v) => s + (successPredicate(v) ? 1 : 0), 0);
  const phat = successes / n;
  const se0 = Math.sqrt((p0 * (1 - p0)) / n);
  const z = (phat - p0) / se0;
  const Fz = normalCDF(z);
  const p = twoSidedFromCDF(Fz, tails);
  const crit = normalCritical(alpha, tails);
  const significant = p < alpha;
  // Cohen's h
  const h = 2 * Math.asin(Math.sqrt(phat)) - 2 * Math.asin(Math.sqrt(p0));
  const power = approxPowerNormal(Math.abs(h) * Math.sqrt(n), alpha, tails);

  return {
    name: 'Proportion test (z)',
    testType: 'proportion',
    nullHypothesis: `H₀: p = ${fmt(p0)}`,
    alternativeHypothesis: altText('p', p0, tails),
    statistic: z,
    pValue: p,
    criticalValue: crit,
    alpha,
    significant,
    interpretation: interpret('proportion', significant, p, alpha, phat, p0, n, tails),
    effectSize: Math.abs(h),
    power,
  };
}

function correlationTest(values: number[], opts: { n: number; alpha: number; tails: Tail; }): HypothesisTest {
  const { n, alpha, tails } = opts;
  if (n < 3) {
    throw new Error('Correlation test requires at least 3 observations');
  }
  const r = lag1Pearson(values);
  // t statistic for testing rho = 0
  const df = n - 2;
  const t = r * Math.sqrt(df / (1 - r * r));
  const Ft = tCDF(t, df);
  const p = twoSidedFromCDF(Ft, tails);
  const crit = tCritical(alpha, df, tails);
  const significant = p < alpha;
  const power = approxPowerNormal(Math.abs(r) * Math.sqrt(n), alpha, tails);

  return {
    name: 'Lag-1 correlation test (t)',
    testType: 'correlation',
    nullHypothesis: `H₀: ρ = 0`,
    alternativeHypothesis: altText('ρ', 0, tails),
    statistic: t,
    pValue: p,
    criticalValue: crit,
    alpha,
    significant,
    interpretation: interpret('correlation', significant, p, alpha, r, 0, n, tails),
    effectSize: Math.abs(r),
    power,
  };
}

// ====================
// Helpers — stats
// ====================
function avg(arr: number[]): number { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function sampleVariance(arr: number[], m?: number): number {
  const mean = m ?? avg(arr);
  let s = 0;
  for (const v of arr) s += (v - mean) * (v - mean);
  return s / (arr.length - 1);
}

function lag1Pearson(values: number[]): number {
  const n = values.length;
  const x = values.slice(0, n - 1);
  const y = values.slice(1);
  const mx = avg(x), my = avg(y);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < x.length; i++) {
    const a = x[i] - mx, b = y[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

// ====================
// Helpers — tails & power
// ====================
function twoSidedFromCDF(Fx: number, tails: Tail): number {
  if (tails === 'two') return 2 * Math.min(Fx, 1 - Fx);
  if (tails === 'left') return Fx;
  return 1 - Fx; // 'right'
}

function approxPowerNormal(effectTimesRootN: number, alpha: number, tails: Tail): number {
  // Very rough normal-approx power: P(Z > z_alpha - |effect|) for right-tail, etc.
  const za = (tails === 'two') ? normalQuantile(1 - alpha / 2) : normalQuantile(1 - alpha);
  if (tails === 'two') {
    // two-sided: power ≈ Φ(|e|-za) + (1 - Φ(|e|+za))
    const e = Math.abs(effectTimesRootN);
    return clamp01(normalCDF(e - za) + (1 - normalCDF(e + za)));
  } else if (tails === 'right') {
    return clamp01(1 - normalCDF(za - Math.abs(effectTimesRootN)));
  } else {
    return clamp01(normalCDF(-za - Math.abs(effectTimesRootN)));
  }
}

function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

function altText(symbol: string, nullValue: number, tails: Tail): string {
  if (tails === 'two') return `H₁: ${symbol} ≠ ${fmt(nullValue)}`;
  if (tails === 'left') return `H₁: ${symbol} < ${fmt(nullValue)}`;
  return `H₁: ${symbol} > ${fmt(nullValue)}`;
}

function fmt(x: number): string {
  if (!Number.isFinite(x)) return String(x);
  const ax = Math.abs(x);
  if (ax >= 1000 || (ax > 0 && ax < 0.001)) return x.toExponential(3);
  return x.toFixed(4);
}

function interpret(kind: TestType, significant: boolean, p: number, alpha: number, est: number, nullVal: number, n: number, tails: Tail): string {
  const base = significant ? 'Reject H₀' : 'Fail to reject H₀';
  const add = ` (p=${p.toExponential(2)} vs α=${alpha}).`;
  switch (kind) {
    case 'mean':
      return `${base}: sample mean ${fmt(est)} ${significant ? 'differs from' : 'is not different from'} ${fmt(nullVal)} with ${tails}-tailed test, n=${n}${add}`;
    case 'variance':
      return `${base}: sample σ ${fmt(est)} ${significant ? 'differs from' : 'is not different from'} ${fmt(nullVal)} with ${tails}-tailed test, n=${n}${add}`;
    case 'proportion':
      return `${base}: sample p=${fmt(est)} ${significant ? 'differs from' : 'is not different from'} ${fmt(nullVal)} (${tails}-tailed), n=${n}${add}`;
    case 'correlation':
      return `${base}: lag-1 correlation r=${fmt(est)} ${significant ? '≠' : '≈'} 0 (${tails}-tailed), n=${n}${add}`;
  }
}

// ====================
// Critical values
// ====================
function normalCritical(alpha: number, tails: Tail): number {
  const a = tails === 'two' ? alpha / 2 : alpha;
  return normalQuantile(1 - a);
}

function tCritical(alpha: number, df: number, tails: Tail): number {
  const a = tails === 'two' ? alpha / 2 : alpha;
  return invertCDF((x) => tCDF(x, df), 1 - a, 0, 100);
}

function chiSquareCritical(alpha: number, df: number, tails: Tail): number {
  const a = tails === 'two' ? alpha / 2 : alpha;
  return invertCDF((x) => chiSquareCDF(x, df), 1 - a, 0, df + 50 * Math.sqrt(df));
}

// ====================
// Distributions & Special Functions (accurate)
// ====================
// Error function
function erf(x: number): number {
  // Abramowitz & Stegun 7.1.26
  const a1 = 0.254829592,
        a2 = -0.284496736,
        a3 = 1.421413741,
        a4 = -1.453152027,
        a5 = 1.061405429,
        p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function normalCDF(z: number): number { return 0.5 * (1 + erf(z / Math.SQRT2)); }

function normalQuantile(p: number): number {
  // Acklam's approximation for inverse normal CDF
  if (p <= 0 || p >= 1) {
    if (p === 0) return -Infinity;
    if (p === 1) return Infinity;
    throw new Error('normalQuantile p must be in (0,1)');
  }
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const plow = 0.02425, phigh = 1 - plow;
  let q, r;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
           ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (phigh < p) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
         (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// Student's t CDF via regularized incomplete beta
function tCDF(t: number, df: number): number {
  const x = df / (df + t * t);
  const ib = regularizedIncompleteBeta(df / 2, 0.5, x);
  if (t >= 0) return 1 - 0.5 * ib;
  return 0.5 * ib;
}

// Chi-square CDF via regularized gamma P(s, x)
function chiSquareCDF(x: number, df: number): number {
  return regularizedGammaP(df / 2, x / 2);
}

// Regularized incomplete beta I_x(a,b)
function regularizedIncompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) {
    return bt * betacf(a, b, x) / a;
  } else {
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
}

function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200; const EPS = 3e-14; const FPMIN = 1e-300;
  let qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
  for (let m = 1, m2 = 2; m <= MAXIT; m++, m2 += 2) {
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
    if (Math.abs(d * c - 1) < EPS) break;
  }
  return h;
}

// Regularized lower gamma P(s,x)
function regularizedGammaP(s: number, x: number): number {
  if (x <= 0) return 0;
  if (x < s + 1) {
    // series
    let sum = 1 / s, term = sum, n = 1;
    while (Math.abs(term) > 1e-15) {
      term *= x / (s + n);
      sum += term; n++;
      if (n > 10000) break;
    }
    return sum * Math.exp(-x + s * Math.log(x) - logGamma(s));
  } else {
    // continued fraction for Q(s,x), then P=1-Q
    let a0 = 1, a1 = x, b0 = 0, b1 = 1, fac = 1 / a1, gOld = a1 * fac;
    for (let n = 1; n < 10000; n++) {
      const an = n;
      const ana = an - s;
      a0 = (a1 + a0 * ana) * fac;
      b0 = (b1 + b0 * ana) * fac;
      const anf = an * fac;
      a1 = x * a0 + anf * a1;
      b1 = x * b0 + anf * b1;
      if (a1 !== 0) {
        fac = 1 / a1;
        const g = b1 * fac;
        if (Math.abs((g - gOld) / g) < 1e-14) {
          const q = Math.exp(-x + s * Math.log(x) - logGamma(s)) * g;
          return 1 - q; // P = 1 - Q
        }
        gOld = g;
      }
    }
    const q = Math.exp(-x + s * Math.log(x) - logGamma(s)) * (b1 * fac);
    return 1 - q;
  }
}

// logGamma via Lanczos
function logGamma(z: number): number {
  const g = 7;
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let x = p[0];
  for (let i = 1; i < p.length; i++) x += p[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// Generic numeric inverse for monotone CDFs
function invertCDF(cdf: (x: number) => number, target: number, lo: number, hi: number, tol = 1e-8, maxIter = 200): number {
  let a = lo, b = hi;
  let fa = cdf(a) - target, fb = cdf(b) - target;
  // Expand if target not bracketed
  let expand = 0;
  while ((fa > 0 && fb > 0) || (fa < 0 && fb < 0)) {
    if (expand++ > 60) break;
    a = a - (hi - lo);
    b = b + (hi - lo);
    fa = cdf(a) - target;
    fb = cdf(b) - target;
  }
  for (let i = 0; i < maxIter; i++) {
    const m = 0.5 * (a + b);
    const fm = cdf(m) - target;
    if (Math.abs(fm) < tol || (b - a) < tol) return m;
    if ((fa < 0 && fm < 0) || (fa > 0 && fm > 0)) { a = m; fa = fm; } else { b = m; fb = fm; }
  }
  return 0.5 * (a + b);
}

// ====================
// Two-Sample Tests
// ====================

// Welch two-sample t-test (independent samples, unequal variances)
export function performWelchTwoSampleTTest(
  fieldA: DataField,
  fieldB: DataField,
  cfg: { alpha?: number; tails?: 'two' | 'left' | 'right' } = {}
): HypothesisTest {
  const a = (fieldA?.value as number[] || []).filter(v => Number.isFinite(v));
  const b = (fieldB?.value as number[] || []).filter(v => Number.isFinite(v));
  if (a.length < 2 || b.length < 2) throw new Error('Need at least 2 values in each group');

  const tails = cfg.tails ?? 'two';
  const alpha = cfg.alpha ?? 0.05;

  const mean = (x: number[]) => x.reduce((s,v)=>s+v,0)/x.length;
  const variance = (x: number[], m = mean(x)) =>
    x.reduce((s,v)=>s+(v-m)*(v-m),0)/(x.length-1);

  const n1 = a.length, n2 = b.length;
  const m1 = mean(a), m2 = mean(b);
  const s1 = variance(a, m1), s2 = variance(b, m2);

  const se = Math.sqrt(s1/n1 + s2/n2);
  const t = (m1 - m2) / se;

  // Welch–Satterthwaite df
  const num = (s1/n1 + s2/n2) ** 2;
  const den = (s1*s1)/(n1*n1*(n1-1)) + (s2*s2)/(n2*n2*(n2-1));
  const df = num / den;

  // p-value (two-tailed by default)
  const Ft = tCDF(t, df);
  const p = (tails === 'two') ? 2 * Math.min(Ft, 1 - Ft)
          : (tails === 'left' ? Ft : 1 - Ft);

  // critical value
  const aStar = (tails === 'two') ? alpha/2 : alpha;
  const crit = invertCDF((x)=>tCDF(x, df), 1 - aStar, 0, 100);

  const significant = p < alpha;

  // Effect size (Cohen's d using pooled SD; fine for reporting)
  const sp = Math.sqrt(((n1-1)*s1 + (n2-1)*s2) / (n1+n2-2));
  const d = (m1 - m2) / sp;

  // Rough power (normal approx)
  const nEff = (n1*n2)/(n1+n2); // harmonic-like effective n
  const power = approxPowerNormal(Math.abs(d) * Math.sqrt(nEff), alpha, tails);

  const nameA = (fieldA as any)?.name ?? 'Group A';
  const nameB = (fieldB as any)?.name ?? 'Group B';

  return {
    name: `Welch two-sample t-test: ${nameA} vs ${nameB}`,
    testType: 'mean', // keep union unchanged for compatibility
    nullHypothesis: 'H₀: μ₁ = μ₂',
    alternativeHypothesis:
      tails === 'two' ? 'H₁: μ₁ ≠ μ₂' : (tails === 'left' ? 'H₁: μ₁ < μ₂' : 'H₁: μ₁ > μ₂'),
    statistic: t,
    pValue: p,
    criticalValue: crit,
    alpha,
    significant,
    interpretation:
      `${significant ? 'Reject' : 'Fail to reject'} H₀: ` +
      `Δ=(${m1.toFixed(4)}−${m2.toFixed(4)}) with t=${t.toFixed(4)}, df≈${df.toFixed(2)}, p=${p.toExponential(2)}.`,
    effectSize: Math.abs(d),
    power,
  };
}
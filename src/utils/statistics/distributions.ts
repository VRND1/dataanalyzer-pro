/**
 * Student's t-distribution cumulative distribution function
 */
export function studentT(x: number, df: number): number {
  const a = (df + 1) / 2;
  const b = df / 2;
  const z = (x * x) / (df + x * x);
  return 1 - 0.5 * betaIncReg(a, b, z);
}

/**
 * Normal distribution cumulative distribution function
 */
export function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

/**
 * Chi-square distribution cumulative distribution function
 */
export function chiSquareCDF(x: number, df: number): number {
  return gammaIncReg(df / 2, x / 2);
}

/**
 * F-distribution cumulative distribution function
 */
export function fDistribution(x: number, df1: number, df2: number): number {
  const a = df1 / 2;
  const b = df2 / 2;
  const z = (df1 * x) / (df1 * x + df2);
  return betaIncReg(a, b, z);
}

/**
 * Error function
 */
function erf(x: number): number {
  const t = 1 / (1 + 0.5 * Math.abs(x));
  const tau = t * Math.exp(-x * x - 1.26551223 + 
    t * (1.00002368 + 
    t * (0.37409196 + 
    t * (0.09678418 + 
    t * (-0.18628806 + 
    t * (0.27886807 + 
    t * (-1.13520398 + 
    t * (1.48851587 + 
    t * (-0.82215223 + 
    t * 0.17087277)))))))));
  return x >= 0 ? 1 - tau : tau - 1;
}

/**
 * Regularized incomplete beta function
 */
function betaIncReg(a: number, b: number, x: number): number {
  const qab = a + b;
  const qap = a + 1.0;
  const qam = a - 1.0;
  let bz = 1.0 - qab * x / qap;
  
  for (let m = 1; m <= 100; m++) {
    const em = m;
    const tem = em + em;
    const d = em * (b - em) * x / ((qam + tem) * (a + tem));
    const ap = bz + d * em;
    const bp = 1.0 + em / qap;
    bz = ap / bp;
    
    if (Math.abs(bz - 1.0) < 3e-7) break;
  }
  
  return bz;
}

/**
 * Regularized incomplete gamma function
 */
function gammaIncReg(a: number, x: number): number {
  if (x < 0.0 || a <= 0.0) return 0.0;
  if (x === 0.0) return 0.0;
  if (x > 1.0 && x > a) return 1.0 - gammaIncReg(a, x);
  
  let sum = 1.0 / a;
  let term = sum;
  for (let n = 1; n <= 100; n++) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < Math.abs(sum) * 3e-7) break;
  }
  
  return Math.pow(x, a) * Math.exp(-x) * sum;
} 
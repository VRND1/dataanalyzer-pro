// debug-ma.js
function difference(series, d) {
  let s = series.slice();
  for (let k = 0; k < d; k++) {
    const next = [];
    for (let i = 1; i < s.length; i++) next.push(s[i] - s[i - 1]);
    s = next;
  }
  return s;
}

function estimateParams(series, p, q, d) {
  const s = d > 0 ? difference(series, d) : series.slice();
  const n = s.length;
  console.log('Original series:', series);
  console.log('Differenced series (d=' + d + '):', s);
  console.log('Series length:', n);
  
  if (n < 3) return { ar: Array(p).fill(0), ma: Array(q).fill(0) };

  const mean = s.reduce((a, b) => a + b, 0) / n;
  const var0 = s.reduce((a, x) => a + (x - mean) * (x - mean), 0) || 1e-9;
  console.log('Mean:', mean, 'Variance:', var0);

  // Estimate AR parameters
  const ar = [];
  if (p >= 1) {
    let cov1 = 0;
    for (let i = 1; i < n; i++) cov1 += (s[i] - mean) * (s[i - 1] - mean);
    ar.push(cov1 / var0);
  }
  while (ar.length < p) ar.push(0);
  console.log('AR parameters:', ar);

  // Estimate MA parameters using second-order autocorrelation
  const ma = [];
  if (q >= 1) {
    // Use second-order autocorrelation as a proxy for MA parameter
    if (n >= 3) {
      let cov2 = 0;
      for (let i = 2; i < n; i++) cov2 += (s[i] - mean) * (s[i - 2] - mean);
      const maParam = cov2 / var0;
      console.log('Second-order covariance:', cov2);
      console.log('Raw MA parameter:', maParam);
      // Ensure MA parameter is reasonable (between -0.9 and 0.9)
      const boundedMaParam = Math.max(-0.9, Math.min(0.9, maParam));
      console.log('Bounded MA parameter:', boundedMaParam);
      ma.push(boundedMaParam);
    } else {
      ma.push(-0.3); // Default MA parameter for small samples
      console.log('Using default MA parameter: -0.3');
    }
  }
  while (ma.length < q) ma.push(0);
  console.log('MA parameters:', ma);

  return { ar, ma };
}

// Test with the same data
const testSeries = [100, 110, 105, 115, 120, 125, 130, 135, 140, 145, 150, 155];
console.log('Testing MA parameter estimation...');
const result = estimateParams(testSeries, 1, 1, 1);
console.log('Final result:', result);

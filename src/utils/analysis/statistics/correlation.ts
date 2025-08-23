export function calculateCorrelation(x: number[], y: number[]): number {
  if (!x?.length || !y?.length) return 0;
  const n = Math.min(x.length, y.length);
  
  if (n < 2) return 0;
  
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }
  
  const denominator = Math.sqrt(denomX * denomY);
  return denominator === 0 ? 0 : numerator / denominator;
}

export function calculateCorrelations(fields: { name: string; value: number[] }[]): { fields: string[]; correlation: number }[] {
  const correlations: { fields: string[]; correlation: number }[] = [];
  
  for (let i = 0; i < fields.length; i++) {
    for (let j = i + 1; j < fields.length; j++) {
      const correlation = calculateCorrelation(fields[i].value, fields[j].value);
      correlations.push({
        fields: [fields[i].name, fields[j].name],
        correlation
      });
    }
  }
  
  return correlations;
}
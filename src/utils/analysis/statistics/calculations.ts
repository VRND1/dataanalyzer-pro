import { DataField } from '@/types/data';
import { calculateCorrelation } from './correlation';
import { FieldStats } from '@/types/analysis';
import { determineTrend } from './trends';

export function calculateStatistics(fields: DataField[]) {
  const numericFields = fields.filter(field => field.type === 'number');
  
  const statistics = {
    mean: {} as Record<string, number>,
    median: {} as Record<string, number>,
    standardDeviation: {} as Record<string, number>,
    correlations: {} as Record<string, number>
  };

  // Calculate statistics for numeric fields
  numericFields.forEach(field => {
    const values = field.value as number[];
    if (values.length > 0) {
      statistics.mean[field.name] = calculateMean(values);
      statistics.median[field.name] = calculateMedian(values);
      statistics.standardDeviation[field.name] = calculateStandardDeviation(values);
    }
  });

  // Calculate correlations between numeric fields
  if (numericFields.length > 1) {
    for (let i = 0; i < numericFields.length; i++) {
      for (let j = i + 1; j < numericFields.length; j++) {
        const field1 = numericFields[i];
        const field2 = numericFields[j];
        const key = `${field1.name}_${field2.name}`;
        statistics.correlations[key] = calculateCorrelation(
          field1.value as number[],
          field2.value as number[]
        );
      }
    }
  }

  return statistics;
}

export function calculateFieldStats(field: DataField): FieldStats {
  const values = field.value as number[];
  const sortedValues = [...values].sort((a, b) => a - b);
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = sortedValues[Math.floor(values.length / 2)];
  
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  const trend = determineTrend(values);
  
  // Calculate trend strength
  const indices = Array.from({ length: values.length }, (_, i) => i);
  const meanX = indices.reduce((a, b) => a + b, 0) / indices.length;
  const meanY = values.reduce((a, b) => a + b, 0) / values.length;
  const covariance = indices.reduce((a, i) => a + (i - meanX) * (values[i] - meanY), 0);
  const varianceX = indices.reduce((a, i) => a + Math.pow(i - meanX, 2), 0);
  const varianceY = values.reduce((a, y) => a + Math.pow(y - meanY, 2), 0);
  const trendStrength = Math.abs(covariance / Math.sqrt(varianceX * varianceY));
  
  // Calculate growth rate
  const growthRate = ((max - min) / min) * 100;
  
  // Calculate volatility
  const volatility = (standardDeviation / mean) * 100;
  
  // Detect outliers using IQR method
  const q1 = sortedValues[Math.floor(values.length * 0.25)];
  const q3 = sortedValues[Math.floor(values.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = values.filter(v => v < lowerBound || v > upperBound);
  
  return {
    mean,
    median,
    min,
    max,
    standardDeviation,
    trend,
    metrics: {
      trend,
      confidence: trendStrength
    },
    trendStrength,
    growthRate,
    volatility,
    outliers,
    value: values,
    avg: mean,
    quartiles: calculateQuartiles(values)
  };
}

export function calculateDatasetStats(fields: DataField[]) {
  const numericFields = fields.filter(f => f.type === 'number');
  const stats = numericFields.map(calculateFieldStats);
  
  const averageMean = stats.reduce((a, b) => a + b.mean, 0) / stats.length;
  const overallVariance = stats.reduce((a, b) => a + Math.pow(b.mean - averageMean, 2), 0) / stats.length;
  
  // Calculate overall trend strength based on correlation with index
  const trendStrengths = numericFields.map(field => {
    const values = field.value as number[];
    const indices = Array.from({ length: values.length }, (_, i) => i);
    
    const meanX = indices.reduce((a, b) => a + b, 0) / indices.length;
    const meanY = values.reduce((a, b) => a + b, 0) / values.length;
    
    const covariance = indices.reduce((a, i) => a + (i - meanX) * (values[i] - meanY), 0);
    const varianceX = indices.reduce((a, i) => a + Math.pow(i - meanX, 2), 0);
    const varianceY = values.reduce((a, y) => a + Math.pow(y - meanY, 2), 0);
    
    return Math.abs(covariance / Math.sqrt(varianceX * varianceY));
  });
  
  const trendStrength = trendStrengths.reduce((a, b) => a + b, 0) / trendStrengths.length;
  
  return {
    averageMean,
    overallVariance,
    trendStrength
  };
}

// Optimized statistical calculations with error handling
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  
  // Use Kahan summation for better numerical stability
  let sum = 0;
  let compensation = 0;
  
  for (const value of values) {
    const y = value - compensation;
    const t = sum + y;
    compensation = (t - sum) - y;
    sum = t;
  }
  
  return sum / values.length;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function calculateMode(values: number[]): number[] {
  if (values.length === 0) return [];
  
  const counts = new Map<number, number>();
  values.forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
  
  let maxCount = 0;
  const modes: number[] = [];
  
  counts.forEach((count, value) => {
    if (count > maxCount) {
      maxCount = count;
      modes.length = 0;
      modes.push(value);
    } else if (count === maxCount) {
      modes.push(value);
    }
  });
  
  return modes;
}

export function calculateStandardDeviation(values: number[], mean?: number): number {
  if (values.length === 0) return 0;
  const avg = mean ?? calculateMean(values);
  return Math.sqrt(calculateVariance(values, avg));
}

export function calculateVariance(values: number[], mean?: number): number {
  if (values.length === 0) return 0;
  const avg = mean ?? calculateMean(values);
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

export function calculateQuartiles(values: number[]): { q1: number; q2: number; q3: number } {
  if (values.length === 0) return { q1: 0, q2: 0, q3: 0 };
  
  const sorted = [...values].sort((a, b) => a - b);
  const q2 = calculateMedian(sorted);
  
  const lowerHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const upperHalf = sorted.slice(Math.ceil(sorted.length / 2));
  
  return {
    q1: calculateMedian(lowerHalf),
    q2,
    q3: calculateMedian(upperHalf)
  };
}

export function calculateMinMax(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 0 };
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

export function calculateSkewness(values: number[], mean: number, stdDev: number): number {
  if (values.length === 0 || stdDev === 0) return 0;
  const n = values.length;
  // Single pass calculation
  let sum = 0;
  const buffer = new Float64Array(values);
  for (let i = 0; i < buffer.length; i++) {
    sum += Math.pow((buffer[i] - mean) / stdDev, 3);
  }
  return (n / ((n - 1) * (n - 2))) * sum;
}

export function calculateKurtosis(values: number[], mean: number, stdDev: number): number {
  if (values.length === 0 || stdDev === 0) return 0;
  const n = values.length;
  // Single pass calculation
  let sum = 0;
  const buffer = new Float64Array(values);
  for (let i = 0; i < buffer.length; i++) {
    sum += Math.pow((buffer[i] - mean) / stdDev, 4);
  }
  const fourthMoment = sum / n;
  return fourthMoment - 3; // Excess kurtosis
}

export function calculateTrendStrength(fields: DataField[]): number {
  const trends = fields.map(field => {
    const values = field.value as number[];
    if (values.length < 2) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstMean = calculateMean(firstHalf);
    const secondMean = calculateMean(secondHalf);
    
    return Math.abs((secondMean - firstMean) / firstMean);
  });

  return calculateMean(trends);
}
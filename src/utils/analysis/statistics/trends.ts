import { calculateMean } from './calculations';

export type Trend = 'up' | 'down' | 'stable';

export function determineTrend(values: number | number[]): Trend {
  // Handle single value case
  if (typeof values === 'number') return 'stable';
  
  // Handle invalid input
  if (!Array.isArray(values) || values.length < 2) return 'stable';
  
  // Filter out invalid values
  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
  if (validValues.length < 2) return 'stable';

  const firstHalf = validValues.slice(0, Math.floor(validValues.length / 2));
  const secondHalf = validValues.slice(Math.floor(validValues.length / 2));
  const firstMean = calculateMean(firstHalf);
  const secondMean = calculateMean(secondHalf);
  
  const threshold = Math.abs(firstMean) * 0.05;
  const difference = secondMean - firstMean;
  if (Math.abs(difference) <= threshold) return 'stable';
  return difference > 0 ? 'up' : 'down';
}

export function getTrendIcon(trend: Trend): string {
  switch (trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    case 'stable': return '→';
  }
}

export function getTrendColor(trend: Trend): string {
  switch (trend) {
    case 'up': return '#4CAF50';
    case 'down': return '#F44336';
    case 'stable': return '#2196F3';
  }
}

export function getTrendLabel(trend: Trend): string {
  switch (trend) {
    case 'up': return 'Increasing';
    case 'down': return 'Decreasing';
    case 'stable': return 'Stable';
  }
}
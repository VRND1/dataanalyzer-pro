// Core analysis functionality
export { AnalysisEngine } from './core/AnalysisEngine';

// Statistical utilities
export {
  calculateMean,
  calculateMedian,
  calculateStandardDeviation,
  calculateCorrelation,
  calculateFieldStats
} from './statistics';

// Trend analysis
export {
  determineTrend,
  getTrendIcon,
  getTrendColor,
  getTrendLabel
} from './statistics/trends';

// Formatting
export { formatNumber } from './statistics/formatting';

// Visualization
export { ChartFactory } from './visualization/ChartFactory';
export { defaultChartOptions } from './visualization/config';

// Types
export type { DataField } from '@/types/data';
export type { Trend } from './statistics/trends';
export type { ChartConfig, ChartDimensions } from './visualization/types';
// Core analysis functionality
export { AnalysisEngine } from './AnalysisEngine';

// Statistical utilities
export { calculateCorrelation } from '../statistics/correlation';
export { calculateFieldStats } from '../statistics/calculations';
export { determineTrend } from '../statistics/trends';
export { formatNumber } from '../statistics/formatting';

// Types
export type { DataField } from '@/types/data';
export type { Trend } from '../statistics/trends';
// Core time series building
export { buildSeries, seriesSignature, type SeriesMode } from './series';

// Dynamic Holt forecasting
export { holtAuto, type HoltResult } from './holtDynamic';

// High-level service for CSV forecasting
export { 
  runForecastFromCsv, 
  getAvailableFields, 
  getTimeFields, 
  getNumericFields,
  type ForecastOptions,
  type ForecastResult 
} from './forecastService'; 

export * from "./forecastAnyCsv";
export type { TimeSeriesResult } from './types';
export { convertFieldsToTimeSeriesData } from './utils'; 
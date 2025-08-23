export interface ARIMAParams {
  p: number;
  d: number;
  q: number;
  seasonal: boolean;
  seasonalPeriod: number;
  optimize?: boolean;
  forecastLength?: number;
}

export interface TimeSeriesData {
  timestamp: number;
  value: number;
} 
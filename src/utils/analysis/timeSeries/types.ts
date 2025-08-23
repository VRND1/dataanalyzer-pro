// Core types shared across predictors, utils and services

export type Numeric = number;

export interface HoltParams {
  alpha: number; // level smoothing, (0,1)
  beta: number;  // trend smoothing, (0,1)
  phi?: number;  // damping parameter, (0,1] (1.0 = no damping)
}

export interface HoltFit {
  fitted: number[]; // one-step-ahead predictions aligned to y[1..n] (fitted[0] = initial level)
  level: number;    // last level Lt
  trend: number;    // last trend Tt
}

export interface HoldoutSplit {
  train: number[];
  test: number[];
}

export interface ForecastPointInterval {
  point: number;
  lower: number;
  upper: number;
}

export interface HoltGridSearchResult {
  model: "Holt(add)";
  alpha: number;
  beta: number;
  horizon: number;
  metrics: {
    MAE: number;
    RMSE: number;
    MAPE: number | null; // % (null if division-by-zero)
    sMAPE: number | null; // %
  };
  pointForecasts: number[];
  intervals: ForecastPointInterval[];
  fittedTrain: number[];
  level: number;
  trend: number;
  trainLength: number;
  testLength: number;
  holdoutSize: number | null;
}

export interface SeriesExtractionOptions<T> {
  timeKey: keyof T;
  valueKey: keyof T;
  sort?: boolean;
  parseTime?: (v: any) => number; // default: Date(v).getTime()
  aggregateByTime?: boolean;      // default: true
}

export interface ExtractedSeries {
  timestamps: number[];
  values: number[];
}

export interface TimeSeriesResult {
  forecast: number[];
  fitted: number[];
  level: number;
  trend: number;
  metrics: {
    MAE: number;
    RMSE: number;
    MAPE: number | null;
    sMAPE: number | null;
  };
} 
export type RegressionType = 'linear' | 'polynomial' | 'ridge' | 'lasso' | 'elastic-net' | 'logistic' | 'quantile' | 'time-series' | 'log-log';

export interface RegressionMetrics {
  mse: number;
  rmse: number;
  mae: number;
  rSquared: number;
  r2Score: number; // Add for UI compatibility
  rSquaredAdj: number;
  adjustedR2: number; // Add for UI compatibility
  aic: number;
  bic: number;
  durbinWatson: number;
  fStatistic?: number; // F-statistic for hypothesis testing
  pValue?: number; // P-value for hypothesis testing
  accuracy?: number; // For logistic regression
  logLoss?: number; // For logistic regression
  crossValidationScore?: number;
  crossValidationDetails?: {
    foldScores: number[];
    foldRMSE: number[];
    foldMAE: number[];
    meanScore: number;
    meanRMSE: number;
    meanMAE: number;
    stdScore: number;
    stdRMSE: number;
    stdMAE: number;
  };
}

export interface RegressionResult {
  field: string;
  type: RegressionType;
  coefficients: number[];
  intercept: number;
  rSquared: number;
  standardError: number;
  predictions: number[];
  actualValues: number[];
  equation: string;
  confidence: {
    upper: number[];
    lower: number[];
  };
  metrics: RegressionMetrics;
}

export interface RegressionOptions {
  type: RegressionType;
  polynomialDegree?: number;
  alpha?: number; // Regularization parameter for Ridge/Lasso
  l1Ratio?: number; // Elastic Net mixing parameter
  quantile?: number; // Quantile regression parameter
  stepwiseThreshold?: number;
  timeSeriesLag?: number;
  selectedFeatures?: number[];
  validationMetrics?: {
    crossValidationScore: number;
    testSetScore: number;
  };
}

export interface ConfidenceInterval {
  upper: number[];
  lower: number[];
}

export interface LinearRegressionResult {
  equation: string;
  slope: number;
  intercept: number;
  rSquared: number;
  confidenceIntervals: ConfidenceInterval;
  metrics: RegressionMetrics;
  predictions: number[];
  standardError: number;
}
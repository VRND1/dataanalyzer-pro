export interface RegressionMetrics {
  r2: number;
  adjustedR2: number;
  mse: number;
  rmse: number;
  mae: number;
}

export interface RegressionDiagnostics {
  residualNormality: boolean;
  homoscedasticity: boolean;
  multicollinearity: boolean;
  outliers: number[];
}

export interface RegressionResult {
  model: string;
  equation: string;
  coefficients: Record<string, number>;
  metrics: RegressionMetrics;
  predictions: number[];
  residuals: number[];
  actualValues: number[];
  featureImportance: Record<string, number>;
  diagnostics: RegressionDiagnostics;
  confidence?: {
    slope?: {
      lower: number;
      upper: number;
    };
    intercept?: {
      lower: number;
      upper: number;
    };
  };
  error?: string;
}

export type RegressionModelType = 'linear' | 'polynomial' | 'ridge' | 'lasso'; 
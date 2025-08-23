export interface RegressionResult {
  model: 'linear' | 'polynomial' | 'ridge' | 'lasso';
  equation: string;
  coefficients: {
    slope?: number;
    intercept?: number;
    polynomial?: number[];
  };
  metrics: {
    rmse: number;
    mse: number;
    r2: number;
  };
  predictions: number[];
  residuals: number[];
  actualValues: number[];
  featureImportance: { name: string; importance: number }[];
  diagnostics?: {
    residualNormality: { statistic: number; pValue: number; interpretation: string };
    heteroscedasticity: { statistic: number; pValue: number; interpretation: string };
    autocorrelation: { statistic: number; pValue: number; interpretation: string };
    multicollinearity: { vif: number; interpretation: string };
  };
} 
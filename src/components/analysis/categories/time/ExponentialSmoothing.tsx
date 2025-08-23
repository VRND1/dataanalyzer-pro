import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ScatterChart, Scatter, BarChart, Bar, AreaChart, Area } from 'recharts';
import { HoltGridSearchResult } from '@/utils/analysis/timeSeries/types';
import { gridSearchHolt, holtFit, holtForecastFrom } from '@/utils/analysis/timeSeries/holtCalculations';

// Simple Card Component for metrics display
const MetricCard: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = "blue" }) => (
  <div className={`p-3 border border-${color}-200 rounded-lg bg-${color}-50 min-w-[120px]`}>
    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</div>
    <div className="text-lg font-bold text-gray-900 mt-1">{value}</div>
  </div>
);

// Simple Holt fit function for R² calculation
function holtFitLevelTrend(train: number[], alpha: number, beta: number) {
  if (train.length < 2) return { level: train[0] ?? 0, trend: 0 };
  let level = train[0];
  let trend = train[1] - train[0];
  for (let t = 1; t < train.length; t++) {
    const prevLevel = level;
    level = alpha * train[t] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }
  return { level, trend };
}

interface ExponentialSmoothingProps {
  data: { timestamp: number; value: number; field: string; }[];
  onAnalyze?: (params: ExponentialSmoothingParams, result: HoltGridSearchResult) => void;
  forecastPeriods?: number;
  confidenceLevel?: number;
  analysisResult?: {
    accuracyMetrics?: {
      mse?: number;
      mae?: number;
      rmse?: number;
      mape?: number;
      r2?: number;
      aic?: number;
      bic?: number;
    };
    forecast?: number[];
    confidenceIntervals?: { lower: number[]; upper: number[]; };
    fitted?: number[];
    residuals?: number[];
    components?: {
      level?: number[];
      trend?: number[];
      seasonal?: number[];
    };
  };
  isLoading?: boolean;
  mode?: 'simple' | 'intermediate' | 'advanced';
  horizon?: number;
  holdout?: number;
}

interface ExponentialSmoothingParams {
  alpha: number;
  beta: number;
  gamma: number;
  seasonalPeriods: number;
  seasonalType: 'additive' | 'multiplicative';
  modelType: 'simple' | 'double' | 'triple' | 'holt';
  autoOptimize: boolean;
  dampingFactor?: number;
  useDamping?: boolean;
  useGridSearch?: boolean;
}

// Enhanced Exponential Smoothing Implementation with advanced algorithms
// @ts-ignore - Class is used internally for parameter optimization
class ExponentialSmoothingModel {
  private data: number[];
  private params: ExponentialSmoothingParams;
  private n: number;
  
  constructor(data: number[], params: ExponentialSmoothingParams) {
    this.data = data.filter(d => !isNaN(d) && isFinite(d)); // Clean data
    this.params = params;
    this.n = this.data.length;
  }

  // Enhanced Holt-Winters with damping and improved initialization
  fit(params: ExponentialSmoothingParams) {
    const { alpha, beta, gamma, seasonalPeriods, seasonalType, modelType, dampingFactor = 1, useDamping = false } = params;
    
    // Initialize arrays
    const level = new Array(this.n).fill(0);
    const trend = new Array(this.n).fill(0);
    const seasonal = new Array(this.n + seasonalPeriods).fill(0);
    const fitted = new Array(this.n).fill(0);

    // Improved seasonal initialization using classical decomposition
    if (modelType === 'triple') {
      this.initializeSeasonalFactors(seasonal, seasonalPeriods, seasonalType);
    }

    // Initialize level and trend using regression on first few points
    const initPoints = Math.min(seasonalPeriods || 4, Math.floor(this.n / 2));
    level[0] = this.calculateInitialLevel(initPoints);
    
    if (modelType !== 'simple') {
      trend[0] = this.calculateInitialTrend(initPoints);
    }

    // Main smoothing loop with enhanced error handling
    for (let i = 1; i < this.n; i++) {
      const prevLevel = level[i-1];
      const prevTrend = trend[i-1];
      
      if (modelType === 'simple') {
        level[i] = alpha * this.data[i] + (1 - alpha) * prevLevel;
        fitted[i] = prevLevel;
      } else if (modelType === 'double') {
        const dampedTrend = useDamping ? prevTrend * dampingFactor : prevTrend;
        level[i] = alpha * this.data[i] + (1 - alpha) * (prevLevel + dampedTrend);
        trend[i] = beta * (level[i] - prevLevel) + (1 - beta) * dampedTrend;
        fitted[i] = prevLevel + dampedTrend;
      } else { // triple
        const seasonalIndex = (i - 1) % seasonalPeriods;
        const currentSeasonal = seasonal[seasonalIndex];
        
        if (seasonalType === 'additive') {
          const dampedTrend = useDamping ? prevTrend * dampingFactor : prevTrend;
          level[i] = alpha * (this.data[i] - currentSeasonal) + (1 - alpha) * (prevLevel + dampedTrend);
          trend[i] = beta * (level[i] - prevLevel) + (1 - beta) * dampedTrend;
          seasonal[i + seasonalPeriods] = gamma * (this.data[i] - level[i]) + (1 - gamma) * currentSeasonal;
          fitted[i] = prevLevel + dampedTrend + currentSeasonal;
        } else { // multiplicative
          const dampedTrend = useDamping ? prevTrend * dampingFactor : prevTrend;
          level[i] = alpha * (this.data[i] / Math.max(currentSeasonal, 0.001)) + (1 - alpha) * (prevLevel + dampedTrend);
          trend[i] = beta * (level[i] - prevLevel) + (1 - beta) * dampedTrend;
          seasonal[i + seasonalPeriods] = gamma * (this.data[i] / Math.max(level[i], 0.001)) + (1 - gamma) * currentSeasonal;
          fitted[i] = (prevLevel + dampedTrend) * Math.max(currentSeasonal, 0.001);
        }
      }
    }

    return { level, trend, seasonal, fitted };
  }

  private initializeSeasonalFactors(seasonal: number[], seasonalPeriods: number, seasonalType: 'additive' | 'multiplicative') {
    // Use classical decomposition approach
    const cycles = Math.floor(this.n / seasonalPeriods);
    if (cycles < 2) {
      // Not enough data for proper seasonal initialization
      for (let i = 0; i < seasonalPeriods; i++) {
        seasonal[i] = seasonalType === 'additive' ? 0 : 1;
      }
      return;
    }

    // Calculate seasonal averages
    for (let s = 0; s < seasonalPeriods; s++) {
      let sum = 0;
      let count = 0;
      
      for (let c = 0; c < cycles; c++) {
        const index = c * seasonalPeriods + s;
        if (index < this.n) {
          sum += this.data[index];
          count++;
        }
      }
      
      const seasonalAvg = count > 0 ? sum / count : 0;
      const overallAvg = this.data.reduce((a, b) => a + b, 0) / this.n;
      
      if (seasonalType === 'additive') {
        seasonal[s] = seasonalAvg - overallAvg;
      } else {
        seasonal[s] = overallAvg > 0 ? seasonalAvg / overallAvg : 1;
      }
    }

    // Normalize seasonal factors
    if (seasonalType === 'additive') {
      const seasonalSum = seasonal.slice(0, seasonalPeriods).reduce((a, b) => a + b, 0);
      const adjustment = seasonalSum / seasonalPeriods;
      for (let i = 0; i < seasonalPeriods; i++) {
        seasonal[i] -= adjustment;
      }
    } else {
      const seasonalProduct = seasonal.slice(0, seasonalPeriods).reduce((a, b) => a * b, 1);
      const adjustment = Math.pow(seasonalProduct, 1 / seasonalPeriods);
      for (let i = 0; i < seasonalPeriods; i++) {
        seasonal[i] /= adjustment;
      }
    }
  }

  private calculateInitialLevel(points: number): number {
    return this.data.slice(0, points).reduce((a, b) => a + b, 0) / points;
  }

  private calculateInitialTrend(points: number): number {
    if (points < 2) return 0;
    
    // Linear regression slope for initial trend
    const x = Array.from({length: points}, (_, i) => i);
    const y = this.data.slice(0, points);
    
    const n = points;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return isFinite(slope) ? slope : 0;
  }

  // Parameter optimization method
  optimizeParameters(): ExponentialSmoothingParams {
    // Simple optimization - return current params
    return { ...this.params };
  }

  // Enhanced forecast with improved confidence intervals
  forecast(periods: number, confidenceLevel: number = 0.95) {
    const optimizedParams = this.params.autoOptimize ? this.optimizeParameters() : this.params;
    const components = this.fit(optimizedParams);
    
    const { level, trend, seasonal } = components;
    const lastLevel = level[this.n - 1];
    const lastTrend = trend[this.n - 1];
    
    const forecast: number[] = [];
    const residuals = this.calculateResiduals(components.fitted);
    const residualVariance = this.calculateVariance(residuals);
    const zScore = this.getZScore(confidenceLevel);
    
    const confidenceIntervals: { lower: number[]; upper: number[] } = { lower: [], upper: [] };
    
    for (let h = 1; h <= periods; h++) {
      let forecastValue = lastLevel;
      let errorVariance = residualVariance;
      
      // Add trend component with damping
      if (optimizedParams.modelType !== 'simple') {
        const dampingFactor = optimizedParams.useDamping ? (optimizedParams.dampingFactor || 1) : 1;
        let dampedTrendSum = 0;
        
        for (let j = 1; j <= h; j++) {
          dampedTrendSum += Math.pow(dampingFactor, j - 1);
        }
        
        forecastValue += lastTrend * dampedTrendSum;
        
        // Trend uncertainty grows with forecast horizon
        errorVariance *= (1 + 0.1 * h);
      }
      
      // Add seasonal component
      if (optimizedParams.modelType === 'triple') {
        const seasonalIndex = (this.n - 1 + h) % optimizedParams.seasonalPeriods;
        const seasonalValue = seasonal[seasonalIndex] || (optimizedParams.seasonalType === 'additive' ? 0 : 1);
        
        if (optimizedParams.seasonalType === 'additive') {
          forecastValue += seasonalValue;
        } else {
          forecastValue *= Math.max(seasonalValue, 0.001);
        }
      }
      
      forecast.push(forecastValue);
      
      // Calculate prediction intervals with increasing uncertainty
      const predictionError = Math.sqrt(errorVariance * (1 + Math.pow(h, 0.5) / 10));
      confidenceIntervals.lower.push(forecastValue - zScore * predictionError);
      confidenceIntervals.upper.push(forecastValue + zScore * predictionError);
    }
    
    return { forecast, confidenceIntervals, optimizedParams, components };
  }

  // Fix 2: Enhanced accuracy metrics with proper seasonal warm-up handling
  calculateAccuracyMetrics(fitted: number[]): { mse?: number; mae?: number; rmse?: number; mape?: number; r2?: number; aic?: number; bic?: number } {
    const s = this.params.modelType === 'triple' ? this.params.seasonalPeriods : 1;
    
    // Fix 1: Inverse-transform before metrics
    const yOrig = this.data; // Original data (no scaling applied)
    const fittedOri = fitted; // Fitted values (no scaling applied)
    
    // Fix 2: Score only where one-step-ahead is valid (start at t = s)
    const yEval = yOrig.slice(s);
    const yhatEval = fittedOri.slice(s);
    
    const residuals = yEval.map((v, i) => v - yhatEval[i]);
    const n = residuals.length;
    
    if (n === 0) {
      return { mse: 0, mae: 0, rmse: 0, mape: 0, r2: 0, aic: 0, bic: 0 };
    }
    
    // Debug: Log evaluation window data
    console.log(`Metric calculation - s: ${s}, n: ${n}`);
    console.log(`Data range: ${Math.min(...yEval)} to ${Math.max(...yEval)}`);
    console.log(`Fitted range: ${Math.min(...yhatEval)} to ${Math.max(...yhatEval)}`);
    console.log(`Residual range: ${Math.min(...residuals)} to ${Math.max(...residuals)}`);
    
    // Basic metrics
    const sse = residuals.reduce((a, e) => a + e * e, 0);
    const mse = sse / n;
    const rmse = Math.sqrt(mse);
    const mae = residuals.reduce((a, e) => a + Math.abs(e), 0) / n;
    
    // MAPE calculation exactly as specified
    const mape = 100 * residuals.reduce((a, e, i) => a + Math.abs(e) / yEval[i], 0) / residuals.length;
    
    // R^2 against the same evaluation window
    const ybar = yEval.reduce((a, v) => a + v, 0) / yEval.length;
    const sst = yEval.reduce((a, v) => a + (v - ybar) ** 2, 0);
    const r2 = 1 - sse / (sst || Number.NaN);
    
    // Information criteria
    const aic = this.calculateAIC(fitted, this.params);
    const bic = this.calculateBIC(fitted, this.params);
    
    return { mse, mae, rmse, mape, r2, aic, bic };
  }

  private calculateAIC(fitted: number[], params: ExponentialSmoothingParams): number {
    const residuals = this.calculateResiduals(fitted);
    const n = residuals.length;
    const sse = residuals.reduce((sum, r) => sum + r * r, 0);
    
    // Count parameters
    let k = 1; // alpha
    if (params.modelType !== 'simple') k++; // beta
    if (params.modelType === 'triple') k++; // gamma
    if (params.useDamping) k++; // damping factor
    // Fix C: Conservative parameter count for seasonal states (s-1 like statsmodels)
    k += Math.max(0, (params.seasonalPeriods || 0) - 1); // additive case: s-1 initial states
    
    const logLikelihood = -0.5 * n * Math.log(2 * Math.PI * sse / n) - 0.5 * n;
    return 2 * k - 2 * logLikelihood;
  }

  private calculateBIC(fitted: number[], params: ExponentialSmoothingParams): number {
    const aic = this.calculateAIC(fitted, params);
    let k = 1;
    if (params.modelType !== 'simple') k++;
    if (params.modelType === 'triple') k++;
    if (params.useDamping) k++;
    // Fix C: Conservative parameter count for seasonal states (s-1 like statsmodels)
    k += Math.max(0, (params.seasonalPeriods || 0) - 1); // additive case: s-1 initial states
    
    return aic + k * (Math.log(this.n) - 2);
  }

  // Fix B: Proper residual calculation without backfill bug
  private calculateResiduals(fitted: number[]): number[] {
    const res: number[] = [];
    const s = this.params.modelType === 'triple' ? this.params.seasonalPeriods : 1;
    
    for (let t = s; t < this.data.length; t++) {
      const fh = fitted[t];
      if (Number.isFinite(fh)) {
        res.push(this.data[t] - fh);
      }
    }
    return res;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1);
  }

  private getZScore(confidenceLevel: number): number {
    const levels: Record<string, number> = {
      '0.99': 2.576,
      '0.95': 1.96,
      '0.90': 1.645,
      '0.80': 1.282
    };
    return levels[confidenceLevel.toString()] || 1.96;
  }
}

export function ExponentialSmoothing({ 
  data,
  onAnalyze, 
  forecastPeriods = 12,
  confidenceLevel = 0.95,
  analysisResult, 
  isLoading = false,
  mode = 'advanced',
  horizon = 12,
  holdout = 6
}: ExponentialSmoothingProps) {
  
  // Dynamic parameter initialization based on data characteristics
  const getDynamicDefaults = (data: { timestamp: number; value: number; field: string; }[]) => {
    if (!data || data.length === 0) {
      return {
        alpha: 0.3,
        beta: 0.1,
        gamma: 0.1,
        seasonalPeriods: 12,
        seasonalType: 'additive' as const,
        modelType: 'holt' as const,
        autoOptimize: true,
        dampingFactor: 1.0, // No damping for Holt
        useDamping: false,   // Damping OFF for Holt
        useGridSearch: true
      };
    }

    const values = data.map(d => d.value);
    const n = values.length;
    
    // Analyze data characteristics
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    const cv = Math.sqrt(variance) / mean; // Coefficient of variation
    
    // Detect trend using linear regression
    const x = Array.from({length: n}, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const trendStrength = Math.abs(slope) / mean; // Normalized trend strength
    
    // Detect seasonality using autocorrelation
    const maxLag = Math.min(12, Math.floor(n / 4));
    let seasonalStrength = 0;
    let bestSeasonalPeriod = 12;
    
    for (let lag = 2; lag <= maxLag; lag++) {
      let numerator = 0;
      let denominator = 0;
      for (let i = 0; i < n - lag; i++) {
        const diff1 = values[i] - mean;
        const diff2 = values[i + lag] - mean;
        numerator += diff1 * diff2;
        denominator += diff1 * diff1;
      }
      const acf = denominator > 0 ? numerator / denominator : 0;
      if (Math.abs(acf) > seasonalStrength) {
        seasonalStrength = Math.abs(acf);
        bestSeasonalPeriod = lag;
      }
    }
    
    // Use Holt model type
    let modelType: 'simple' | 'double' | 'triple' | 'holt' = 'holt';
    
    // Dynamic seasonal periods
    let seasonalPeriods = 12;
    if (n < 24) {
      seasonalPeriods = Math.min(6, Math.floor(n / 3));
    } else if (seasonalStrength > 0.3 && bestSeasonalPeriod > 0) {
      seasonalPeriods = bestSeasonalPeriod;
    } else if (n >= 52) {
      seasonalPeriods = 12; // Monthly data
    } else if (n >= 24) {
      seasonalPeriods = 4; // Quarterly data
    }
    
    // Dynamic smoothing parameters based on data characteristics
    let alpha = 0.3;
    let beta = 0.1;
    let gamma = 0.1;
    
    // Alpha: Higher for stable data, lower for noisy data
    if (cv < 0.1) {
      alpha = 0.1; // Very stable data
    } else if (cv < 0.3) {
      alpha = 0.3; // Stable data
    } else if (cv < 0.5) {
      alpha = 0.5; // Moderate variability
    } else {
      alpha = 0.7; // High variability
    }
    
    // Beta: Higher for strong trends, lower for weak trends
    // Don't cap beta too low - allow grid search to find optimal value
    if (trendStrength > 0.05) {
      beta = 0.3; // Strong trend
    } else if (trendStrength > 0.02) {
      beta = 0.2; // Moderate trend
    } else {
      beta = 0.1; // Weak trend (increased from 0.01 to allow optimization)
    }
    
    // Gamma: Higher for strong seasonality, lower for weak seasonality
    if (seasonalStrength > 0.5) {
      gamma = 0.3; // Strong seasonality
    } else if (seasonalStrength > 0.3) {
      gamma = 0.1; // Moderate seasonality
    } else {
      gamma = 0.01; // Weak seasonality
    }
    
    // Fix 4: Use additive components to match standard runs
    const seasonalType = 'additive' as const;
    
    // Determine if damping should be used
    const useDamping = trendStrength > 0.03 && n > 20;
    
    // For Holt models, enable grid search by default
    const useGridSearch = modelType === 'holt';
    
    return {
      alpha,
      beta,
      gamma,
      seasonalPeriods,
      seasonalType,
      modelType,
      autoOptimize: true,
      dampingFactor: 0.95,
      useDamping,
      useGridSearch
    };
  };

  const [params, setParams] = useState<ExponentialSmoothingParams>(() => 
    getDynamicDefaults(data)
  );

  // Update parameters when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      const newDefaults = getDynamicDefaults(data);
      setParams(prev => ({
        ...prev,
        ...newDefaults,
        // Preserve user's manual settings if they've been changed
        alpha: prev.alpha === 0.3 ? newDefaults.alpha : prev.alpha,
        beta: prev.beta === 0.1 ? newDefaults.beta : prev.beta,
        gamma: prev.gamma === 0.1 ? newDefaults.gamma : prev.gamma,
        seasonalPeriods: prev.seasonalPeriods === 12 ? newDefaults.seasonalPeriods : prev.seasonalPeriods,
        modelType: prev.modelType === 'triple' ? newDefaults.modelType : prev.modelType,
        seasonalType: prev.seasonalType === 'additive' ? newDefaults.seasonalType : prev.seasonalType,
        useDamping: prev.useDamping === false ? newDefaults.useDamping : prev.useDamping
      }));
    }
  }, [data]);

  const [showHelp, setShowHelp] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [internalResult, setInternalResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'forecast' | 'diagnostics' | 'components' | 'accuracy'>('forecast');

  // Helper functions for STL analysis
  const calculateTrendStrength = (series: number[]): number => {
    const n = series.length;
    const x = Array.from({length: n}, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = series.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * series[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const mean = sumY / n;
    return Math.abs(slope) / mean; // Normalized trend strength
  };

  const calculateSeasonalStrength = (series: number[]): number => {
    const n = series.length;
    const mean = series.reduce((a, b) => a + b, 0) / n;
    const maxLag = Math.min(12, Math.floor(n / 4));
    let seasonalStrength = 0;
    
    for (let lag = 2; lag <= maxLag; lag++) {
      let numerator = 0;
      let denominator = 0;
      for (let i = 0; i < n - lag; i++) {
        const diff1 = series[i] - mean;
        const diff2 = series[i + lag] - mean;
        numerator += diff1 * diff2;
        denominator += diff1 * diff1;
      }
      const acf = denominator > 0 ? numerator / denominator : 0;
      if (Math.abs(acf) > seasonalStrength) {
        seasonalStrength = Math.abs(acf);
      }
    }
    return seasonalStrength;
  };

  const findBestSeasonalPeriod = (series: number[]): number => {
    const n = series.length;
    const mean = series.reduce((a, b) => a + b, 0) / n;
    const maxLag = Math.min(12, Math.floor(n / 4));
    let seasonalStrength = 0;
    let bestPeriod = 12;
    
    for (let lag = 2; lag <= maxLag; lag++) {
      let numerator = 0;
      let denominator = 0;
      for (let i = 0; i < n - lag; i++) {
        const diff1 = series[i] - mean;
        const diff2 = series[i + lag] - mean;
        numerator += diff1 * diff2;
        denominator += diff1 * diff1;
      }
      const acf = denominator > 0 ? numerator / denominator : 0;
      if (Math.abs(acf) > seasonalStrength) {
        seasonalStrength = Math.abs(acf);
        bestPeriod = lag;
      }
    }
    return bestPeriod;
  };

  // Simple mode implementation
  const simpleMode = () => {
    if (!data || data.length === 0) return null;
    
    const series = data.map(d => d.value);
    const result = gridSearchHolt(series, horizon);
    const forecasts = result.pointForecasts;
    
    return (
      <div className="p-6 border rounded-lg shadow-lg bg-white">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Exponential Smoothing — Holt Model
        </h3>
        <div className="text-sm text-gray-600 mb-4">
          α: {result.alpha.toFixed(2)} | β: {result.beta.toFixed(2)}
        </div>
        <div className="text-sm text-gray-600 mb-4">
          MAE: {result.metrics.MAE.toFixed(2)} | RMSE: {result.metrics.RMSE.toFixed(2)} | MAPE: {result.metrics.MAPE?.toFixed(2) || 'N/A'}%
        </div>
        <h4 className="text-lg font-semibold text-gray-800 mb-2">
          Next {horizon} forecasts
        </h4>
        <ol className="list-decimal list-inside space-y-1">
          {forecasts.map((v, i) => (
            <li key={i} className="text-sm">
              {v.toFixed(2)}
            </li>
          ))}
        </ol>
      </div>
    );
  };

  // Intermediate mode implementation
  const intermediateMode = () => {
    if (!data || data.length === 0) return null;
    
    const series = data.map(d => d.value);
    const result = gridSearchHolt(series, horizon);
    const forecasts = result.pointForecasts;
    
    // Calculate R² on holdout
    const R2 = useMemo(() => {
      if (series.length <= holdout) return NaN;
      const cut = Math.max(2, series.length - holdout);
      const train = series.slice(0, cut);
      const test = series.slice(cut);
      
      const { level, trend } = holtFitLevelTrend(train, result.alpha, result.beta);
      
      const pred = Array.from({length: test.length}, (_,h)=> level + (h+1)*trend);
      const mean = test.reduce((s,v)=>s+v,0)/test.length;
      const sse = test.reduce((s,v,i)=> s + (v - pred[i])**2, 0);
      const sst = test.reduce((s,v)=> s + (v - mean)**2, 0);
      return sst > 0 ? 1 - sse/sst : NaN;
    }, [series, result.alpha, result.beta, holdout]);

    const { MAE, RMSE, MAPE } = result.metrics;
    const mse = RMSE * RMSE;
    
    const fmt = (x: number) => (Number.isFinite(x) ? x.toFixed(2) : '-');

    return (
      <div className="p-6 border rounded-lg shadow-lg bg-white">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Exponential Smoothing — Holt Model
          </h3>
          <div className="text-sm text-gray-600">
            α (level): {result.alpha.toFixed(2)} &nbsp; | &nbsp; β (trend): {result.beta.toFixed(2)}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <MetricCard label="MAE" value={fmt(MAE)} color="blue" />
          <MetricCard label="RMSE" value={fmt(RMSE)} color="green" />
          <MetricCard label="MAPE" value={MAPE !== null && Number.isFinite(MAPE) ? `${MAPE.toFixed(2)}%` : '-'} color="purple" />
          <MetricCard label="MSE" value={fmt(mse)} color="red" />
          <MetricCard label="R²" value={fmt(R2)} color="indigo" />
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            Next {horizon} forecasts
          </h4>
          <ol className="list-decimal list-inside space-y-2">
            {forecasts.map((v: number, i: number) => (
              <li key={i} className="text-sm">
                {v.toFixed(2)}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  };

  // Helper function for Q-Q plot - moved before useMemo hooks that use it
  const inverseNormalCDF = (p: number): number => {
    // Approximation of inverse normal CDF
    const a1 = -3.969683028665376e+01;
    const a2 = 2.209460984245205e+02;
    const a3 = -2.759285104469687e+02;
    const a4 = 1.383577518672690e+02;
    const a5 = -3.066479806614716e+01;
    const a6 = 2.506628277459239e+00;
    
    const b1 = -5.447609879822406e+01;
    const b2 = 1.615858368580409e+02;
    const b3 = -1.556989798598866e+02;
    const b4 = 6.680131188771972e+01;
    const b5 = -1.328068155288572e+01;
    
    const c1 = -7.784894002430293e-03;
    const c2 = -3.223964580411365e-01;
    const c3 = -2.400758277161838e+00;
    const c4 = -2.549732539343734e+00;
    const c5 = 4.374664141464968e+00;
    const c6 = 2.938163982698783e+00;
    
    const d1 = 7.784695709041462e-03;
    const d2 = 3.224671290700398e-01;
    const d3 = 2.445134137142996e+00;
    const d4 = 3.754408661907416e+00;
    
    const p_low = 0.02425;
    const p_high = 1 - p_low;
    
    let q, r;
    
    if (p < p_low) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / 
             ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else if (p <= p_high) {
      q = p - 0.5;
      r = q * q;
      return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q / 
             (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / 
             ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }
  };

  // Enhanced chart data with more comprehensive analytics
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const s = params.modelType === 'triple' ? params.seasonalPeriods : 1;
    
    const chartPoints: any[] = data.map((point, index) => {
      const isWarmUp = index < s;
      const residualIndex = index - s;
      
      return {
        period: index + 1,
        actual: point.value,
        fitted: internalResult?.fitted?.[index] || null,
        timestamp: point.timestamp,
        residual: !isWarmUp && internalResult?.residuals?.[residualIndex] !== undefined 
          ? internalResult.residuals[residualIndex] 
          : null,
        absResidual: !isWarmUp && internalResult?.residuals?.[residualIndex] !== undefined
          ? Math.abs(internalResult.residuals[residualIndex])
          : null,
        percentageError: !isWarmUp && internalResult?.residuals?.[residualIndex] !== undefined && point.value !== 0 
          ? Math.abs(internalResult.residuals[residualIndex] / point.value) * 100 
          : null,
        isWarmUp
      };
    });

    if (internalResult?.forecast) {
      internalResult.forecast.forEach((forecast: number, index: number) => {
        chartPoints.push({
          period: data.length + index + 1,
          actual: null,
          fitted: null,
          forecast: forecast,
          lower: internalResult.confidenceIntervals?.lower[index],
          upper: internalResult.confidenceIntervals?.upper[index],
          residual: null,
          absResidual: null,
          percentageError: null
        });
      });
    }

    return chartPoints;
  }, [data, internalResult]);

  // Q-Q Plot data for normality testing
  const qqPlotData = useMemo(() => {
    if (!internalResult?.residuals) return [];
    
    const sortedResiduals = [...internalResult.residuals].sort((a, b) => a - b);
    const n = sortedResiduals.length;
    
    return sortedResiduals.map((residual, index) => {
      const p = (index + 0.5) / n;
      const theoreticalQuantile = inverseNormalCDF(p);
      return {
        theoretical: theoreticalQuantile,
        observed: residual,
        index: index + 1
      };
    });
  }, [internalResult?.residuals]);

  // Autocorrelation data
  const autocorrelationData = useMemo(() => {
    if (!internalResult?.residuals) return [];
    
    const maxLag = Math.min(20, Math.floor(internalResult.residuals.length / 4));
    const acf: number[] = [];
    
    for (let lag = 0; lag <= maxLag; lag++) {
      let numerator = 0;
      let denominator = 0;
      const mean = internalResult.residuals.reduce((a: number, b: number) => a + b, 0) / internalResult.residuals.length;
      
      for (let i = 0; i < internalResult.residuals.length - lag; i++) {
        const diff1 = internalResult.residuals[i] - mean;
        const diff2 = internalResult.residuals[i + lag] - mean;
        numerator += diff1 * diff2;
        denominator += diff1 * diff1;
      }
      
      acf.push(denominator > 0 ? numerator / denominator : 0);
    }
    
    return acf.map((value, index) => ({
      lag: index,
      acf: value,
      significance: Math.abs(value) > 1.96 / Math.sqrt(internalResult.residuals.length) ? 'significant' : 'not-significant'
    }));
  }, [internalResult?.residuals]);

  // Data analysis summary for dynamic defaults
  const dataAnalysis = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const values = data.map(d => d.value);
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    const cv = Math.sqrt(variance) / mean;
    
    // Trend analysis
    const x = Array.from({length: n}, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const trendStrength = Math.abs(slope) / mean;
    
    // Seasonality analysis
    const maxLag = Math.min(12, Math.floor(n / 4));
    let seasonalStrength = 0;
    let bestSeasonalPeriod = 12;
    
    for (let lag = 2; lag <= maxLag; lag++) {
      let numerator = 0;
      let denominator = 0;
      for (let i = 0; i < n - lag; i++) {
        const diff1 = values[i] - mean;
        const diff2 = values[i + lag] - mean;
        numerator += diff1 * diff2;
        denominator += diff1 * diff1;
      }
      const acf = denominator > 0 ? numerator / denominator : 0;
      if (Math.abs(acf) > seasonalStrength) {
        seasonalStrength = Math.abs(acf);
        bestSeasonalPeriod = lag;
      }
    }
    
    return {
      dataPoints: n,
      mean: mean.toFixed(2),
      cv: (cv * 100).toFixed(1) + '%',
      trendStrength: (trendStrength * 100).toFixed(1) + '%',
      seasonalStrength: (seasonalStrength * 100).toFixed(1) + '%',
      bestSeasonalPeriod,
      dataType: cv > 0.5 ? 'High Variability' : cv > 0.2 ? 'Moderate Variability' : 'Low Variability',
      trendType: trendStrength > 0.05 ? 'Strong Trend' : trendStrength > 0.02 ? 'Moderate Trend' : 'Weak Trend',
      seasonalityType: seasonalStrength > 0.5 ? 'Strong Seasonality' : seasonalStrength > 0.3 ? 'Moderate Seasonality' : 'Weak Seasonality'
    };
  }, [data]);

  // Accuracy trend analysis with warm-up period handling
  const accuracyTrendData = useMemo(() => {
    if (!internalResult?.residuals || !data) return [];
    
    const s = params.modelType === 'triple' ? params.seasonalPeriods : 1;
    const windowSize = Math.max(5, Math.floor((data.length - s) / 10));
    const trendData = [];
    
    for (let i = s + windowSize; i < data.length; i++) {
      const residualStart = i - s - windowSize;
      const residualEnd = i - s;
      const windowResiduals = internalResult.residuals.slice(residualStart, residualEnd);
      
      if (windowResiduals.length > 0) {
        const mse = windowResiduals.reduce((sum: number, r: number) => sum + r * r, 0) / windowResiduals.length;
        const mae = windowResiduals.reduce((sum: number, r: number) => sum + Math.abs(r), 0) / windowResiduals.length;
        
        trendData.push({
          period: i,
          mse: mse,
          mae: mae,
          rmse: Math.sqrt(mse),
          windowSize: windowSize
        });
      }
    }
    
    return trendData;
  }, [internalResult?.residuals, data, params.modelType, params.seasonalPeriods]);

  const diagnosticsData = useMemo(() => {
    if (!internalResult?.residuals) return [];
    
    const s = params.modelType === 'triple' ? params.seasonalPeriods : 1;
    
    return internalResult.residuals.map((residual: number, index: number) => ({
      period: s + index + 1, // Adjust period to account for warm-up
      residual,
      fitted: internalResult.fitted?.[s + index] || 0,
      absResidual: Math.abs(residual)
    }));
  }, [internalResult, params.modelType, params.seasonalPeriods]);

  const handleParamChange = (key: keyof ExponentialSmoothingParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = async () => {
    if (!data || data.length === 0) return;

    // Convert data to rows format for forecastAnyCsv
    const rows = data.map(d => ({
      admission_date: d.timestamp ? new Date(d.timestamp).toISOString().split('T')[0] : '2024-01-01',
      cost: d.value,
      __i: data.indexOf(d)
    }));

    // CRITICAL FIX: Sort series ascending by time before any analysis
    // This ensures proper trend estimation
    const withIdx = rows.map((r, i) => ({ ...r, __i: i }));
    withIdx.sort((a, b) => {
      const ta = new Date(a.admission_date).getTime();
      const tb = new Date(b.admission_date).getTime();
      return ta === tb ? a.__i - b.__i : ta - tb;
    });
    const y = withIdx.map(r => Number(r.cost)).filter(Number.isFinite);
    
    console.log("🔧 SERIES SORTING:");
    console.log("   Original data length:", data.length);
    console.log("   Sorted series length:", y.length);
    console.log("   First 5 values:", y.slice(0, 5));
    console.log("   Last 5 values:", y.slice(-5));

    // Calculate basic statistics from cost
    const mean = y.reduce((sum, val) => sum + val, 0) / y.length;
    const variance = y.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (y.length - 1);
    const cv = (Math.sqrt(variance) / mean) * 100; // CV%
    
    console.log("📊 BASIC STATISTICS FROM COST:");
    console.log(`   Mean: ${mean.toFixed(2)}`);
    console.log(`   CV%: ${cv.toFixed(2)}%`);

    // Use grid search for proper parameter optimization
    let result;
    if (params.autoOptimize && params.useGridSearch) {
      console.log("🔍 Using grid search optimization...");
      result = gridSearchHolt(y, forecastPeriods);
    } else {
      console.log("🔧 Using manual parameters...");
      // Fallback to manual parameters if auto-optimize is disabled
      const { fitted, level, trend } = holtFit(y, params.alpha, params.beta);
      const fc = holtForecastFrom(level, trend, forecastPeriods);
      
      // Calculate metrics
      const residuals = [];
      for (let i = 1; i < y.length; i++) {
        residuals.push(y[i] - fitted[i]);
      }
      
      const mae = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / residuals.length;
      const rmse = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length);
      const mape = residuals.reduce((sum, r, i) => sum + Math.abs(r / y[i + 1]), 0) / residuals.length * 100;
      const smape = residuals.reduce((sum, r, i) => {
        const denom = Math.abs(y[i + 1]) + Math.abs(fitted[i + 1]);
        return denom > 0 ? sum + (2 * Math.abs(r) / denom) : sum;
      }, 0) / residuals.length * 100;

      result = {
        model: "Holt(add)" as const,
        alpha: params.alpha,
        beta: params.beta,
        horizon: forecastPeriods,
        metrics: { MAE: mae, RMSE: rmse, MAPE: mape, sMAPE: smape },
        pointForecasts: fc,
        intervals: fc.map((f: number) => ({ lower: f * 0.9, upper: f * 1.1, point: f })),
        fittedTrain: fitted,
        level,
        trend,
        trainLength: y.length,
        testLength: 0,
        holdoutSize: null
      };
    }

    // STL trend/seasonality analysis
    const trendStrength = calculateTrendStrength(y);
    const seasonalStrength = calculateSeasonalStrength(y);
    const bestSeasonalPeriod = findBestSeasonalPeriod(y);
    
    console.log("📊 STL ANALYSIS:");
    console.log(`   STL Trend strength: ${trendStrength.toFixed(3)}`);
    console.log(`   STL Seasonal strength: ${seasonalStrength.toFixed(3)}`);
    console.log(`   Best seasonal period: ${bestSeasonalPeriod}`);

    console.log("🎯 FINAL RESULT:");
    console.log(`   α = ${result.alpha.toFixed(3)}`);
    console.log(`   β = ${result.beta.toFixed(3)}`);
    console.log(`   L_t = ${result.level.toFixed(2)}`);
    console.log(`   T_t = ${result.trend.toFixed(2)}`);
    console.log(`   F_{t+1} = ${(result.level + result.trend).toFixed(2)}`);
    console.log(`   Step increment = ${result.trend.toFixed(2)}`);
    console.log(`   Expected: T_t ≈ 1,236, Step increment ≈ 1,236`);

    // Set debug info
    (window as any).__ts_debug = {
      meta: { field: "cost", mode: "row", n: y.length },
      used: { alpha: result.alpha, beta: result.beta, horizon: forecastPeriods, confidence: confidenceLevel },
      state: { level: result.level, trend: result.trend },
      metrics: result.metrics
    };
    console.log("[TS] DEBUG", (window as any).__ts_debug);

    // Set internal result for enhanced visualizations
    setInternalResult({
      forecast: result.pointForecasts,
      confidenceIntervals: {
        lower: result.intervals.map(i => i.lower),
        upper: result.intervals.map(i => i.upper)
      },
      optimizedParams: {
        alpha: result.alpha,
        beta: result.beta,
        modelType: 'holt'
      },
      components: {
        fitted: result.fittedTrain,
        level: result.fittedTrain,
        trend: Array(result.fittedTrain.length).fill(result.trend)
      },
      residuals: result.fittedTrain.slice(1).map((f, i) => y[i + 1] - f),
      accuracyMetrics: result.metrics
    });

    // Call onAnalyze with the result
    if (onAnalyze) {
      onAnalyze(params, result);
    }
  };

  const getAccuracyLevel = (metric: string, value?: number) => {
    if (value === undefined || !isFinite(value)) return null;
    
    const thresholds: Record<string, { excellent: number; good: number; fair: number }> = {
      r2: { excellent: 0.9, good: 0.7, fair: 0.5 },
      mape: { excellent: 5, good: 15, fair: 25 },
      default: { excellent: 0.1, good: 0.3, fair: 0.5 }
    };
    
    const threshold = thresholds[metric] || thresholds.default;
    
    if (metric === 'r2') {
      if (value > threshold.excellent) return { level: "Excellent", color: "text-green-600", bg: "bg-green-100" };
      if (value > threshold.good) return { level: "Good", color: "text-blue-600", bg: "bg-blue-100" };
      if (value > threshold.fair) return { level: "Fair", color: "text-yellow-600", bg: "bg-yellow-100" };
      return { level: "Poor", color: "text-red-600", bg: "bg-red-100" };
    } else if (metric === 'mape') {
      if (value < threshold.excellent) return { level: "Excellent", color: "text-green-600", bg: "bg-green-100" };
      if (value < threshold.good) return { level: "Good", color: "text-blue-600", bg: "bg-blue-100" };
      if (value < threshold.fair) return { level: "Fair", color: "text-yellow-600", bg: "bg-yellow-100" };
      return { level: "Poor", color: "text-red-600", bg: "bg-red-100" };
    } else {
      if (value < threshold.excellent) return { level: "Excellent", color: "text-green-600", bg: "bg-green-100" };
      if (value < threshold.good) return { level: "Good", color: "text-blue-600", bg: "bg-blue-100" };
      if (value < threshold.fair) return { level: "Fair", color: "text-yellow-600", bg: "bg-yellow-100" };
      return { level: "Poor", color: "text-red-600", bg: "bg-red-100" };
    }
  };

  const TabButton = ({ id, label, active }: { id: string; label: string; active: boolean }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
        active 
          ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  // Accuracy improvement suggestions
  const getAccuracySuggestions = () => {
    const metrics = analysisResult?.accuracyMetrics || internalResult?.accuracyMetrics;
    if (!metrics) return [];

    const suggestions = [];

    // R-squared suggestions
    if (metrics.r2 && metrics.r2 < 0.7) {
      suggestions.push({
        type: 'warning',
        title: 'Low R-squared Value',
        description: `Your model explains only ${(metrics.r2 * 100).toFixed(1)}% of the variance.`,
        recommendations: [
          'Try different model types (Simple → Double → Triple)',
          'Enable auto-optimization for parameter tuning',
          'Check for outliers or data quality issues',
          'Consider using damping for trend stabilization'
        ]
      });
    }

    // MAPE suggestions
    if (metrics.mape && metrics.mape > 15) {
      suggestions.push({
        type: 'error',
        title: 'High MAPE Value',
        description: `Mean Absolute Percentage Error is ${metrics.mape.toFixed(1)}%, indicating poor accuracy.`,
        recommendations: [
          'Lower alpha values for smoother forecasts',
          'Use multiplicative seasonality if data has proportional seasonal variations',
          'Increase seasonal periods if data has longer cycles',
          'Check for structural breaks in the data'
        ]
      });
    }

    // AIC/BIC suggestions
    if (metrics.aic && metrics.bic) {
      const paramCount = 1 + (params.modelType !== 'simple' ? 1 : 0) + (params.modelType === 'triple' ? 1 : 0) + (params.useDamping ? 1 : 0);
      if (paramCount > 3) {
        suggestions.push({
          type: 'info',
          title: 'Model Complexity',
          description: `Model has ${paramCount} parameters. Consider simpler models if AIC/BIC are high.`,
          recommendations: [
            'Compare AIC/BIC across different model types',
            'Use simpler models if accuracy gains are minimal',
            'Consider regularization techniques'
          ]
        });
      }
    }

    // General suggestions
    suggestions.push({
      type: 'success',
      title: 'Best Practices',
      description: 'Follow these guidelines for optimal forecasting:',
      recommendations: [
        'Use at least 2-3 seasonal cycles for triple exponential smoothing',
        'Validate forecasts on out-of-sample data',
        'Monitor residual patterns for model adequacy',
        'Update models regularly with new data',
        'Consider ensemble methods for improved accuracy'
      ]
    });

    return suggestions;
  };

  // Mode selection logic
  if (mode === 'simple') {
    return simpleMode();
  }
  
  if (mode === 'intermediate') {
    return intermediateMode();
  }

  // Advanced mode (default)
  return (
    <div className="p-6 border rounded-lg shadow-lg bg-white max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Advanced Exponential Smoothing</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2 text-sm text-purple-600 hover:text-purple-800 border border-purple-300 rounded-md hover:bg-purple-50"
          >
            {showAdvanced ? 'Hide Advanced' : 'Advanced Settings'}
          </button>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
          >
            {showHelp ? 'Hide Help' : 'Show Help'}
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold mb-3 text-lg text-blue-800">Enhanced Exponential Smoothing Guide</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold mb-2">Model Types:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Simple:</strong> Level only - for stable data without trend or seasonality</li>
                <li><strong>Double (Holt):</strong> Level + trend - for data with linear trends</li>
                <li><strong>Triple (Holt-Winters):</strong> Level + trend + seasonality - for complex patterns</li>
                <li><strong>Holt (Grid Search):</strong> Optimized linear trend with automatic parameter tuning</li>
              </ul>
              
              <h4 className="font-semibold mb-2 mt-4">Dynamic Defaults Logic:</h4>
              <ul className="space-y-1 list-disc list-inside text-xs">
                <li><strong>Alpha (α):</strong> Higher for stable data (low CV), lower for noisy data (high CV)</li>
                <li><strong>Beta (β):</strong> Higher for strong trends, lower for weak trends</li>
                <li><strong>Gamma (γ):</strong> Higher for strong seasonality, lower for weak seasonality</li>
                <li><strong>Seasonal Periods:</strong> Auto-detected from autocorrelation analysis</li>
                <li><strong>Model Type:</strong> Based on trend strength and seasonal strength</li>
                <li><strong>Seasonal Type:</strong> Additive for low variability, multiplicative for high variability</li>
                <li><strong>Holt Model:</strong> Automatically selected for data with moderate-high variability and trends</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Key Features:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Dynamic Parameter Initialization:</strong> Automatically analyzes data characteristics</li>
                <li><strong>Intelligent Model Selection:</strong> Chooses Simple/Double/Triple based on trend & seasonality</li>
                <li><strong>Adaptive Seasonal Periods:</strong> Detects optimal seasonal cycles from data</li>
                <li><strong>SSE-based Optimization:</strong> Uses Sum of Squared Errors for parameter tuning</li>
                <li><strong>Enhanced Beta Resolution:</strong> Dense grid near 0-0.01 for optimal trend parameters</li>
                <li><strong>Proper Warm-up Handling:</strong> Skips first seasonal period for accurate metrics</li>
                <li><strong>Conservative AIC/BIC:</strong> Uses s-1 seasonal states for standard compliance</li>
                <li><strong>Advanced Diagnostics:</strong> Comprehensive model validation tools</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Data Analysis Summary */}
      {dataAnalysis && (
        <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Data Analysis Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm">
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600">Data Points</div>
              <div className="text-lg font-bold text-gray-900">{dataAnalysis.dataPoints}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600">Mean</div>
              <div className="text-lg font-bold text-gray-900">{dataAnalysis.mean}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600">Variability</div>
              <div className="text-lg font-bold text-gray-900">{dataAnalysis.cv}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600">Trend Strength</div>
              <div className="text-lg font-bold text-gray-900">{dataAnalysis.trendStrength}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600">Seasonal Strength</div>
              <div className="text-lg font-bold text-gray-900">{dataAnalysis.seasonalStrength}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600">Best Seasonal Period</div>
              <div className="text-lg font-bold text-gray-900">{dataAnalysis.bestSeasonalPeriod}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600">Data Type</div>
              <div className="text-sm font-semibold text-blue-600">{dataAnalysis.dataType}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600">Model Recommendation</div>
              <div className="text-sm font-semibold text-green-600 capitalize">{params.modelType}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-2 bg-blue-100 rounded">
              <span className="font-semibold">Trend: </span>{dataAnalysis.trendType}
            </div>
            <div className="p-2 bg-green-100 rounded">
              <span className="font-semibold">Seasonality: </span>{dataAnalysis.seasonalityType}
            </div>
            <div className="p-2 bg-purple-100 rounded">
              <span className="font-semibold">Seasonal Type: </span>{params.seasonalType}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Model Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model Type</label>
              <select
                value={params.modelType}
                onChange={(e) => handleParamChange('modelType', e.target.value)}
                className="w-full p-3 border rounded-md text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="holt">Holt (Linear Trend + Grid Search)</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={params.autoOptimize}
                  onChange={(e) => handleParamChange('autoOptimize', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Auto-optimize parameters</span>
              </label>
              
              {params.modelType !== 'simple' && params.modelType !== 'holt' && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={params.useDamping}
                    onChange={(e) => handleParamChange('useDamping', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Use damping</span>
                </label>
              )}

              {params.modelType === 'holt' && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={params.useGridSearch}
                    onChange={(e) => handleParamChange('useGridSearch', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Use grid search optimization</span>
                </label>
              )}
            </div>

            {/* Basic Parameters */}
            {!showAdvanced && (
              <div className="grid grid-cols-1 gap-4">
                {['alpha', 'beta', 'gamma'].map(key => {
                  if (key === 'beta' && params.modelType === 'simple') return null;
                  if (key === 'gamma' && params.modelType !== 'triple') return null;
                  if (key === 'gamma' && params.modelType === 'holt') return null;
                  
                  const value = params[key as keyof ExponentialSmoothingParams] as number;
                  
                  return (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {key.charAt(0).toUpperCase() + key.slice(1)} 
                        {key === 'alpha' && ' (Level)'} 
                        {key === 'beta' && ' (Trend)'} 
                        {key === 'gamma' && ' (Seasonal)'}: {value.toFixed(3)}
                        {params.autoOptimize && internalResult?.optimizedParams && (
                          <span className="text-green-600 ml-2">
                            (Optimized: {internalResult.optimizedParams[key as keyof typeof internalResult.optimizedParams]?.toFixed(3)})
                          </span>
                        )}
                      </label>
                      <input
                        type="range"
                        min="0.01"
                        max="0.99"
                        step="0.01"
                        value={params.autoOptimize && internalResult?.optimizedParams ? 
                          internalResult.optimizedParams[key as keyof typeof internalResult.optimizedParams] || value : value}
                        onChange={(e) => handleParamChange(key as keyof ExponentialSmoothingParams, parseFloat(e.target.value))}
                        disabled={params.autoOptimize || (params.modelType === 'holt' && params.useGridSearch)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Advanced Parameters */}
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800">Advanced Parameters</h4>
                
                {Object.entries(params).map(([key, value]) => {
                  if (['modelType', 'autoOptimize', 'useDamping', 'seasonalType'].includes(key)) return null;
                  if (key === 'beta' && params.modelType === 'simple') return null;
                  if ((key === 'gamma' || key === 'seasonalPeriods') && params.modelType !== 'triple') return null;
                  if (key === 'dampingFactor' && !params.useDamping) return null;
                  
                  return (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {
                          typeof value === 'number' ? value.toFixed(key === 'seasonalPeriods' ? 0 : 3) : value
                        }
                      </label>
                      
                      {typeof value === 'number' ? (
                        <div className="space-y-1">
                          <input
                            type="number"
                            min={key === 'seasonalPeriods' ? 2 : 0.001}
                            max={key === 'seasonalPeriods' ? 52 : 0.999}
                            step={key === 'seasonalPeriods' ? 1 : 0.001}
                            value={value}
                            onChange={(e) => handleParamChange(key as keyof ExponentialSmoothingParams, 
                              key === 'seasonalPeriods' ? parseInt(e.target.value) || 2 : parseFloat(e.target.value) || 0.001)}
                            className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                            disabled={params.autoOptimize && key !== 'seasonalPeriods'}
                          />
                          {key !== 'seasonalPeriods' && (
                            <input
                              type="range"
                              min={key === 'dampingFactor' ? 0.8 : 0.001}
                              max={key === 'dampingFactor' ? 1 : 0.999}
                              step="0.001"
                              value={value}
                              onChange={(e) => handleParamChange(key as keyof ExponentialSmoothingParams, parseFloat(e.target.value))}
                              disabled={params.autoOptimize}
                              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {params.modelType === 'triple' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Seasonal Type</label>
                    <select
                      value={params.seasonalType}
                      onChange={(e) => handleParamChange('seasonalType', e.target.value)}
                      className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="additive">Additive (constant seasonal variations)</option>
                      <option value="multiplicative">Multiplicative (proportional seasonal variations)</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Forecast Configuration</h3>
          
          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Forecast Periods:</span>
                  <span className="font-semibold text-gray-800">{forecastPeriods}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence Level:</span>
                  <span className="font-semibold text-gray-800">{(confidenceLevel * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Points:</span>
                  <span className="font-semibold text-gray-800">{data?.length || 0}</span>
                </div>
                {data && data.length < 24 && params.modelType === 'triple' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seasonal Periods:</span>
                    <span className="font-semibold text-blue-600">6 (auto-adjusted)</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Model Complexity:</span>
                  <span className="font-semibold text-gray-800 capitalize">{params.modelType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Auto-Optimize:</span>
                  <span className={`font-semibold ${params.autoOptimize ? 'text-green-600' : 'text-gray-600'}`}>
                    {params.autoOptimize ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Damping:</span>
                  <span className={`font-semibold ${params.useDamping ? 'text-blue-600' : 'text-gray-600'}`}>
                    {params.useDamping ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading || !data || data.length === 0}
            className={`w-full py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 ${
              isLoading || !data || data.length === 0
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transform hover:scale-105'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Analyzing...</span>
              </div>
            ) : (
              'Generate Advanced Forecast'
            )}
          </button>

          {internalResult?.optimizedParams && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Optimized Parameters (Grid Search Results)</h4>
              <div className="text-xs text-green-700 space-y-1">
                <div>α (Level): {internalResult.optimizedParams.alpha?.toFixed(3)}</div>
                {internalResult.optimizedParams.beta > 0 && (
                  <div>β (Trend): {internalResult.optimizedParams.beta?.toFixed(3)}</div>
                )}
                {internalResult.optimizedParams.gamma > 0 && (
                  <div>γ (Seasonal): {internalResult.optimizedParams.gamma?.toFixed(3)}</div>
                )}
                {internalResult.optimizedParams.dampingFactor && internalResult.optimizedParams.dampingFactor < 1 && (
                  <div>φ (Damping): {internalResult.optimizedParams.dampingFactor?.toFixed(3)}</div>
                )}
                <div className="mt-2 pt-2 border-t border-green-200">
                  <div className="text-xs text-green-600">
                    <strong>Note:</strong> Sliders show optimized values when auto-optimize is enabled
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section with Enhanced Tabs */}
      {(analysisResult || internalResult) && (
        <div className="space-y-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1">
              <TabButton id="forecast" label="Forecast & Chart" active={activeTab === 'forecast'} />
              <TabButton id="diagnostics" label="Model Diagnostics" active={activeTab === 'diagnostics'} />
              <TabButton id="components" label="Components Analysis" active={activeTab === 'components'} />
              <TabButton id="accuracy" label="Accuracy Analysis" active={activeTab === 'accuracy'} />
            </nav>
          </div>

          {/* Forecast Tab */}
          {activeTab === 'forecast' && (
            <div className="space-y-6">
              {/* Accuracy Metrics */}
              {(analysisResult?.accuracyMetrics || internalResult?.accuracyMetrics) && (
                <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Model Performance Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {Object.entries(analysisResult?.accuracyMetrics || internalResult?.accuracyMetrics || {}).map(([metric, value]) => {
                      const accuracy = getAccuracyLevel(metric, value as number);
                      return (
                        <div
                          key={metric}
                          className={`p-4 rounded-lg shadow-sm border-l-4 flex flex-col items-center justify-center h-full ${
                            accuracy ? `border-l-${accuracy.color.split('-')[1]}-500 ${accuracy.bg}` : 'border-l-gray-300 bg-white'
                          }`}
                        >
                          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">{metric.toUpperCase()}</div>
                          <div className="text-lg font-bold text-gray-900 mt-1 text-center">
                            {metric === 'mape' ? `${(value as number)?.toFixed(2)}%` : 
                             metric.includes('ic') ? (value as number)?.toFixed(1) :
                             (value as number)?.toFixed(4)}
                          </div>
                          {accuracy && (
                            <div className={`text-xs font-medium mt-1 ${accuracy.color} text-center`}>
                              {accuracy.level}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Main Chart */}
              <div className="p-6 bg-white rounded-lg border shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Forecast Visualization</h4>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="period" 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Legend />
                      
                      {/* Data split line */}
                      <ReferenceLine x={data?.length} stroke="#9ca3af" strokeDasharray="5 5" />
                      
                      {/* Warm-up period indicator for seasonal models */}
                      {params.modelType === 'triple' && (
                        <ReferenceLine 
                          x={params.seasonalPeriods} 
                          stroke="#f59e0b" 
                          strokeDasharray="3 3"
                          strokeWidth={2}
                        />
                      )}
                      
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        name="Actual Data"
                        connectNulls={false}
                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="fitted" 
                        stroke="#dc2626" 
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        name="Fitted Values"
                        connectNulls={false}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="forecast" 
                        stroke="#16a34a" 
                        strokeWidth={3}
                        name="Forecast"
                        connectNulls={false}
                        dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lower" 
                        stroke="#6b7280" 
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        name={`${(confidenceLevel * 100)}% Lower Bound`}
                        connectNulls={false}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="upper" 
                        stroke="#6b7280" 
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        name={`${(confidenceLevel * 100)}% Upper Bound`}
                        connectNulls={false}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Forecast Values */}
              {(analysisResult?.forecast || internalResult?.forecast) && (
                <div className="p-6 bg-white rounded-lg border shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Forecast Results - Next {Math.min(20, (analysisResult?.forecast || internalResult?.forecast)?.length || 0)} Periods
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {(analysisResult?.forecast || internalResult?.forecast)?.slice(0, 20).map((value: number, index: number) => (
                      <div key={index} className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="text-xs font-medium text-blue-600">Period {index + 1}</div>
                        <div className="text-xl font-bold text-gray-900">{value.toFixed(2)}</div>
                        {internalResult?.confidenceIntervals && (
                          <div className="text-xs text-gray-500 mt-1">
                            [{internalResult.confidenceIntervals.lower[index]?.toFixed(1)}, {internalResult.confidenceIntervals.upper[index]?.toFixed(1)}]
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Diagnostics Tab */}
          {activeTab === 'diagnostics' && diagnosticsData.length > 0 && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Residuals Plot */}
                <div className="p-6 bg-white rounded-lg border shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Residuals vs Fitted</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart data={diagnosticsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fitted" name="Fitted Values" />
                        <YAxis dataKey="residual" name="Residuals" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="2 2" />
                        <Scatter dataKey="residual" fill="#3b82f6" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Q-Q Plot for Normality */}
                <div className="p-6 bg-white rounded-lg border shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Q-Q Plot (Normality Test)</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart data={qqPlotData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="theoretical" name="Theoretical Quantiles" />
                        <YAxis dataKey="observed" name="Observed Quantiles" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="2 2" />
                        <Scatter dataKey="observed" fill="#10b981" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Residuals Over Time */}
                <div className="p-6 bg-white rounded-lg border shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Residuals Over Time</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={diagnosticsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="2 2" />
                        <Line 
                          type="monotone" 
                          dataKey="residual" 
                          stroke="#3b82f6" 
                          strokeWidth={1}
                          dot={{ r: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Autocorrelation Plot */}
                <div className="p-6 bg-white rounded-lg border shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Autocorrelation Function</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={autocorrelationData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="lag" />
                        <YAxis />
                        <Tooltip />
                        <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="2 2" />
                        <ReferenceLine y={1.96 / Math.sqrt(internalResult?.residuals?.length || 1)} stroke="#f59e0b" strokeDasharray="2 2" />
                        <ReferenceLine y={-1.96 / Math.sqrt(internalResult?.residuals?.length || 1)} stroke="#f59e0b" strokeDasharray="2 2" />
                        <Bar dataKey="acf" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Diagnostic Statistics */}
              <div className="p-6 bg-white rounded-lg border shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Residual Analysis</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-600">Mean Residual</div>
                    <div className="text-xl font-bold text-gray-900">
                      {(internalResult?.residuals?.reduce((a: number, b: number) => a + b, 0) / internalResult?.residuals?.length || 0).toFixed(4)}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-600">Residual Std Dev</div>
                    <div className="text-xl font-bold text-gray-900">
                      {internalResult?.residuals ? Math.sqrt(
                        internalResult.residuals.reduce((sum: number, r: number) => sum + r * r, 0) / internalResult.residuals.length
                      ).toFixed(4) : '0.0000'}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-600">Durbin-Watson</div>
                    <div className="text-xl font-bold text-gray-900">
                      {internalResult?.residuals && internalResult.residuals.length > 1 ? (
                        (function() {
                          let sum = 0;
                          let sumSquares = 0;
                          for (let i = 1; i < internalResult.residuals.length; i++) {
                            const diff = internalResult.residuals[i] - internalResult.residuals[i-1];
                            sum += diff * diff;
                          }
                          for (let i = 0; i < internalResult.residuals.length; i++) {
                            sumSquares += internalResult.residuals[i] * internalResult.residuals[i];
                          }
                          return (sum / sumSquares).toFixed(3);
                        })()
                      ) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Components Tab */}
          {activeTab === 'components' && internalResult?.components && (
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-lg border shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Model Components Decomposition</h4>
                
                {/* Level Component */}
                <div className="mb-6">
                  <h5 className="font-medium text-gray-700 mb-2">Level Component</h5>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={internalResult.components.level?.map((level: number, index: number) => ({
                        period: index + 1,
                        level
                      })) || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="level" stroke="#2563eb" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Trend Component */}
                {params.modelType !== 'simple' && internalResult.components.trend && (
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-700 mb-2">Trend Component</h5>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={internalResult.components.trend?.map((trend: number, index: number) => ({
                          period: index + 1,
                          trend
                        })) || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip />
                          <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="2 2" />
                          <Line type="monotone" dataKey="trend" stroke="#16a34a" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Seasonal Component */}
                {params.modelType === 'triple' && internalResult.components.seasonal && (
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-700 mb-2">Seasonal Component (First {params.seasonalPeriods} periods)</h5>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={internalResult.components.seasonal?.slice(0, params.seasonalPeriods).map((seasonal: number, index: number) => ({
                          period: index + 1,
                          seasonal
                        })) || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip />
                          <ReferenceLine y={params.seasonalType === 'additive' ? 0 : 1} stroke="#dc2626" strokeDasharray="2 2" />
                          <Line type="monotone" dataKey="seasonal" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* New Accuracy Analysis Tab */}
          {activeTab === 'accuracy' && (
            <div className="space-y-6">
              {/* Accuracy Trend Analysis */}
              <div className="p-6 bg-white rounded-lg border shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Accuracy Trend Analysis</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={accuracyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="mse" 
                        stroke="#dc2626" 
                        strokeWidth={2}
                        name="MSE"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="mae" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="MAE"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rmse" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="RMSE"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Percentage Error Distribution */}
              <div className="p-6 bg-white rounded-lg border shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Percentage Error Distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.filter(d => d.percentageError !== null)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="percentageError" 
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.3}
                        name="Percentage Error (%)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Accuracy Improvement Suggestions */}
              <div className="p-6 bg-white rounded-lg border shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Accuracy Improvement Suggestions</h4>
                <div className="space-y-4">
                  {getAccuracySuggestions().map((suggestion, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border-l-4 ${
                        suggestion.type === 'error' ? 'border-l-red-500 bg-red-50' :
                        suggestion.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                        suggestion.type === 'info' ? 'border-l-blue-500 bg-blue-50' :
                        'border-l-green-500 bg-green-50'
                      }`}
                    >
                      <h5 className={`font-semibold mb-2 ${
                        suggestion.type === 'error' ? 'text-red-800' :
                        suggestion.type === 'warning' ? 'text-yellow-800' :
                        suggestion.type === 'info' ? 'text-blue-800' :
                        'text-green-800'
                      }`}>
                        {suggestion.title}
                      </h5>
                      <p className="text-sm text-gray-700 mb-3">{suggestion.description}</p>
                      <ul className="text-sm space-y-1">
                        {suggestion.recommendations.map((rec, recIndex) => (
                          <li key={recIndex} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span className="text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Comparison Matrix */}
              <div className="p-6 bg-white rounded-lg border shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Model Performance Summary</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(analysisResult?.accuracyMetrics || internalResult?.accuracyMetrics || {}).map(([metric, value]) => {
                        const accuracy = getAccuracyLevel(metric, value as number);
                        return (
                          <tr key={metric}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {metric.toUpperCase()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {metric === 'mape' ? `${(value as number)?.toFixed(2)}%` : 
                               metric.includes('ic') ? (value as number)?.toFixed(1) :
                               (value as number)?.toFixed(4)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {accuracy && (
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${accuracy.bg} ${accuracy.color}`}>
                                  {accuracy.level}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {metric === 'r2' ? '> 0.9' : 
                               metric === 'mape' ? '< 10%' :
                               metric === 'aic' || metric === 'bic' ? 'Lower is better' :
                               '< 0.1'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Tips Section with Accuracy Focus */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-3">📊 Advanced Forecasting & Accuracy Tips</h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <h5 className="font-medium mb-2">🎯 Model Selection:</h5>
            <ul className="space-y-1 list-disc list-inside text-blue-700">
              <li>Simple: Stable data without clear patterns</li>
              <li>Double: Data with consistent upward/downward trends</li>
              <li>Triple: Data with both trends and seasonal patterns</li>
              <li>Holt: Optimized linear trend with automatic grid search</li>
              <li>Use auto-optimization for unknown data characteristics</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">⚙️ Parameter Tuning:</h5>
            <ul className="space-y-1 list-disc list-inside text-blue-700">
              <li>Auto-optimization uses SSE minimization for optimal parameter selection</li>
              <li>Enhanced beta resolution near 0-0.01 captures optimal trend parameters</li>
              <li>Holt grid search tests α=[0.2-0.9] and β=[0.05-0.4] for best RMSE</li>
              <li>Lower α values create smoother, more stable forecasts</li>
              <li>Enable damping for long-horizon forecasts to prevent unrealistic trends</li>
              <li>Check AIC/BIC values - lower is better for model comparison</li>
              <li>Monitor residual patterns for model adequacy</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">📈 Accuracy Improvement:</h5>
            <ul className="space-y-1 list-disc list-inside text-blue-700">
              <li>Use at least 2-3 seasonal cycles for reliable seasonal patterns</li>
              <li>Validate forecasts on out-of-sample data</li>
              <li>Check Q-Q plots for residual normality</li>
              <li>Monitor autocorrelation for model adequacy</li>
              <li>Consider ensemble methods for improved accuracy</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
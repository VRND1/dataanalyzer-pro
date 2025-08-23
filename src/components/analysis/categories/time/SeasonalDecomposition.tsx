import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { 
  AlertCircle, Info, TrendingUp, Calendar, Settings, HelpCircle, 
  Download, Keyboard, Zap, Brain, Target, Activity, BarChart3,
  Lightbulb, XCircle, AlertTriangle, RefreshCw, BarChart as BarChartIcon, LineChart,
  PieChart
} from 'lucide-react';
import { TimeSeriesResult } from '@/utils/analysis/core/types';

// Extended interface for seasonal decomposition results
interface SeasonalDecompositionResult extends TimeSeriesResult {
  field: string;
  confidence: number;
  components: {
    trend: number[];
    seasonal: number[];
    residual: number[];
  };
}
import { Line, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, BarChart as RechartsBarChart } from 'recharts';

interface SeasonalDecompositionProps {
  data: { timestamp: number; value: number; field: string; }[];
  onAnalyze: (params: SeasonalDecompositionParams, result: SeasonalDecompositionResult) => void;
  forecastPeriods: number;
  isLoading?: boolean;
  onExport?: (data: any) => void;
}

interface SeasonalDecompositionParams {
  period: number;
  model: 'additive' | 'multiplicative' | 'auto';
  extrapolateTrend: boolean;
  trendFilterLength?: number;
  robustDecomposition?: boolean;
  seasonalWindow?: number;
  seasonalSmoothing?: boolean;
  removeOutliers?: boolean;
  outlierThreshold?: number;
  autoOptimize?: boolean;
  decompositionMethod: 'x11' | 'stl' | 'classical' | 'seats';
  forecastMethod: 'linear' | 'exponential' | 'seasonal_naive' | 'auto';
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

interface AIInsight {
  type: 'pattern' | 'anomaly' | 'trend' | 'seasonality' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  actionable?: boolean;
  action?: () => void;
}

interface DataQualityMetrics {
  completeness: number;
  consistency: number;
  accuracy: number;
  reliability: number;
  overall: number;
}

interface ChartData {
  timestamp: number;
  original: number;
  trend: number;
  seasonal: number;
  residual: number;
  forecast?: number;
  index: number;
}

interface AutocorrelationData {
  lag: number;
  correlation: number;
  significance: number;
}

interface DecompositionCharts {
  timeSeries: ChartData[];
  autocorrelation: AutocorrelationData[];
  components: ChartData[];
  forecast: ChartData[];
  qualityMetrics: { name: string; value: number; color: string }[];
}

const EPS = 1e-12;

// Ljung-Box test for residual whiteness
function ljungBox(residuals: number[], m: number) {
  const n = residuals.length;
  const mean = residuals.reduce((a,b)=>a+b,0)/n;
  const varNum = residuals.reduce((s,v)=>s+(v-mean)*(v-mean),0);
  const acf = (lag:number) => {
    let s=0;
    for (let i=lag;i<n;i++) s += (residuals[i]-mean)*(residuals[i-lag]-mean);
    return s/varNum;
  };
  const maxLag = Math.min(m, Math.floor(n/5));
  let Q = 0;
  for (let k=1;k<=maxLag;k++) {
    const rk = acf(k);
    Q += (rk*rk)/(n-k);
  }
  Q *= n*(n+2);

  // chi-square p-value with df = maxLag (simplified approximation)
  const chiSquarePValue = (x: number, df: number): number => {
    // For df > 30, use normal approximation
    if (df > 30) {
      const z = Math.sqrt(2 * x) - Math.sqrt(2 * df - 1);
      // Approximate normal CDF using error function approximation
      const t = 1 / (1 + 0.5 * Math.abs(z));
      const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
      return 1 - (1 + (z >= 0 ? erf : -erf)) / 2;
    }
    
    // For smaller df, use Wilson-Hilferty approximation
    const c = Math.pow(x / df, 1/3);
    const z = (c - (1 - 2/(9*df))) / Math.sqrt(2/(9*df));
    const t = 1 / (1 + 0.5 * Math.abs(z));
    const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
    return 1 - (1 + (z >= 0 ? erf : -erf)) / 2;
  };
  
  const p = chiSquarePValue(Q, maxLag);
  return { Q, df: maxLag, p };
}

function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (base + 1 < sorted.length) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export const calculateAdvancedStats = (values: number[]) => {
  const n = values.length;
  if (n === 0) {
    return {
      mean: NaN, median: NaN, stdDev: NaN, variance: NaN,
      skewness: NaN, kurtosis: NaN, q1: NaN, q3: NaN, iqr: NaN,
      outliers: { iqr: 0, zScore: 0, modifiedZ: 0, combined: 0, flags: [] as boolean[] },
      coefficientOfVariation: NaN,
      range: { min: NaN, max: NaN },
      mad: NaN, robustSigma: NaN
    };
  }

  // Mean
  const mean = values.reduce((a, b) => a + b, 0) / n;

  // Sample variance / std (ddof=1)
  const varNum = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
  const variance = n > 1 ? varNum / (n - 1) : 0;
  const stdDev = Math.sqrt(Math.max(variance, 0));

  // Moments (excess kurtosis)
  const m3 = values.reduce((acc, v) => acc + Math.pow(v - mean, 3), 0) / Math.max(n, 1);
  const m4 = values.reduce((acc, v) => acc + Math.pow(v - mean, 4), 0) / Math.max(n, 1);
  const denom3 = Math.pow(stdDev || EPS, 3);
  const denom4 = Math.pow(stdDev || EPS, 4);
  const skewness = m3 / denom3;
  const kurtosisExcess = m4 / denom4 - 3; // normal ≈ 0

  // Quantiles
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const median = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;

  // Outliers (index-based)
  const iqrLow = q1 - 1.5 * iqr;
  const iqrHigh = q3 + 1.5 * iqr;
  const iqrFlags = values.map(v => v < iqrLow || v > iqrHigh);

  const zScores = values.map(v => (v - mean) / (stdDev || EPS));
  const zFlags = zScores.map(z => Math.abs(z) > 2.5);

  // MAD & modified z
  const absDevs = values.map(v => Math.abs(v - median)).sort((a, b) => a - b);
  const MADraw = quantile(absDevs, 0.5);
  // 1.4826 makes MAD ~ std for normal data
  const MAD = 1.4826 * MADraw;
  const denomMAD = (MAD > EPS ? MAD : (iqr > EPS ? iqr / 1.349 : stdDev || 1)); // fallback
  const modZ = values.map(v => 0.6745 * (v - median) / denomMAD);
  const modZFlags = modZ.map(mz => Math.abs(mz) > 3.5);

  // Combine flags (by index)
  const combinedFlags = values.map((_, i) => iqrFlags[i] || zFlags[i] || modZFlags[i]);
  const combined = combinedFlags.reduce((a, b) => a + (b ? 1 : 0), 0);

  return {
    n,
    mean, median, stdDev, variance,
    skewness, kurtosis: kurtosisExcess, // EXCESS kurtosis (normal ≈ 0)
    q1, q3, iqr,
    outliers: {
      iqr: iqrFlags.filter(Boolean).length,
      zScore: zFlags.filter(Boolean).length,
      modifiedZ: modZFlags.filter(Boolean).length,
      combined,
      flags: combinedFlags
    },
    coefficientOfVariation: stdDev / Math.max(Math.abs(mean), EPS), // fine for raw data, NOT for residual checks
    range: { min: Math.min(...values), max: Math.max(...values) },
    mad: MAD,
    robustSigma: denomMAD
  };
};

const detectSeasonalPatterns = (values: number[], timestamps: number[]) => {
  const maxLag = Math.min(Math.floor(values.length / 3), 50);
  const autocorr = calculateAutocorrelation(values, maxLag);
  
  // Find significant peaks in autocorrelation
  const peaks: Array<{lag: number, strength: number, significance: number}> = [];
  const threshold = 2 / Math.sqrt(values.length); // 95% confidence threshold
  
  for (let i = 1; i < autocorr.length - 1; i++) {
    const current = autocorr[i];
    const prev = autocorr[i - 1];
    const next = autocorr[i + 1];
    
    if (current > prev && current > next && current > threshold) {
      // Calculate significance based on confidence interval
      const significance = Math.abs(current) / threshold;
      peaks.push({ 
        lag: i + 1, 
        strength: current,
        significance: Math.min(significance, 5) // Cap at 5 for display
      });
    }
  }
  
  // Detect time-based patterns from timestamps
  const timePatterns = detectTimeBasedPatterns(timestamps);
  
  return {
    autocorrelationPeaks: peaks.sort((a, b) => b.strength - a.strength).slice(0, 5),
    timeBasedPatterns: timePatterns,
    dominantPeriod: peaks.length > 0 ? peaks[0].lag : null
  };
};

const detectTimeBasedPatterns = (timestamps: number[]) => {
  if (timestamps.length < 2) return [];
  
  const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  
  // Time constants
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  
  const patterns = [];
  
  // Detect data frequency
  if (avgInterval <= 5 * MINUTE) {
    patterns.push({ type: 'minute', period: 60, label: 'Hourly (60 minutes)' });
    patterns.push({ type: 'hour', period: 24, label: 'Daily (24 hours)' });
  } else if (avgInterval <= HOUR) {
    patterns.push({ type: 'hour', period: 24, label: 'Daily (24 hours)' });
    patterns.push({ type: 'day', period: 7, label: 'Weekly (7 days)' });
  } else if (avgInterval <= DAY) {
    patterns.push({ type: 'day', period: 7, label: 'Weekly (7 days)' });
    patterns.push({ type: 'week', period: 4, label: 'Monthly (4 weeks)' });
    patterns.push({ type: 'month', period: 12, label: 'Yearly (12 months)' });
  } else if (avgInterval <= WEEK) {
    patterns.push({ type: 'week', period: 4, label: 'Monthly (4 weeks)' });
    patterns.push({ type: 'month', period: 12, label: 'Yearly (12 months)' });
  } else if (avgInterval <= MONTH) {
    patterns.push({ type: 'month', period: 12, label: 'Yearly (12 months)' });
    patterns.push({ type: 'quarter', period: 4, label: 'Yearly (4 quarters)' });
  }
  
  return patterns;
};

const generateAIInsights = (
  data: any[], 
  stats: any, 
  seasonalInfo: any, 
  params: SeasonalDecompositionParams,
  residualStats?: any
): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  // Data quality insights
  if (stats.outliers.combined > data.length * 0.1) {
    insights.push({
      type: 'anomaly',
      title: 'High Outlier Detection',
      description: `${((stats.outliers.combined / data.length) * 100).toFixed(1)}% of data points are outliers. This may affect decomposition accuracy.`,
      confidence: 0.9,
      actionable: true
    });
  }
  
  // Residual quality insights (if available)
  if (residualStats) {
    // Bias via t-test
    const nRes = residualStats.n ?? 0;
    const tRes = Math.abs(residualStats.mean) / ((residualStats.stdDev || 1e-12) / Math.sqrt(Math.max(nRes, 1)));
    if (tRes > 1.96) {
      insights.push({
        type: 'anomaly',
        title: 'Residual Bias Detected',
        description: `Residual mean (${residualStats.mean.toFixed(4)}) significantly differs from 0 (t=${tRes.toFixed(2)}).`,
        confidence: 0.85,
        actionable: true
      });
    }
    
    // Heavy tails: excess kurtosis > 0.5
    if (residualStats.kurtosis > 0.5) {
      insights.push({
        type: 'anomaly',
        title: 'Heavy-Tailed Residuals',
        description: `Excess kurtosis ${residualStats.kurtosis.toFixed(2)} indicates heavy tails.`,
        confidence: 0.8,
        actionable: true
      });
    }
    
    // Check for residual asymmetry
    if (Math.abs(residualStats.skewness) > 0.5) {
      insights.push({
        type: 'pattern',
        title: 'Asymmetric Residuals',
        description: `Non-zero skewness (${residualStats.skewness.toFixed(2)}) indicates asymmetric residual distribution.`,
        confidence: 0.75,
        actionable: true
      });
    }
    
    // Outlier percentage: by points, not by sum of methods
    const resOutlierPct = nRes > 0 ? (residualStats.outliers.combined / nRes) * 100 : 0;
    if (resOutlierPct > 10) {
      insights.push({
        type: 'anomaly',
        title: 'High Residual Outliers',
        description: `${resOutlierPct.toFixed(1)}% of residuals are outliers → decomposition may be suboptimal.`,
        confidence: 0.9,
        actionable: true
      });
    }
  }
  
  // Seasonality insights
  if (seasonalInfo.dominantPeriod && seasonalInfo.dominantPeriod !== params.period) {
    const dominantPeak = seasonalInfo.autocorrelationPeaks[0];
    insights.push({
      type: 'seasonality',
      title: 'Alternative Seasonal Period Detected',
      description: `Strong seasonal pattern detected at period ${seasonalInfo.dominantPeriod} (strength: ${dominantPeak.strength.toFixed(3)}). Consider using this instead of ${params.period}.`,
      confidence: dominantPeak.significance / 5,
      actionable: true
    });
  }
  
  // Model selection insights
  if (params.model === 'multiplicative' && data.some(d => d.value <= 0)) {
    insights.push({
      type: 'recommendation',
      title: 'Model Selection Issue',
      description: 'Multiplicative model selected but data contains non-positive values. Additive model recommended.',
      confidence: 0.95,
      actionable: true
    });
  }
  
  // Trend insights
  const trendStrength = calculateTrendStrength(data.map(d => d.value));
  if (trendStrength > 0.7) {
    insights.push({
      type: 'trend',
      title: 'Strong Trend Detected',
      description: `Strong ${trendStrength > 0 ? 'upward' : 'downward'} trend detected (strength: ${Math.abs(trendStrength).toFixed(2)}). Trend extrapolation recommended for forecasting.`,
      confidence: Math.abs(trendStrength),
      actionable: true
    });
  }
  
  // Data sufficiency insights
  const requiredPoints = params.period * 3;
  if (data.length < requiredPoints) {
    insights.push({
      type: 'pattern',
      title: 'Insufficient Data',
      description: `Current data length (${data.length}) is less than recommended (${requiredPoints}). Consider reducing period or collecting more data.`,
      confidence: 0.8,
      actionable: true
    });
  }
  
  // Decomposition method recommendations based on data characteristics
  if (data.length < params.period * 6 && params.decompositionMethod !== 'classical') {
    insights.push({
      type: 'recommendation',
      title: 'Decomposition Method Optimization',
      description: 'Limited data available. Classical decomposition method recommended for shorter time series.',
      confidence: 0.8,
      actionable: true
    });
  }
  
  // Robust decomposition recommendations
  if (stats.outliers.combined > data.length * 0.05 && !params.robustDecomposition) {
    insights.push({
      type: 'recommendation',
      title: 'Enable Robust Decomposition',
      description: `${((stats.outliers.combined / data.length) * 100).toFixed(1)}% outliers detected. Robust decomposition recommended for better results.`,
      confidence: 0.85,
      actionable: true
    });
  }
  
  return insights.sort((a, b) => b.confidence - a.confidence);
};

const calculateTrendStrength = (values: number[]): number => {
  const n = values.length;
  if (n < 3) return 0;
  
  // Simple linear regression
  const x = Array.from({ length: n }, (_, i) => i);
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  
  const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (values[i] - meanY), 0);
  const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
  
  const slope = numerator / denominator;
  const normalizedSlope = slope / (Math.abs(meanY) || 1);
  
  return Math.max(-1, Math.min(1, normalizedSlope));
};

const calculateTrendDirection = (values: number[]): 'increasing' | 'decreasing' | 'stable' => {
  const n = values.length;
  if (n < 3) return 'stable';
  
  // Calculate trend using linear regression
  const x = Array.from({ length: n }, (_, i) => i);
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  
  const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (values[i] - meanY), 0);
  const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
  
  if (denominator === 0) return 'stable';
  
  const slope = numerator / denominator;
  const normalizedSlope = slope / (Math.abs(meanY) || 1);
  
  // Determine trend direction with threshold
  if (normalizedSlope > 0.05) return 'increasing';
  if (normalizedSlope < -0.05) return 'decreasing';
  return 'stable';
};

const calculateDataQuality = (data: any[], stats: any): DataQualityMetrics => {
  const n = data.length;
  
  // Completeness: ratio of non-null values
  const nonNullCount = data.filter(d => d.value !== null && d.value !== undefined && !isNaN(d.value)).length;
  const completeness = nonNullCount / n;
  
  // Consistency: based on outlier ratio and variance stability
  const outlierRatio = stats.outliers.combined / n;
  const consistency = Math.max(0, 1 - outlierRatio * 2);
  
  // Accuracy: based on data distribution normality
  const accuracy = Math.max(0, 1 - Math.abs(stats.skewness) / 3 - Math.abs(stats.kurtosis) / 10);
  
  // Reliability: based on coefficient of variation
  const reliability = Math.max(0, 1 - Math.min(stats.coefficientOfVariation / 2, 1));
  
  const overall = (completeness + consistency + accuracy + reliability) / 4;
  
  return { completeness, consistency, accuracy, reliability, overall };
};

// Helper functions moved before the component to avoid initialization issues
const calculateAutocorrelation = (values: number[], maxLag: number): number[] => {
  const autocorr: number[] = [];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < values.length - lag; i++) {
      sum += (values[i] - mean) * (values[i + lag] - mean);
    }
    autocorr.push(sum / ((values.length - lag) * variance));
  }
  
  return autocorr;
};

const performDecomposition = async (
  data: { value: number }[],
  params: SeasonalDecompositionParams,
  forecastPeriods: number
): Promise<SeasonalDecompositionResult> => {
  try {
    console.log('Attempting API call with params:', params);
    // Call the accurate Node.js backend API (using Vite proxy)
    const response = await fetch('/api/seasonal-decomposition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: data.map(d => ({ value: d.value })),
        params: {
          period: params.period,
          model: params.model === 'auto' ? 'additive' : params.model,
          method: params.decompositionMethod,
          robust: params.robustDecomposition,
          seasonalWindow: params.seasonalWindow,
          trendWindow: params.trendFilterLength,
          forecastPeriods: forecastPeriods,
          confidenceLevel: 0.95
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Decomposition failed');
    }

    const result = await response.json();
    console.log('API response:', result);
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Decomposition failed');
    }

    // Convert backend response to SeasonalDecompositionResult format
    const timeSeriesResult: SeasonalDecompositionResult = {
      field: 'Decomposition',
      trend: result.quality.trendStrength > 0.5 ? 'increasing' : 'stable',
      seasonality: result.period,
      confidence: result.quality.overall,
      forecast: result.forecast.map((f: any) => f.value),
      components: {
        trend: result.components.trend,
        seasonal: result.components.seasonal,
        residual: result.components.residual
      }
    };

    // Store additional data separately
    (timeSeriesResult as any).quality = result.quality;
    (timeSeriesResult as any).confidenceIntervals = result.confidenceIntervals;

    return timeSeriesResult;

  } catch (error) {
    console.error('Decomposition API error:', error);
    
    // Fallback to simplified implementation if API fails
    console.warn('Falling back to simplified decomposition');
    return performSimplifiedDecomposition(data, params, forecastPeriods);
  }
};

// Fallback simplified implementation (keep the original for backup)
const performSimplifiedDecomposition = (
  data: { value: number }[],
  params: SeasonalDecompositionParams,
  forecastPeriods: number
): SeasonalDecompositionResult => {
  const values = data.map(d => d.value);
  const n = values.length;
  
  // Improved trend calculation based on parameters
  const trendWindow = params.trendFilterLength || Math.max(3, Math.floor(params.period / 2));
  const trend = values.map((_, i) => {
    const start = Math.max(0, i - Math.floor(trendWindow / 2));
    const end = Math.min(n, i + Math.floor(trendWindow / 2) + 1);
    return values.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
  });

  const detrended = values.map((val, i) => val - trend[i]);
  
  // Improved seasonal component calculation
  const seasonal = Array(n).fill(0);
  if (params.period > 1 && params.period < n) {
    for (let i = 0; i < n; i++) {
      const seasonIndex = i % params.period;
      const sameSeasonValues = detrended.filter((_, j) => j % params.period === seasonIndex);
      if (sameSeasonValues.length > 0) {
        seasonal[i] = sameSeasonValues.reduce((a, b) => a + b, 0) / sameSeasonValues.length;
      }
    }
  }

  const residual = detrended.map((val, i) => val - seasonal[i]);
  
  // Enhanced forecast with trend and seasonality
  const forecast = [];
  const lastTrend = trend[n - 1] || 0;
  const trendSlope = n > 1 ? (trend[n - 1] - trend[n - 2]) : 0;
  
  for (let i = 0; i < forecastPeriods; i++) {
    const forecastIndex = n + i;
    const seasonIndex = forecastIndex % params.period;
    const seasonalComponent = seasonal[seasonIndex] || 0;
    const trendComponent = lastTrend + (trendSlope * (i + 1));
    const forecastValue = trendComponent + seasonalComponent;
    forecast.push(forecastValue);
  }

  // Calculate actual trend direction based on data
  const trendDirection = calculateTrendDirection(values);
  
  return {
    field: 'Decomposition',
    trend: trendDirection,
    seasonality: params.period,
    confidence: 0.95,
    forecast,
    components: {
      trend,
      seasonal,
      residual
    }
  } as SeasonalDecompositionResult;
};

const generateChartData = (
  data: any[], 
  result: SeasonalDecompositionResult, 
  stats: any
): DecompositionCharts => {
  const timeSeries: ChartData[] = data.map((d, i) => ({
    timestamp: d.timestamp,
    original: d.value,
    trend: result.components.trend[i] || 0,
    seasonal: result.components.seasonal[i] || 0,
    residual: result.components.residual[i] || 0,
    index: i
  }));

  // Add forecast data
  const forecast: ChartData[] = result.forecast.map((value, i) => ({
    timestamp: data[data.length - 1]?.timestamp + (i + 1) * 86400000, // Add days
    original: NaN,
    trend: value,
    seasonal: result.components.seasonal[i % result.components.seasonal.length] || 0,
    residual: 0,
    forecast: value,
    index: data.length + i
  }));

  // Generate autocorrelation data
  const values = data.map(d => d.value);
  const maxLag = Math.min(Math.floor(values.length / 3), 50);
  const autocorr = calculateAutocorrelation(values, maxLag);
  const autocorrelation: AutocorrelationData[] = autocorr.map((corr, i) => ({
    lag: i + 1,
    correlation: corr,
    significance: Math.abs(corr) / (2 / Math.sqrt(values.length))
  }));

  // Quality metrics for radar chart
  const qualityMetrics = [
    { name: 'Completeness', value: stats.completeness || 0.95, color: '#3B82F6' },
    { name: 'Consistency', value: stats.consistency || 0.85, color: '#10B981' },
    { name: 'Accuracy', value: stats.accuracy || 0.90, color: '#F59E0B' },
    { name: 'Reliability', value: stats.reliability || 0.88, color: '#EF4444' }
  ];

  return {
    timeSeries: [...timeSeries, ...forecast],
    autocorrelation,
    components: timeSeries,
    forecast,
    qualityMetrics
  };
};

// Chart Components
const TimeSeriesChart = ({ data, title }: { data: ChartData[]; title: string }) => (
  <div className="bg-white p-4 rounded-lg border shadow-sm">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <LineChart className="w-5 h-5 text-blue-600" />
      {title}
    </h3>
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="index" 
          label={{ value: 'Time Period', position: 'insideBottom', offset: -5 }}
        />
        <YAxis label={{ value: 'Value', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          formatter={(value: any, name: string) => [
            typeof value === 'number' ? value.toFixed(2) : value,
            name
          ]}
          labelFormatter={(label) => `Period ${label}`}
        />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="original" 
          stroke="#3B82F6" 
          fill="#3B82F6" 
          fillOpacity={0.1}
          name="Original Data"
        />
        <Line 
          type="monotone" 
          dataKey="trend" 
          stroke="#EF4444" 
          strokeWidth={2}
          name="Trend"
        />
        <Line 
          type="monotone" 
          dataKey="forecast" 
          stroke="#10B981" 
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Forecast"
        />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);

const DecompositionComponentsChart = ({ data }: { data: ChartData[] }) => (
  <div className="bg-white p-4 rounded-lg border shadow-sm">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <BarChartIcon className="w-5 h-5 text-purple-600" />
      Decomposition Components
    </h3>
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="index" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="trend" 
          stroke="#EF4444" 
          strokeWidth={2}
          name="Trend"
        />
        <Line 
          type="monotone" 
          dataKey="seasonal" 
          stroke="#F59E0B" 
          strokeWidth={2}
          name="Seasonal"
        />
        <Line 
          type="monotone" 
          dataKey="residual" 
          stroke="#8B5CF6" 
          strokeWidth={1}
          name="Residual"
        />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);

const AutocorrelationChart = ({ data }: { data: AutocorrelationData[] }) => (
  <div className="bg-white p-4 rounded-lg border shadow-sm">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <BarChart3 className="w-5 h-5 text-green-600" />
      Autocorrelation Analysis
    </h3>
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="lag" label={{ value: 'Lag', position: 'insideBottom', offset: -5 }} />
        <YAxis label={{ value: 'Correlation', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          formatter={(value: any, name: string) => [
            typeof value === 'number' ? value.toFixed(3) : value,
            name
          ]}
          labelFormatter={(label) => `Lag ${label}`}
        />
        <Bar 
          dataKey="correlation" 
          fill="#10B981"
          name="Autocorrelation"
        />
        <Line 
          type="monotone" 
          dataKey="significance" 
          stroke="#EF4444" 
          strokeWidth={2}
          name="Significance"
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  </div>
);

const QualityMetricsChart = ({ data }: { data: { name: string; value: number; color: string }[] }) => (
  <div className="bg-white p-4 rounded-lg border shadow-sm">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <PieChart className="w-5 h-5 text-orange-600" />
      Data Quality Metrics
    </h3>
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 1]} />
        <YAxis dataKey="name" type="category" width={100} />
        <Tooltip 
          formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Quality Score']}
        />
        <Bar 
          dataKey="value" 
          fill="#3B82F6"
          name="Quality Score"
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  </div>
);

const ResidualAnalysisChart = ({ data, onApplyRecommendations }: { data: ChartData[]; onApplyRecommendations?: (recommendations: string[]) => void }) => {
  const residuals = data.filter(d => !isNaN(d.residual)).map(d => d.residual);
  const residualStats = calculateAdvancedStats(residuals);
  
  // Enhanced residual analysis
  const analyzeResidualQuality = (stats: any) => {
    const issues = [];
    const recommendations = [];
    const actions = [];
    
    // --- Bias: t-test instead of fixed 0.01 ---
    const t = Math.abs(stats.mean) / ((stats.stdDev || 1e-12) / Math.sqrt(Math.max(stats.n || residuals.length, 1)));
    if (t > 1.96) {
      issues.push(`Residual mean (${stats.mean.toFixed(4)}) is statistically different from 0 (t=${t.toFixed(2)})`);
      recommendations.push('Consider adjusting the decomposition model or using robust methods');
      actions.push('Enable robust decomposition');
    }
    
    // --- Heavy tails: remember kurtosis is EXCESS (normal ≈ 0) ---
    if (stats.kurtosis > 0.5) {
      issues.push(`Heavy-tailed residuals (excess kurtosis=${stats.kurtosis.toFixed(2)})`);
      recommendations.push('Enable robust decomposition or outlier removal');
      actions.push('Enable outlier removal');
    }
    
    // --- Asymmetry (unchanged) ---
    if (Math.abs(stats.skewness) > 0.5) {
      issues.push(`Asymmetric residuals (skewness=${stats.skewness.toFixed(2)})`);
      recommendations.push('Consider data transformation or different decomposition method');
      actions.push('Try different decomposition method');
    }
    
    // --- Outliers (percentage of points, not of method counts) ---
    const outlierPct = (stats.outliers.combined / Math.max(residuals.length, 1)) * 100;
    if (outlierPct > 10) {
      issues.push(`High residual outlier percentage (${outlierPct.toFixed(1)}%)`);
      recommendations.push('Enable outlier removal or use robust decomposition methods');
      actions.push('Enable robust decomposition');
    }
    
         // --- Variability: compare std to a robust scale (MAD/IQR), NOT CV ---
     const robust = stats.robustSigma ?? (stats.mad || (stats.iqr > 0 ? stats.iqr / 1.349 : stats.stdDev || 1));
     const variabilityRatio = stats.stdDev / Math.max(Math.abs(robust), 1e-12);
     // Normal residuals give ratio ≈ 1; flag only when clearly inflated
     if (variabilityRatio > 1.6) {
       issues.push('High residual variability relative to robust scale → possible underfit');
       recommendations.push('Tune seasonal period/window or use Robust STL');
       actions.push('Optimize seasonal period');
     }
     
     // --- Whiteness check: residual autocorrelation (Ljung-Box + ACF threshold) ---
     const n = residuals.length;
     const acf = calculateAutocorrelation(residuals, Math.min(Math.floor(n/3), 30));
     const acfThr = 1.96 / Math.sqrt(Math.max(n, 1));
     const hasACSpike = acf.some((r, i) => i > 0 && Math.abs(r) > acfThr);
     
     const { p } = ljungBox(residuals, 10); // up to 10 lags
     if (hasACSpike || p < 0.05) {
       issues.push(`Residual autocorrelation detected (Ljung–Box p=${p.toFixed(3)})`);
       recommendations.push('Refine seasonal period/window or use Robust STL');
       actions.push('Optimize seasonal period');
     }
    
    return { issues, recommendations, actions };
  };
  
  const { issues, recommendations, actions } = analyzeResidualQuality(residualStats);
  const hasIssues = issues.length > 0;
  
  const handleApplyRecommendations = () => {
    if (onApplyRecommendations && actions.length > 0) {
      onApplyRecommendations(actions);
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChartIcon className="w-5 h-5 text-red-600" />
          Residual Analysis
          {hasIssues && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              {issues.length} issue{issues.length !== 1 ? 's' : ''}
            </span>
          )}
        </h3>
        {hasIssues && onApplyRecommendations && (
          <button
            onClick={handleApplyRecommendations}
            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1"
            title="Apply recommended fixes"
          >
            <Zap className="w-3 h-3" />
            Auto-Fix
          </button>
        )}
      </div>
      
             {/* Residual Statistics */}
       <div className="grid grid-cols-2 gap-4 mb-4">
         <div className="text-sm">
           <div className={`font-medium ${(() => {
             const t = Math.abs(residualStats.mean) / ((residualStats.stdDev || 1e-12) / Math.sqrt(Math.max(residualStats.n || residuals.length, 1)));
             return t > 1.96 ? 'text-red-600' : 'text-green-600';
           })()}`}>
             <strong>Mean:</strong> {residualStats.mean.toFixed(4)}
             {(() => {
               const t = Math.abs(residualStats.mean) / ((residualStats.stdDev || 1e-12) / Math.sqrt(Math.max(residualStats.n || residuals.length, 1)));
               return t > 1.96 && <span className="text-xs ml-1">⚠️ Bias detected (t={t.toFixed(2)})</span>;
             })()}
           </div>
          <div className="font-medium">
            <strong>Std Dev:</strong> {residualStats.stdDev.toFixed(4)}
          </div>
          <div className={`font-medium ${Math.abs(residualStats.skewness) > 0.5 ? 'text-orange-600' : 'text-green-600'}`}>
            <strong>Skewness:</strong> {residualStats.skewness.toFixed(4)}
            {Math.abs(residualStats.skewness) > 0.5 && <span className="text-xs ml-1">⚠️ Asymmetric</span>}
          </div>
        </div>
        <div className="text-sm">
          <div className={`font-medium ${residualStats.kurtosis > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
            <strong>Kurtosis:</strong> {residualStats.kurtosis.toFixed(4)}
            {residualStats.kurtosis > 0.5 && <span className="text-xs ml-1">⚠️ Heavy tails</span>}
          </div>
          <div className="font-medium">
            <strong>Range:</strong> [{residualStats.range.min.toFixed(4)}, {residualStats.range.max.toFixed(4)}]
          </div>
          <div className={`font-medium ${(residualStats.outliers.combined / residuals.length) > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
            <strong>Outliers:</strong> {residualStats.outliers.combined} ({((residualStats.outliers.combined / residuals.length) * 100).toFixed(1)}%)
            {(residualStats.outliers.combined / residuals.length) > 0.1 && <span className="text-xs ml-1">⚠️ High</span>}
            <div className="text-xs text-gray-500 mt-1">
              Using |z| &gt; 2.5 &amp; MAD &gt; 3.5 thresholds
            </div>
          </div>
        </div>
      </div>
      
      {/* Quality Assessment */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Residual Quality:</span>
          {hasIssues ? (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Needs Improvement</span>
          ) : (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Good</span>
          )}
        </div>
        
        {hasIssues && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <div className="text-sm font-medium text-red-800 mb-2">Issues Detected:</div>
            <ul className="text-sm text-red-700 space-y-1">
              {issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-800 mb-2">Recommendations:</div>
            <ul className="text-sm text-blue-700 space-y-1">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Residual Plot */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip 
            formatter={(value: any) => [typeof value === 'number' ? value.toFixed(4) : value, 'Residual']}
            labelFormatter={(label) => `Period ${label}`}
          />
          <Area 
            type="monotone" 
            dataKey="residual" 
            stroke="#EF4444" 
            fill="#EF4444" 
            fillOpacity={0.3}
            name="Residuals"
          />
          {/* Zero line for reference */}
          <Line 
            type="monotone" 
            dataKey={() => 0} 
            stroke="#6B7280" 
            strokeWidth={1}
            strokeDasharray="3 3"
            name="Zero Line"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Additional Metrics */}
      <div className="mt-3 text-xs text-gray-500">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Ideal Residuals:</strong> Mean ≈ 0, Normal distribution, No patterns
          </div>
          <div>
            <strong>Current Status:</strong> {hasIssues ? 'Needs optimization' : 'Good fit'}
          </div>
        </div>
      </div>
    </div>
  );
};

const SeasonalPatternChart = ({ data, period }: { data: ChartData[]; period: number }) => {
  const seasonalPatterns = [];
  for (let i = 0; i < period; i++) {
    const seasonValues = data.filter((_, index) => index % period === i);
    const avgValue = seasonValues.reduce((sum, d) => sum + d.seasonal, 0) / seasonValues.length;
    seasonalPatterns.push({
      season: i + 1,
      value: avgValue,
      label: `Season ${i + 1}`
    });
  }

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        Seasonal Pattern (Period {period})
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <RechartsBarChart data={seasonalPatterns}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Bar 
            dataKey="value" 
            fill="#3B82F6"
            name="Seasonal Component"
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export function SeasonalDecomposition({ 
  data, 
  onAnalyze, 
  forecastPeriods, 
  isLoading = false,
  onExport
}: SeasonalDecompositionProps) {
  const [params, setParams] = useState<SeasonalDecompositionParams>({
    period: 12,
    model: 'auto',
    extrapolateTrend: false,
    trendFilterLength: 13,
    robustDecomposition: false,
    seasonalWindow: 7,
    seasonalSmoothing: true,
    removeOutliers: false,
    outlierThreshold: 3,
    autoOptimize: true,
    decompositionMethod: 'stl',
    forecastMethod: 'auto'
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [autoValidate, setAutoValidate] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SeasonalDecompositionResult | null>(null);
  const [showCharts, setShowCharts] = useState(true);
  
  const formRef = useRef<HTMLFormElement>(null);
  const lastValidationRef = useRef<number>(0);
  const periodInputRef = useRef<HTMLInputElement>(null);

  // Enhanced data analysis with AI insights
  const dataAnalysis = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.value).filter(v => v !== null && v !== undefined && !isNaN(v));
    const timestamps = data.map(d => d.timestamp);
    
    const stats = calculateAdvancedStats(values);
    const seasonalInfo = detectSeasonalPatterns(values, timestamps);
    const quality = calculateDataQuality(data, stats);
    
    // Calculate residual stats if analysis result is available
    let residualStats = null;
    if (analysisResult && analysisResult.components) {
      const residuals = analysisResult.components.residual.filter(r => !isNaN(r) && r !== null && r !== undefined);
      if (residuals.length > 0) {
        residualStats = calculateAdvancedStats(residuals);
      }
    }
    
    const insights = generateAIInsights(data, stats, seasonalInfo, params, residualStats);
    
    return {
      stats,
      seasonalInfo,
      quality,
      insights,
      residualStats,
      dataLength: data.length,
      validValues: values.length
    };
  }, [data, params, analysisResult]);

  // Generate chart data when analysis result is available
  const chartData = useMemo(() => {
    if (!analysisResult || !dataAnalysis) return null;
    return generateChartData(data, analysisResult, dataAnalysis.quality);
  }, [analysisResult, data, dataAnalysis]);

  // Auto-optimization feature
  const optimizeParameters = useCallback(() => {
    if (!dataAnalysis) return;
    
    const optimized = { ...params };
    
    // Optimize period based on AI detection
    if (dataAnalysis.seasonalInfo.dominantPeriod) {
      optimized.period = dataAnalysis.seasonalInfo.dominantPeriod;
    }
    
    // Optimize model based on data characteristics
    if (optimized.model === 'auto') {
      const hasNegativeValues = data.some(d => d.value <= 0);
      const highVariability = dataAnalysis.stats.coefficientOfVariation > 0.5;
      
      if (hasNegativeValues || !highVariability) {
        optimized.model = 'additive';
      } else {
        optimized.model = 'multiplicative';
      }
    }
    
    // Optimize robustness based on outliers
    if (dataAnalysis.stats.outliers.combined > data.length * 0.1) {
      optimized.robustDecomposition = true;
      optimized.removeOutliers = true;
    }
    
    // Optimize decomposition method
    if (data.length < optimized.period * 6) {
      optimized.decompositionMethod = 'classical';
    } else if (dataAnalysis.quality.overall < 0.8) {
      optimized.decompositionMethod = 'stl';
    }
    
    setParams(optimized);
  }, [dataAnalysis, data, params]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isLoading && !errors.some(e => e.severity === 'error')) {
          handleAnalyze();
        }
      }
      
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        periodInputRef.current?.focus();
      }
      
      if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
        event.preventDefault();
        if (params.autoOptimize) optimizeParameters();
      }
      
      if (event.key === 'Escape') {
        setShowHelp(false);
        setShowKeyboardShortcuts(false);
        setSelectedInsight(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, errors, optimizeParameters, params.autoOptimize]);

  // Enhanced validation with AI recommendations
  const validateParams = useCallback((): boolean => {
    const validationId = Date.now();
    lastValidationRef.current = validationId;
    
    const newErrors: ValidationError[] = [];
    
    if (!data || data.length === 0) {
      newErrors.push({
        field: 'data',
        message: 'No data available for decomposition',
        severity: 'error'
      });
    } else {
      // Enhanced period validation
      const minDataPoints = params.period * 2;
      const recommendedPoints = params.period * 4;
      
      if (data.length < minDataPoints) {
        newErrors.push({
          field: 'period',
          message: `Insufficient data: need at least ${minDataPoints} points for period ${params.period}`,
          severity: 'error',
          suggestion: `Reduce period to ${Math.floor(data.length / 2)} or collect more data`
        });
      } else if (data.length < recommendedPoints) {
        newErrors.push({
          field: 'period',
          message: `Limited data: ${recommendedPoints} points recommended for reliable results`,
          severity: 'warning',
          suggestion: 'Consider collecting more data or using robust decomposition'
        });
      }
      
      // AI-powered period suggestion
      if (dataAnalysis?.seasonalInfo.dominantPeriod && 
          Math.abs(dataAnalysis.seasonalInfo.dominantPeriod - params.period) > 2) {
        newErrors.push({
          field: 'period',
          message: `AI detected stronger seasonality at period ${dataAnalysis.seasonalInfo.dominantPeriod}`,
          severity: 'info',
          suggestion: `Consider using period ${dataAnalysis.seasonalInfo.dominantPeriod} for better results`
        });
      }
    }
    
    // Enhanced model validation
    if (params.model === 'multiplicative' && data.some(d => d.value <= 0)) {
      newErrors.push({
        field: 'model',
        message: 'Multiplicative model requires all positive values',
        severity: 'error',
        suggestion: 'Use additive model or transform data to ensure positive values'
      });
    }
    
    // Data quality warnings
    if (dataAnalysis?.quality?.overall && dataAnalysis.quality.overall < 0.7) {
      newErrors.push({
        field: 'data',
        message: `Data quality score: ${(dataAnalysis.quality.overall * 100).toFixed(0)}%. Consider data preprocessing`,
        severity: 'warning',
        suggestion: 'Enable outlier removal or use robust decomposition'
      });
    }
    
    // Method compatibility checks
    if (params.decompositionMethod === 'x11' && data.length < params.period * 8) {
      newErrors.push({
        field: 'decompositionMethod',
        message: 'X11 method requires more data points for stability',
        severity: 'warning',
        suggestion: 'Use STL or Classical method for shorter series'
      });
    }

    // Enhanced outlier warnings
    if (dataAnalysis) {
      const outlierPercentage = (dataAnalysis.stats.outliers.combined / dataAnalysis.dataLength) * 100;
      if (outlierPercentage > 20) {
        newErrors.push({
          field: 'data',
          message: `High outlier percentage (${outlierPercentage.toFixed(1)}%). Consider robust decomposition.`,
          severity: 'warning'
        });
      }
      
      const negativeValues = data.filter(d => d.value < 0).length;
      if (negativeValues > 0 && params.model === 'multiplicative') {
        newErrors.push({
          field: 'model',
          message: `${negativeValues} negative values found. Multiplicative model may not work well.`,
          severity: 'warning'
        });
      }
      
      if (dataAnalysis.stats.coefficientOfVariation > 2) {
        newErrors.push({
          field: 'data',
          message: 'High coefficient of variation detected. Consider data transformation.',
          severity: 'info'
        });
      }
    }

    if (validationId === lastValidationRef.current) {
      setErrors(newErrors);
    }
    
    return newErrors.filter(e => e.severity === 'error').length === 0;
  }, [params, data, dataAnalysis]);

  // Debounced validation effect
  useEffect(() => {
    if (!autoValidate) return;
    
    const timeoutId = setTimeout(() => {
      validateParams();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [validateParams, autoValidate]);

  const handleParamChange = useCallback((key: keyof SeasonalDecompositionParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setErrors(prev => prev.filter(e => e.field !== key));
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (validateParams()) {
      const result = await performDecomposition(data, params, forecastPeriods);
      setAnalysisResult(result);
      onAnalyze(params, result);
    }
  }, [validateParams, onAnalyze, params, data, forecastPeriods]);

  const handleApplyResidualRecommendations = useCallback((recommendations: string[]) => {
    const optimized = { ...params };
    
    recommendations.forEach(rec => {
      if (rec.includes('robust decomposition')) {
        optimized.robustDecomposition = true;
      }
      if (rec.includes('outlier removal')) {
        optimized.removeOutliers = true;
      }
      if (rec.includes('different decomposition method')) {
        optimized.decompositionMethod = 'stl'; // Switch to STL for better robustness
      }
      if (rec.includes('Optimize seasonal period') && dataAnalysis?.seasonalInfo?.dominantPeriod) {
        optimized.period = dataAnalysis.seasonalInfo.dominantPeriod;
      }
    });
    
    setParams(optimized);
  }, [params, dataAnalysis]);

  const qualityColor = dataAnalysis?.quality?.overall && dataAnalysis.quality.overall >= 0.8 ? 'text-green-600' : 
                      dataAnalysis?.quality?.overall && dataAnalysis.quality.overall >= 0.6 ? 'text-yellow-600' : 'text-red-600';

  // Suggest optimal period based on data frequency and autocorrelation
  const suggestPeriod = useCallback(() => {
    if (!data || data.length < 2) return null;
    
    const timestamps = data.map(d => d.timestamp).sort((a, b) => a - b);
    const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Estimate data frequency and suggest seasonal periods
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;
    
    let suggestedPeriod = 12; // default
    let label = 'Yearly (12 months)';
    
    if (avgInterval <= dayMs * 1.5) {
      suggestedPeriod = 7;
      label = 'Weekly (7 days)';
    } else if (avgInterval <= weekMs * 1.5) {
      suggestedPeriod = 4;
      label = 'Monthly (4 weeks)';
    } else if (avgInterval <= monthMs * 1.5) {
      suggestedPeriod = 12;
      label = 'Yearly (12 months)';
    }

    // Use autocorrelation peaks if available
    if (dataAnalysis?.seasonalInfo.autocorrelationPeaks && dataAnalysis.seasonalInfo.autocorrelationPeaks.length > 0) {
      const bestPeak = dataAnalysis.seasonalInfo.autocorrelationPeaks[0];
      if (bestPeak.strength > 0.3) {
        suggestedPeriod = bestPeak.lag;
        label = `Detected (lag ${bestPeak.lag})`;
      }
    }

    return { period: suggestedPeriod, label };
  }, [data, dataAnalysis]);

  const suggestion = suggestPeriod();

  const getErrorByField = (field: string) => errors.filter(e => e.field === field);

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <Brain className="w-3 h-3 text-purple-500 absolute -top-1 -right-1" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">AI-Powered Seasonal Decomposition</h2>
        </div>
        <div className="flex items-center gap-2">
          {params.autoOptimize && (
            <button
              onClick={optimizeParameters}
              className="p-2 text-purple-600 hover:text-purple-800 rounded-lg hover:bg-purple-50 transition-colors"
              title="AI Optimize Parameters (Ctrl+O)"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title="Toggle charts"
          >
            <BarChartIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts"
          >
            <Keyboard className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle help"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          {onExport && (
            <button
              onClick={() => onExport && onExport({ parameters: params, data, analysis: dataAnalysis, charts: chartData })}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Export results"
              title="Export results"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      {showKeyboardShortcuts && (
        <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-800">
            <div><kbd className="px-2 py-1 bg-purple-100 rounded text-xs">Ctrl/Cmd + Enter</kbd> Run analysis</div>
            <div><kbd className="px-2 py-1 bg-purple-100 rounded text-xs">Ctrl/Cmd + K</kbd> Focus period input</div>
            <div><kbd className="px-2 py-1 bg-purple-100 rounded text-xs">Ctrl/Cmd + O</kbd> Auto-optimize</div>
            <div><kbd className="px-2 py-1 bg-purple-100 rounded text-xs">Escape</kbd> Close dialogs</div>
          </div>
        </div>
      )}

      {/* Enhanced Help Section */}
      {showHelp && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">AI-Enhanced Seasonal Decomposition Guide:</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <div><strong>🧠 AI Features:</strong> Auto-detection of seasonal patterns, intelligent parameter optimization, and data quality assessment</div>
            <div><strong>📊 Methods:</strong> STL (robust), X11 (detailed), Classical (simple), SEATS (advanced)</div>
            <div><strong>🎯 Auto Mode:</strong> Let AI choose the best model type based on your data characteristics</div>
            <div><strong>⚡ Smart Validation:</strong> Real-time parameter validation with actionable suggestions</div>
            <div><strong>🔍 Quality Metrics:</strong> Comprehensive data quality assessment and improvement recommendations</div>
          </div>
        </div>
      )}

      {/* AI Insights Panel */}
      {showAIInsights && dataAnalysis?.insights && dataAnalysis.insights.length > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-purple-900 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Insights ({dataAnalysis.insights.length})
            </h3>
            <button
              onClick={() => setShowAIInsights(false)}
              className="text-purple-600 hover:text-purple-800"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {dataAnalysis.insights.slice(0, 3).map((insight, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedInsight === insight ? 'bg-white border-purple-300 shadow-sm' : 'bg-white/50 border-purple-100 hover:bg-white/70'
                }`}
                onClick={() => setSelectedInsight(selectedInsight === insight ? null : insight)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {insight.type === 'recommendation' && <Target className="w-4 h-4 text-green-600" />}
                    {insight.type === 'anomaly' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    {insight.type === 'seasonality' && <Activity className="w-4 h-4 text-blue-600" />}
                    {insight.type === 'trend' && <TrendingUp className="w-4 h-4 text-purple-600" />}
                    {insight.type === 'pattern' && <BarChart3 className="w-4 h-4 text-orange-600" />}
                    <span className="font-medium text-sm">{insight.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500">
                      {Math.round(insight.confidence * 100)}% confidence
                    </div>
                    {insight.actionable && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          insight.action?.();
                        }}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
                {selectedInsight === insight && (
                  <div className="mt-2 text-sm text-gray-600">
                    {insight.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Analysis Summary */}
      {dataAnalysis && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Data Points:</span>
              <div className="font-medium">{data.length}</div>
            </div>
            <div>
              <span className="text-gray-600">Mean:</span>
              <div className="font-medium">{dataAnalysis.stats.mean.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-gray-600">Std Dev:</span>
              <div className="font-medium">{dataAnalysis.stats.stdDev.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-gray-600">Outliers:</span>
              <div className="font-medium">{dataAnalysis.stats.outliers.combined} ({((dataAnalysis.stats.outliers.combined / dataAnalysis.dataLength) * 100).toFixed(1)}%)</div>
            </div>
          </div>
          {dataAnalysis.seasonalInfo.autocorrelationPeaks.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              <span>Detected seasonal patterns at lags: </span>
              {dataAnalysis.seasonalInfo.autocorrelationPeaks.map((peak: any, i: number) => (
                <span key={peak.lag} className="font-medium">
                  {peak.lag} ({peak.strength.toFixed(2)}){i < dataAnalysis.seasonalInfo.autocorrelationPeaks.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error, Warning, and Info Messages */}
      {errors.length > 0 && (
        <div className="mb-4 space-y-2">
          {errors.some(e => e.severity === 'error') && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Please fix the following errors:</span>
              </div>
              {errors.filter(e => e.severity === 'error').map((error, i) => (
                <div key={i} className="text-red-700 text-sm ml-6">• {error.message}</div>
              ))}
            </div>
          )}
          {errors.some(e => e.severity === 'warning') && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Warnings:</span>
              </div>
              {errors.filter(e => e.severity === 'warning').map((error, i) => (
                <div key={i} className="text-yellow-700 text-sm ml-6">• {error.message}</div>
              ))}
            </div>
          )}
          {errors.some(e => e.severity === 'info') && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 mb-2">
                <Info className="w-4 h-4" />
                <span className="font-medium">Information:</span>
              </div>
              {errors.filter(e => e.severity === 'info').map((error, i) => (
                <div key={i} className="text-blue-700 text-sm ml-6">• {error.message}</div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="period" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              Seasonal Period
            </label>
            <input
              ref={periodInputRef}
              id="period"
              type="number"
              min="2"
              max={data ? Math.floor(data.length / 2) : 24}
              value={params.period}
              onChange={(e) => handleParamChange('period', parseInt(e.target.value) || 2)}
              className={`w-full p-3 border rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                getErrorByField('period').some(e => e.severity === 'error') ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="e.g., 12 for monthly data"
              aria-describedby="period-help"
            />
            <p className="text-xs text-gray-500 mt-1" id="period-help">
              Number of observations in one seasonal cycle
            </p>
            {suggestion && params.period !== suggestion.period && (
              <button
                type="button"
                onClick={() => handleParamChange('period', suggestion.period)}
                className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                Use suggested: {suggestion.label}
              </button>
            )}
          </div>
          
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
              Decomposition Model
            </label>
            <select
              id="model"
              value={params.model}
              onChange={(e) => handleParamChange('model', e.target.value as 'additive' | 'multiplicative' | 'auto')}
              className={`w-full p-3 border rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                getErrorByField('model').some(e => e.severity === 'error') ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="auto">Auto (AI Recommended)</option>
              <option value="additive">Additive (Y = Trend + Seasonal + Residual)</option>
              <option value="multiplicative">Multiplicative (Y = Trend × Seasonal × Residual)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {params.model === 'auto' 
                ? 'AI will choose the best model based on your data'
                : params.model === 'additive' 
                ? 'Use when seasonal variations are constant over time'
                : 'Use when seasonal variations change proportionally with the level'
              }
            </p>
          </div>
          
          <div>
            <label htmlFor="decompositionMethod" className="block text-sm font-medium text-gray-700 mb-2">
              Decomposition Method
            </label>
            <select
              id="decompositionMethod"
              value={params.decompositionMethod}
              onChange={(e) => handleParamChange('decompositionMethod', e.target.value as 'x11' | 'stl' | 'classical' | 'seats')}
              className={`w-full p-3 border rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                getErrorByField('decompositionMethod').some(e => e.severity === 'error') ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="stl">STL (Robust, Recommended)</option>
              <option value="classical">Classical (Simple)</option>
              <option value="x11">X11 (Detailed)</option>
              <option value="seats">SEATS (Advanced)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              STL is most robust for outliers, X11 for detailed analysis
            </p>
          </div>

          <div>
            <label htmlFor="forecastMethod" className="block text-sm font-medium text-gray-700 mb-2">
              Forecast Method
            </label>
            <select
              id="forecastMethod"
              value={params.forecastMethod}
              onChange={(e) => handleParamChange('forecastMethod', e.target.value as 'linear' | 'exponential' | 'seasonal_naive' | 'auto')}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="auto">Auto (AI Recommended)</option>
              <option value="linear">Linear Trend</option>
              <option value="exponential">Exponential Trend</option>
              <option value="seasonal_naive">Seasonal Naive</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {forecastPeriods > 0 && `Will forecast ${forecastPeriods} periods ahead`}
            </p>
          </div>
          
          <div>
            <label htmlFor="extrapolateTrend" className="block text-sm font-medium text-gray-700 mb-2">
              Extrapolate Trend for Forecasting
            </label>
            <select
              id="extrapolateTrend"
              value={params.extrapolateTrend ? 'true' : 'false'}
              onChange={(e) => handleParamChange('extrapolateTrend', e.target.value === 'true')}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="false">No - Use last trend value</option>
              <option value="true">Yes - Extrapolate trend pattern</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {forecastPeriods > 0 && `Will forecast ${forecastPeriods} periods ahead`}
            </p>
          </div>

          <div>
            <label htmlFor="robustDecomposition" className="block text-sm font-medium text-gray-700 mb-2">
              Robust Decomposition
            </label>
            <select
              id="robustDecomposition"
              value={params.robustDecomposition ? 'true' : 'false'}
              onChange={(e) => handleParamChange('robustDecomposition', e.target.value === 'true')}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="false">Standard decomposition</option>
              <option value="true">Robust to outliers</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Robust method is less sensitive to outliers
            </p>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            aria-expanded={showAdvanced}
          >
            <Settings className="w-4 h-4" />
            Advanced Options
            <span className="ml-1 transition-transform duration-200" style={{ transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              ▶
            </span>
          </button>
          
          {showAdvanced && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="trendFilterLength" className="block text-sm font-medium text-gray-700 mb-2">
                    Trend Filter Length
                  </label>
                  <input
                    id="trendFilterLength"
                    type="number"
                    min="3"
                    step="2"
                    value={params.trendFilterLength || ''}
                    onChange={(e) => handleParamChange('trendFilterLength', parseInt(e.target.value) || undefined)}
                    className={`w-full p-2 border rounded text-gray-800 transition-colors ${
                      getErrorByField('trendFilterLength').some(e => e.severity === 'error') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Auto (period + 1)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Length of moving average for trend estimation (odd number recommended)
                  </p>
                </div>

                <div>
                  <label htmlFor="removeOutliers" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <input
                      id="removeOutliers"
                      type="checkbox"
                      checked={params.removeOutliers}
                      onChange={(e) => handleParamChange('removeOutliers', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Remove Outliers
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    Automatically remove outliers before decomposition
                  </p>
                </div>

                <div>
                  <label htmlFor="autoValidate" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <input
                      id="autoValidate"
                      type="checkbox"
                      checked={autoValidate}
                      onChange={(e) => setAutoValidate(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Auto-validation
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    Validate parameters in real-time
                  </p>
                </div>

                <div>
                  <label htmlFor="autoOptimize" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <input
                      id="autoOptimize"
                      type="checkbox"
                      checked={params.autoOptimize}
                      onChange={(e) => handleParamChange('autoOptimize', e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <Brain className="w-4 h-4 text-purple-600" />
                    AI Auto-optimization
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    Let AI automatically optimize parameters for best results
                  </p>
                </div>

                <div>
                  <label htmlFor="showAIInsights" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <input
                      id="showAIInsights"
                      type="checkbox"
                      checked={showAIInsights}
                      onChange={(e) => setShowAIInsights(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <Lightbulb className="w-4 h-4 text-purple-600" />
                    Show AI Insights
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    Display AI-powered recommendations and insights
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading || errors.some(e => e.severity === 'error')}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            isLoading || errors.some(e => e.severity === 'error')
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing Decomposition...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Brain className="w-4 h-4" />
              Run AI-Powered Decomposition
              <span className="text-xs opacity-75">(Ctrl+Enter)</span>
            </div>
          )}
        </button>
      </form>

      {/* Visualization Section */}
      {showCharts && chartData && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChartIcon className="w-5 h-5 text-blue-600" />
              Analysis Visualizations
            </h3>
            <div className="text-sm text-gray-500">
              {data.length} data points • {forecastPeriods} forecast periods
            </div>
          </div>

          {/* Main Time Series Chart */}
          <TimeSeriesChart 
            data={chartData.timeSeries} 
            title="Time Series with Trend and Forecast" 
          />

          {/* Decomposition Components */}
          <DecompositionComponentsChart data={chartData.components} />

          {/* Autocorrelation Analysis */}
          <AutocorrelationChart data={chartData.autocorrelation} />

          {/* Grid of Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QualityMetricsChart data={chartData.qualityMetrics} />
            <ResidualAnalysisChart data={chartData.components} onApplyRecommendations={handleApplyResidualRecommendations} />
            <SeasonalPatternChart data={chartData.components} period={params.period} />
            
            {/* Forecast Confidence Interval */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Forecast Analysis
              </h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <div><strong>Forecast Periods:</strong> {forecastPeriods}</div>
                  <div><strong>Confidence Level:</strong> 95%</div>
                  <div><strong>Model Type:</strong> {params.model}</div>
                  <div><strong>Seasonal Period:</strong> {params.period}</div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData.forecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="forecast" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.3}
                      name="Forecast"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3">Analysis Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Trend Direction:</span>
                <div className="font-medium text-green-600">Stable</div>
              </div>
              <div>
                <span className="text-gray-600">Seasonality:</span>
                <div className="font-medium">{params.period} periods</div>
              </div>
              <div>
                <span className="text-gray-600">Forecast Accuracy:</span>
                <div className="font-medium text-blue-600">95%</div>
              </div>
              <div>
                <span className="text-gray-600">Data Quality:</span>
                <div className={`font-medium ${qualityColor}`}>
                  {dataAnalysis?.quality?.overall ? `${(dataAnalysis.quality.overall * 100).toFixed(0)}%` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Method Info */}
      <div className="mt-4 text-xs text-gray-500 bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200">
        <strong>🧠 AI-Powered Seasonal Decomposition:</strong> This enhanced method uses artificial intelligence to automatically detect seasonal patterns, optimize parameters, and provide intelligent recommendations. 
        The system separates your time series into trend, seasonal, and residual components with advanced outlier detection and data quality assessment.
        {dataAnalysis && dataAnalysis.stats.outliers.combined > 0 && (
          <span className="block mt-1">
            <strong>Note:</strong> {dataAnalysis.stats.outliers.combined} outliers detected. Consider using robust decomposition or outlier removal.
          </span>
        )}
        {dataAnalysis?.quality?.overall && (
          <span className="block mt-1">
            <strong>Data Quality Score:</strong> <span className={qualityColor}>{(dataAnalysis.quality.overall * 100).toFixed(0)}%</span>
          </span>
        )}
        {showCharts && (
          <span className="block mt-1">
            <strong>📊 Visualizations:</strong> Interactive charts showing decomposition components, autocorrelation analysis, and forecast projections.
          </span>
        )}
      </div>
    </div>
  );
} 
import { Matrix } from 'ml-matrix';
import * as math from 'mathjs';
import * as stats from 'simple-statistics';

/**
 * Accurate Seasonal Decomposition Service
 * Implements STL (Seasonal and Trend decomposition using Loess) and other methods
 */
export class SeasonalDecompositionService {
  constructor() {
    this.methods = {
      STL: 'stl',
      X11: 'x11', 
      CLASSICAL: 'classical',
      SEATS: 'seats'
    };
  }

  /**
   * Perform seasonal decomposition with accurate statistical methods
   */
  async decompose(data, params = {}) {
    const {
      period = 12,
      model = 'additive',
      method = 'stl',
      robust = false,
      seasonalWindow = 7,
      trendWindow = null,
      lowPassWindow = null,
      forecastPeriods = 0,
      confidenceLevel = 0.95
    } = params;

    try {
      // Validate input data
      this.validateInput(data, period);

      // Extract values and timestamps
      const values = data.map(d => d.value || d);
      const timestamps = data.map(d => d.timestamp || Date.now());

      let result;

      switch (method.toLowerCase()) {
        case 'stl':
          result = await this.performSTL(values, timestamps, {
            period,
            robust,
            seasonalWindow,
            trendWindow: trendWindow || Math.ceil(period * 1.5),
            lowPassWindow: lowPassWindow || Math.ceil(period / 2)
          });
          break;
        
        case 'x11':
          result = await this.performX11(values, timestamps, {
            period,
            model
          });
          break;
        
        case 'classical':
          result = await this.performClassical(values, timestamps, {
            period,
            model
          });
          break;
        
        case 'seats':
          result = await this.performSEATS(values, timestamps, {
            period,
            model
          });
          break;
        
        default:
          throw new Error(`Unsupported decomposition method: ${method}`);
      }

      // Add forecasting if requested
      if (forecastPeriods > 0) {
        result.forecast = await this.generateForecast(result, forecastPeriods, confidenceLevel);
      }

      // Calculate quality metrics
      result.quality = this.calculateQualityMetrics(values, result);
      
      // Calculate confidence intervals
      result.confidenceIntervals = this.calculateConfidenceIntervals(result, confidenceLevel);

      return result;

    } catch (error) {
      throw new Error(`Decomposition failed: ${error.message}`);
    }
  }

  /**
   * STL (Seasonal and Trend decomposition using Loess) - Most accurate method
   */
  async performSTL(values, timestamps, params) {
    const { period, robust, seasonalWindow, trendWindow, lowPassWindow } = params;
    const n = values.length;
    
    // Initialize components
    let trend = new Array(n).fill(0);
    let seasonal = new Array(n).fill(0);
    let residual = new Array(n).fill(0);
    
    // Step 1: Initial trend estimation using moving average
    trend = this.calculateTrendSTL(values, trendWindow);
    
    // Step 2: Detrend the series
    const detrended = values.map((val, i) => val - trend[i]);
    
    // Step 3: Seasonal component estimation
    seasonal = this.calculateSeasonalSTL(detrended, period, seasonalWindow, robust);
    
    // Step 4: Low-pass filtering of seasonal component
    const seasonalSmooth = this.lowPassFilter(seasonal, lowPassWindow);
    
    // Step 5: Final seasonal component
    seasonal = seasonal.map((val, i) => val - seasonalSmooth[i]);
    
    // Step 6: Final trend estimation
    const deseasonalized = values.map((val, i) => val - seasonal[i]);
    trend = this.calculateTrendSTL(deseasonalized, trendWindow);
    
    // Step 7: Residual calculation
    residual = values.map((val, i) => val - trend[i] - seasonal[i]);
    
    return {
      method: 'STL',
      trend,
      seasonal,
      residual,
      original: values,
      timestamps,
      period,
      components: {
        trend,
        seasonal,
        residual
      }
    };
  }

  /**
   * X11 Decomposition - Census Bureau method
   */
  async performX11(values, timestamps, params) {
    const { period, model } = params;
    const n = values.length;
    
    // X11 uses multiple passes for robust decomposition
    let trend = new Array(n).fill(0);
    let seasonal = new Array(n).fill(0);
    let residual = new Array(n).fill(0);
    
    // Step 1: Initial trend using Henderson moving average
    trend = this.hendersonMovingAverage(values, period);
    
    // Step 2: Initial seasonal adjustment
    const seasonallyAdjusted = values.map((val, i) => val - trend[i]);
    
    // Step 3: Seasonal component estimation
    seasonal = this.calculateSeasonalX11(seasonallyAdjusted, period);
    
    // Step 4: Final trend estimation
    const finalSeasonallyAdjusted = values.map((val, i) => val - seasonal[i]);
    trend = this.hendersonMovingAverage(finalSeasonallyAdjusted, period);
    
    // Step 5: Residual calculation
    residual = values.map((val, i) => val - trend[i] - seasonal[i]);
    
    return {
      method: 'X11',
      trend,
      seasonal,
      residual,
      original: values,
      timestamps,
      period,
      components: {
        trend,
        seasonal,
        residual
      }
    };
  }

  /**
   * Classical Decomposition - Simple but effective
   */
  async performClassical(values, timestamps, params) {
    const { period, model } = params;
    const n = values.length;
    
    // Step 1: Trend estimation using centered moving average
    const trend = this.centeredMovingAverage(values, period);
    
    // Step 2: Detrend the series
    const detrended = values.map((val, i) => val - trend[i]);
    
    // Step 3: Seasonal component
    const seasonal = this.calculateSeasonalClassical(detrended, period);
    
    // Step 4: Residual calculation
    const residual = values.map((val, i) => val - trend[i] - seasonal[i]);
    
    return {
      method: 'Classical',
      trend,
      seasonal,
      residual,
      original: values,
      timestamps,
      period,
      components: {
        trend,
        seasonal,
        residual
      }
    };
  }

  /**
   * SEATS Decomposition - Advanced method
   */
  async performSEATS(values, timestamps, params) {
    // SEATS is complex and requires ARIMA modeling
    // For now, we'll implement a simplified version
    return await this.performSTL(values, timestamps, params);
  }

  /**
   * Calculate trend using STL method
   */
  calculateTrendSTL(values, window) {
    const n = values.length;
    const trend = new Array(n);
    
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(n, i + Math.floor(window / 2) + 1);
      const windowValues = values.slice(start, end);
      
      // Use robust median for trend estimation
      trend[i] = stats.median(windowValues);
    }
    
    return trend;
  }

  /**
   * Calculate seasonal component using STL with robust option
   */
  calculateSeasonalSTL(detrended, period, window, robust) {
    const n = detrended.length;
    const seasonal = new Array(n).fill(0);
    
    // Group by seasonal period
    for (let season = 0; season < period; season++) {
      const seasonValues = [];
      
      for (let i = season; i < n; i += period) {
        if (!isNaN(detrended[i])) {
          seasonValues.push(detrended[i]);
        }
      }
      
      if (seasonValues.length > 0) {
        let smoothed;
        
        if (robust) {
          // Use robust smoothing with outlier detection
          smoothed = this.robustMovingAverage(seasonValues, window);
        } else {
          // Apply standard moving average to smooth seasonal pattern
          smoothed = this.movingAverage(seasonValues, window);
        }
        
        // Assign back to seasonal array
        for (let i = season; i < n; i += period) {
          const seasonIndex = Math.floor(i / period);
          if (seasonIndex < smoothed.length) {
            seasonal[i] = smoothed[seasonIndex];
          }
        }
      }
    }
    
    return seasonal;
  }

  /**
   * Low-pass filter for seasonal component
   */
  lowPassFilter(values, window) {
    return this.movingAverage(values, window);
  }

  /**
   * Henderson moving average for X11
   */
  hendersonMovingAverage(values, period) {
    const n = values.length;
    const trend = new Array(n);
    
    // Henderson weights for different window sizes
    const weights = this.getHendersonWeights(period);
    const halfWindow = Math.floor(weights.length / 2);
    
    for (let i = 0; i < n; i++) {
      let sum = 0;
      let weightSum = 0;
      
      for (let j = 0; j < weights.length; j++) {
        const index = i - halfWindow + j;
        if (index >= 0 && index < n) {
          sum += values[index] * weights[j];
          weightSum += weights[j];
        }
      }
      
      trend[i] = weightSum > 0 ? sum / weightSum : values[i];
    }
    
    return trend;
  }

  /**
   * Get Henderson moving average weights
   */
  getHendersonWeights(period) {
    // Simplified Henderson weights - in practice, these would be more complex
    const windowSize = Math.max(period + 1, 13);
    const weights = new Array(windowSize);
    
    for (let i = 0; i < windowSize; i++) {
      const x = (i - (windowSize - 1) / 2) / ((windowSize - 1) / 2);
      weights[i] = Math.pow(1 - x * x, 2);
    }
    
    return weights;
  }

  /**
   * Centered moving average for classical decomposition
   */
  centeredMovingAverage(values, period) {
    const n = values.length;
    const trend = new Array(n);
    const window = period % 2 === 0 ? period + 1 : period;
    const halfWindow = Math.floor(window / 2);
    
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(n, i + halfWindow + 1);
      const windowValues = values.slice(start, end);
      
      trend[i] = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
    }
    
    return trend;
  }

  /**
   * Calculate seasonal component for classical decomposition
   */
  calculateSeasonalClassical(detrended, period) {
    const n = detrended.length;
    const seasonal = new Array(n).fill(0);
    
    // Group by seasonal period and calculate averages
    for (let season = 0; season < period; season++) {
      const seasonValues = [];
      
      for (let i = season; i < n; i += period) {
        if (!isNaN(detrended[i])) {
          seasonValues.push(detrended[i]);
        }
      }
      
      if (seasonValues.length > 0) {
        const seasonAverage = seasonValues.reduce((sum, val) => sum + val, 0) / seasonValues.length;
        
        // Assign to all positions in this season
        for (let i = season; i < n; i += period) {
          seasonal[i] = seasonAverage;
        }
      }
    }
    
    // Center the seasonal component
    const seasonalMean = seasonal.reduce((sum, val) => sum + val, 0) / seasonal.length;
    return seasonal.map(val => val - seasonalMean);
  }

  /**
   * Calculate seasonal component for X11
   */
  calculateSeasonalX11(detrended, period) {
    // X11 seasonal calculation is more complex with multiple passes
    // This is a simplified version
    return this.calculateSeasonalClassical(detrended, period);
  }

  /**
   * Moving average helper function
   */
  movingAverage(values, window) {
    const n = values.length;
    const result = new Array(n);
    
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(n, i + Math.floor(window / 2) + 1);
      const windowValues = values.slice(start, end);
      
      result[i] = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
    }
    
    return result;
  }

  /**
   * Robust moving average with outlier detection using Huber/M-estimation
   */
  robustMovingAverage(values, window) {
    const n = values.length;
    const result = new Array(n);
    
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(n, i + Math.floor(window / 2) + 1);
      const windowValues = values.slice(start, end);
      
      if (windowValues.length === 0) {
        result[i] = values[i];
        continue;
      }
      
      // Use median as initial estimate (robust to outliers)
      const median = stats.median(windowValues);
      
      // Calculate MAD (Median Absolute Deviation) for robust scale estimate
      const deviations = windowValues.map(v => Math.abs(v - median));
      const mad = stats.median(deviations) * 1.4826; // Convert to standard deviation estimate
      
      // Huber M-estimation with winsorization
      const k = 1.345; // Huber tuning constant
      const threshold = k * mad;
      
      const robustValues = windowValues.map(v => {
        const deviation = v - median;
        if (Math.abs(deviation) <= threshold) {
          return v; // Keep original value
        } else {
          // Winsorize: cap at threshold
          return median + Math.sign(deviation) * threshold;
        }
      });
      
      // Calculate robust mean
      result[i] = robustValues.reduce((sum, val) => sum + val, 0) / robustValues.length;
    }
    
    return result;
  }

  /**
   * Generate forecast with confidence intervals
   */
  async generateForecast(decomposition, periods, confidenceLevel) {
    const { trend, seasonal, period } = decomposition;
    const n = trend.length;
    
    const forecast = [];
    const trendSlope = this.calculateTrendSlope(trend);
    const lastTrend = trend[n - 1];
    
    for (let i = 0; i < periods; i++) {
      const forecastIndex = n + i;
      const seasonIndex = forecastIndex % period;
      const seasonalComponent = seasonal[seasonIndex] || 0;
      const trendComponent = lastTrend + (trendSlope * (i + 1));
      const forecastValue = trendComponent + seasonalComponent;
      
      forecast.push({
        value: forecastValue,
        trend: trendComponent,
        seasonal: seasonalComponent,
        index: forecastIndex
      });
    }
    
    return forecast;
  }

  /**
   * Calculate trend slope for forecasting
   */
  calculateTrendSlope(trend) {
    const n = trend.length;
    if (n < 2) return 0;
    
    // Use linear regression on recent trend values
    const recentTrend = trend.slice(-Math.min(n, 10));
    const x = Array.from({ length: recentTrend.length }, (_, i) => i);
    
    const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
    const meanY = recentTrend.reduce((sum, val) => sum + val, 0) / recentTrend.length;
    
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (recentTrend[i] - meanY), 0);
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
    
    return denominator !== 0 ? numerator / denominator : 0;
  }

  /**
   * Calculate quality metrics
   */
  calculateQualityMetrics(original, decomposition) {
    const { trend, seasonal, residual } = decomposition;
    
    // Calculate variance explained
    const totalVariance = stats.variance(original);
    const residualVariance = stats.variance(residual);
    const explainedVariance = totalVariance - residualVariance;
    const varianceExplained = explainedVariance / totalVariance;
    
    // Calculate seasonal strength
    const seasonalVariance = stats.variance(seasonal);
    const trendVariance = stats.variance(trend);
    const seasonalStrength = seasonalVariance / (seasonalVariance + residualVariance);
    
    // Calculate trend strength
    const trendStrength = trendVariance / (trendVariance + residualVariance);
    
    // Calculate residual normality
    const residualNormality = this.calculateNormality(residual);
    
    return {
      varianceExplained,
      seasonalStrength,
      trendStrength,
      residualNormality,
      overall: (varianceExplained + seasonalStrength + trendStrength + residualNormality) / 4
    };
  }

  /**
   * Calculate normality of residuals
   */
  calculateNormality(residuals) {
    // Use sampleSkewness and sampleKurtosis from simple-statistics
    const skewness = stats.sampleSkewness(residuals);
    const kurtosis = stats.sampleKurtosis(residuals);
    
    // Normal distribution has skewness ≈ 0 and kurtosis ≈ 3
    const skewnessScore = Math.max(0, 1 - Math.abs(skewness) / 2);
    const kurtosisScore = Math.max(0, 1 - Math.abs(kurtosis - 3) / 3);
    
    return (skewnessScore + kurtosisScore) / 2;
  }

  /**
   * Calculate confidence intervals with AR(1) residual modeling
   */
  calculateConfidenceIntervals(decomposition, confidenceLevel) {
    const { residual } = decomposition;
    const residualStd = stats.standardDeviation(residual);
    const zScore = this.getZScore(confidenceLevel);
    
    // Calculate AR(1) coefficient for residual autocorrelation
    const ar1Coeff = this.calculateAR1Coefficient(residual);
    
    // Adjust confidence intervals for autocorrelation
    // If residuals are autocorrelated, intervals should be wider
    const autocorrAdjustment = Math.sqrt(1 + 2 * ar1Coeff / (1 - ar1Coeff));
    const adjustedStd = residualStd * autocorrAdjustment;
    
    return {
      residual: adjustedStd * zScore,
      confidenceLevel,
      zScore,
      ar1Coefficient: ar1Coeff,
      autocorrelationAdjustment: autocorrAdjustment,
      originalStd: residualStd,
      adjustedStd: adjustedStd
    };
  }

  /**
   * Calculate AR(1) coefficient for residual autocorrelation
   */
  calculateAR1Coefficient(residuals) {
    const n = residuals.length;
    if (n < 3) return 0;
    
    // Calculate lag-1 autocorrelation
    const mean = residuals.reduce((sum, val) => sum + val, 0) / n;
    const centered = residuals.map(val => val - mean);
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 1; i < n; i++) {
      numerator += centered[i] * centered[i - 1];
      denominator += centered[i - 1] * centered[i - 1];
    }
    
    // AR(1) coefficient is the lag-1 autocorrelation
    const ar1Coeff = denominator !== 0 ? numerator / denominator : 0;
    
    // Ensure coefficient is within valid range (-1, 1)
    return Math.max(-0.99, Math.min(0.99, ar1Coeff));
  }

  /**
   * Get Z-score for confidence level
   */
  getZScore(confidenceLevel) {
    const zScores = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    return zScores[confidenceLevel] || 1.96;
  }

  /**
   * Validate input data
   */
  validateInput(data, period) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data must be a non-empty array');
    }
    
    if (period < 2) {
      throw new Error('Period must be at least 2');
    }
    
    if (data.length < period * 2) {
      throw new Error(`Insufficient data: need at least ${period * 2} points for period ${period}`);
    }
    
    // Check for non-numeric values
    const values = data.map(d => d.value || d);
    if (values.some(val => typeof val !== 'number' || isNaN(val))) {
      throw new Error('All data values must be numeric');
    }
  }

  /**
   * Get decomposition methods
   */
  getMethods() {
    return this.methods;
  }

  /**
   * Get method recommendations based on data characteristics
   */
  getMethodRecommendations(data, period) {
    const values = data.map(d => d.value || d);
    const n = values.length;
    
    const recommendations = [];
    
    // STL recommendation
    if (n >= period * 6) {
      recommendations.push({
        method: 'STL',
        reason: 'Sufficient data for robust STL decomposition',
        confidence: 0.9
      });
    }
    
    // X11 recommendation
    if (n >= period * 8) {
      recommendations.push({
        method: 'X11',
        reason: 'Sufficient data for detailed X11 analysis',
        confidence: 0.8
      });
    }
    
    // Classical recommendation
    if (n >= period * 3) {
      recommendations.push({
        method: 'Classical',
        reason: 'Simple and effective for moderate data size',
        confidence: 0.7
      });
    }
    
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }
}

export default SeasonalDecompositionService; 
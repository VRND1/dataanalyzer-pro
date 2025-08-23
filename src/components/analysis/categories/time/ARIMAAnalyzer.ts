import { ARIMAParams, TimeSeriesData } from './types';

export class ARIMAAnalyzer {
  private data: TimeSeriesData[];
  private params: ARIMAParams;
  private trainingSize: number;

  constructor(data: TimeSeriesData[], params: ARIMAParams, options: { trainingSize?: number } = {}) {
    this.data = data;
    this.params = params;
    this.trainingSize = options.trainingSize || Math.floor(data.length * 0.8);
    
    this.validateInputs();
  }

  private validateInputs(): void {
    if (this.data.length < 10) {
      throw new Error("Insufficient data points. Need at least 10 observations.");
    }
    
    if (this.params.p < 0 || this.params.d < 0 || this.params.q < 0) {
      throw new Error("ARIMA parameters (p, d, q) must be non-negative integers.");
    }
    
    if (this.params.p > 5 || this.params.q > 5) {
      console.warn("High AR or MA orders may lead to overfitting. Consider values ≤ 5.");
    }
    
    if (this.params.seasonal && !this.params.seasonalPeriod) {
      throw new Error("Seasonal period must be specified when seasonal is true.");
    }
  }

  private difference(data: number[], order: number): number[] {
    if (order === 0) return data;
    const diffed = data.slice(1).map((value, i) => value - data[i]);
    return this.difference(diffed, order - 1);
  }

  private inverseDifference(diffed: number[], original: number[], order: number): number[] {
    if (order === 0) return diffed;
    const result: number[] = [original[0]];
    for (let i = 1; i < diffed.length + 1; i++) {
      result.push((diffed[i - 1] || 0) + result[i - 1]);
    }
    return this.inverseDifference(result, original, order - 1);
  }

  private calculateAutoCorrelation(data: number[], lag: number): number {
    if (lag >= data.length) return 0;
    
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    if (variance === 0) return 0; // Handle constant series
    
    let numerator = 0;
    for (let i = 0; i < data.length - lag; i++) {
      numerator += (data[i] - mean) * (data[i + lag] - mean);
    }
    
    return numerator / ((data.length - lag) * variance);
  }

  private calculatePartialAutoCorrelation(data: number[], lag: number): number {
    if (lag === 0) return 1;
    if (lag >= data.length) return 0;
    
    const pacf = new Array(lag + 1).fill(0);
    pacf[0] = 1;
    
    for (let k = 1; k <= lag; k++) {
      let sumNum = 0;
      let sumDen = 0;
      
      for (let j = 0; j < k; j++) {
        const acfKj = this.calculateAutoCorrelation(data, k - j);
        sumNum += pacf[j] * acfKj;
        sumDen += pacf[j] * this.calculateAutoCorrelation(data, j);
      }
      
      pacf[k] = (this.calculateAutoCorrelation(data, k) - sumNum) / (1 - sumDen);
    }
    
    return pacf[lag];
  }

  private estimateARParameters(data: number[], p: number): number[] {
    const acf = Array.from({ length: p + 1 }, (_, i) => this.calculateAutoCorrelation(data, i));
    const matrix: number[][] = [];
    const vector: number[] = [];

    for (let i = 0; i < p; i++) {
      matrix[i] = [];
      for (let j = 0; j < p; j++) {
        matrix[i][j] = acf[Math.abs(i - j)];
      }
      vector[i] = acf[i + 1];
    }

    return this.solveLinearSystem(matrix, vector);
  }

  private estimateMAParameters(residuals: number[], q: number): number[] {
    const acf = Array.from({ length: q + 1 }, (_, i) => this.calculateAutoCorrelation(residuals, i));
    const matrix: number[][] = [];
    const vector: number[] = [];

    for (let i = 0; i < q; i++) {
      matrix[i] = [];
      for (let j = 0; j < q; j++) {
        matrix[i][j] = acf[Math.abs(i - j)];
      }
      vector[i] = acf[i + 1];
    }

    return this.solveLinearSystem(matrix, vector);
  }

  private solveLinearSystem(matrix: number[][], vector: number[]): number[] {
    const n = matrix.length;
    const augmented = matrix.map((row, i) => [...row, vector[i]]);

    // Add small regularization to avoid singular matrices
    for (let i = 0; i < n; i++) {
      augmented[i][i] += 1e-8;
    }

    // Forward elimination with partial pivoting
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = j;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      for (let j = i + 1; j < n; j++) {
        const factor = augmented[j][i] / augmented[i][i];
        for (let k = i; k <= n; k++) {
          augmented[j][k] -= factor * augmented[i][k];
        }
      }
    }

    // Back substitution
    const solution = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        sum -= augmented[i][j] * solution[j];
      }
      solution[i] = sum / augmented[i][i];
    }

    return solution;
  }

  private calculateResiduals(data: number[], params: { ar: number[], ma: number[] }): number[] {
    const { ar, ma } = params;
    const p = ar.length;
    const q = ma.length;
    const residuals = new Array(data.length).fill(0);

    for (let i = Math.max(p, q); i < data.length; i++) {
      let arComponent = 0;
      for (let j = 0; j < p; j++) {
        arComponent += ar[j] * data[i - 1 - j];
      }

      let maComponent = 0;
      for (let j = 0; j < q; j++) {
        maComponent += ma[j] * residuals[i - 1 - j];
      }

      residuals[i] = data[i] - arComponent - maComponent;
    }

    return residuals;
  }

  private optimizeParameters(data: number[], initialParams: ARIMAParams): ARIMAParams {
    // Simple grid search around initial parameters
    const pOptions = [initialParams.p - 1, initialParams.p, initialParams.p + 1].filter(p => p >= 0);
    const qOptions = [initialParams.q - 1, initialParams.q, initialParams.q + 1].filter(q => q >= 0);
    
    let bestParams = initialParams;
    let bestError = Infinity;
    
    for (const p of pOptions) {
      for (const q of qOptions) {
        try {
          const currentParams = { ...initialParams, p, q };
          const result = this.trainModel(data, currentParams);
          
          if (result.metrics.rmse < bestError) {
            bestError = result.metrics.rmse;
            bestParams = currentParams;
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.warn(`Skipping p=${p}, q=${q}: ${error.message}`);
          } else {
            console.warn(`Skipping p=${p}, q=${q}: Unknown error occurred`);
          }
        }
      }
    }
    
    return bestParams;
  }

  private trainModel(data: number[], params: ARIMAParams): {
    forecast: number[];
    parameters: { ar: number[], ma: number[] };
    metrics: { mse: number, mae: number, rmse: number };
  } {
    const trainingData = data.slice(0, this.trainingSize);
    const validationData = data.slice(this.trainingSize);
    
    const diffed = this.difference(trainingData, params.d);
    
    // Estimate parameters
    const arParams = this.estimateARParameters(diffed, params.p);
    const initialResiduals = this.calculateResiduals(diffed, { ar: arParams, ma: new Array(params.q).fill(0) });
    const maParams = this.estimateMAParameters(initialResiduals, params.q);
    
    // Generate one-step forecasts for validation
    const forecast: number[] = [];
    const modelData = [...diffed];
    
    for (let i = 0; i < validationData.length; i++) {
      let prediction = 0;
      
      // AR component
      for (let j = 0; j < params.p; j++) {
        if (modelData.length - 1 - j >= 0) {
          prediction += arParams[j] * modelData[modelData.length - 1 - j];
        }
      }
      
      // MA component
      for (let j = 0; j < params.q; j++) {
        if (i - 1 - j >= 0) {
          prediction += maParams[j] * (forecast[i - 1 - j] - validationData[i - 1 - j]);
        }
      }
      
      forecast.push(prediction);
      modelData.push(validationData[i]);
    }
    
    // Inverse difference
    const finalForecast = this.inverseDifference(forecast, trainingData, params.d);
    
    // Calculate metrics
    const errors = validationData.map((actual, i) => actual - finalForecast[i]);
    const squaredErrors = errors.map(e => e * e);
    const absErrors = errors.map(Math.abs);
    
    const mse = squaredErrors.reduce((a, b) => a + b, 0) / errors.length;
    const mae = absErrors.reduce((a, b) => a + b, 0) / errors.length;
    const rmse = Math.sqrt(mse);
    
    return {
      forecast: finalForecast,
      parameters: { ar: arParams, ma: maParams },
      metrics: { mse, mae, rmse }
    };
  }

  public analyze(): {
    forecast: number[];
    parameters: {
      ar: number[];
      ma: number[];
      seasonal: number[];
      optimizedParams: ARIMAParams;
    };
    metrics: {
      mse: number;
      mae: number;
      rmse: number;
      mape: number;
      aic: number;
      bic: number;
    };
    diagnostics: {
      acf: number[];
      pacf: number[];
      residuals: number[];
      isStationary: boolean;
      isWhiteNoise: boolean;
    };
  } {
    const values = this.data.map(d => d.value);
    
    // Optimize parameters if requested
    const optimizedParams = this.params.optimize ? 
      this.optimizeParameters(values, this.params) : 
      this.params;
    
    // Train final model
    const trainingResult = this.trainModel(values, optimizedParams);
    
    // Generate final forecast
    const forecastLength = this.params.forecastLength || 12;
    const finalForecast = this.generateForecast(
      values, 
      trainingResult.parameters, 
      optimizedParams.d, 
      forecastLength
    );
    
    // Calculate additional metrics
    const validationData = values.slice(this.trainingSize);
    const percentageErrors = validationData.map((actual, i) => 
      Math.abs((actual - trainingResult.forecast[i]) / actual) * 100);
    const mape = percentageErrors.reduce((a, b) => a + b, 0) / percentageErrors.length;
    
    // Calculate information criteria
    const n = validationData.length;
    const k = optimizedParams.p + optimizedParams.q;
    const aic = n * Math.log(trainingResult.metrics.mse) + 2 * k;
    const bic = n * Math.log(trainingResult.metrics.mse) + k * Math.log(n);
    
    // Diagnostic checks
    const residuals = this.calculateResiduals(
      this.difference(values, optimizedParams.d),
      trainingResult.parameters
    );
    
    const acf = Array.from({ length: 10 }, (_, i) => this.calculateAutoCorrelation(residuals, i + 1));
    const pacf = Array.from({ length: 10 }, (_, i) => this.calculatePartialAutoCorrelation(residuals, i + 1));
    
    // Check if residuals resemble white noise
    const isWhiteNoise = acf.slice(0, 5).every(val => Math.abs(val) < 1.96 / Math.sqrt(residuals.length));
    
    // Check stationarity (ADF test simplified)
    const diffAcf = this.calculateAutoCorrelation(this.difference(values, 1), 1);
    const isStationary = Math.abs(diffAcf) < 0.5;
    
    return {
      forecast: finalForecast,
      parameters: {
        ar: trainingResult.parameters.ar,
        ma: trainingResult.parameters.ma,
        seasonal: optimizedParams.seasonal ? [optimizedParams.seasonalPeriod] : [],
        optimizedParams,
      },
      metrics: {
        ...trainingResult.metrics,
        mape,
        aic,
        bic,
      },
      diagnostics: {
        acf,
        pacf,
        residuals,
        isStationary,
        isWhiteNoise,
      },
    };
  }

  private generateForecast(
    data: number[], 
    params: { ar: number[], ma: number[] }, 
    d: number, 
    forecastLength: number
  ): number[] {
    const diffed = this.difference(data, d);
    const { ar, ma } = params;
    const p = ar.length;
    const q = ma.length;
    
    const forecastDiff: number[] = [];
    const modelData = [...diffed];
    const residuals = this.calculateResiduals(modelData, params);
    
    for (let i = 0; i < forecastLength; i++) {
      let prediction = 0;
      
      // AR component
      for (let j = 0; j < p; j++) {
        if (modelData.length - 1 - j >= 0) {
          prediction += ar[j] * modelData[modelData.length - 1 - j];
        }
      }
      
      // MA component
      for (let j = 0; j < q; j++) {
        if (residuals.length - 1 - j >= 0) {
          prediction += ma[j] * residuals[residuals.length - 1 - j];
        }
      }
      
      forecastDiff.push(prediction);
      modelData.push(prediction);
      
      // Update residuals with zero (since future errors are unknown)
      residuals.push(0);
    }
    
    return this.inverseDifference(forecastDiff, data, d);
  }

  public suggestParameters(): { p: number, d: number, q: number } {
    const values = this.data.map(d => d.value);
    
    // Difference order (d)
    let d = 0;
    let diffAcf = this.calculateAutoCorrelation(values, 1);
    while (Math.abs(diffAcf) > 0.5 && d < 2) {
      d++;
      const diffed = this.difference(values, d);
      diffAcf = this.calculateAutoCorrelation(diffed, 1);
    }
    
    // AR order (p) - using PACF cutoff
    const diffed = this.difference(values, d);
    let p = 0;
    for (let lag = 1; lag <= 5; lag++) {
      const pacf = this.calculatePartialAutoCorrelation(diffed, lag);
      if (Math.abs(pacf) > 1.96 / Math.sqrt(diffed.length)) {
        p = lag;
      } else {
        break;
      }
    }
    
    // MA order (q) - using ACF cutoff
    let q = 0;
    for (let lag = 1; lag <= 5; lag++) {
      const acf = this.calculateAutoCorrelation(diffed, lag);
      if (Math.abs(acf) > 1.96 / Math.sqrt(diffed.length)) {
        q = lag;
      } else {
        break;
      }
    }
    
    return { p, d, q };
  }
}

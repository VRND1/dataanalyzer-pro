import { DataField } from '@/types/data';
import { calculateFieldStats } from '../statistics/calculations';
import { determineTrend } from '../statistics/trends';
import { createError } from '@/utils/core/error';

interface SimulationConfig {
  iterations: number;
  timeHorizon: number;
  confidenceLevel: number;
  modelWeights: {
    statistical: number;
    ml: number;
    timeSeries: number;
  };
}

export interface SimulationResult {
  field: string;
  predictions: number[];
  confidence: {
    upper: number[];
    lower: number[];
  };
  metrics: {
    accuracy: number;
    rmse: number;
    mae: number;
  };
  insights: string[];
}

export class AISimulationEngine {
  private fields: DataField[];
  private config: SimulationConfig;

  constructor(fields: DataField[], config?: Partial<SimulationConfig>) {
    this.fields = fields;
    this.config = {
      iterations: 1000,
      timeHorizon: 12,
      confidenceLevel: 0.95,
      modelWeights: {
        statistical: 0.3,
        ml: 0.4,
        timeSeries: 0.3
      },
      ...config
    };
    this.validateInputs();
  }

  private validateInputs() {
    if (!this.fields?.length) {
      throw createError('ANALYSIS_ERROR', 'No data available for simulation');
    }

    const numericFields = this.fields.filter(f => f.type === 'number');
    if (numericFields.length === 0) {
      throw createError('ANALYSIS_ERROR', 'Simulation requires numeric fields');
    }

    // Validate data points
    const minDataPoints = 10;
    const insufficientFields = numericFields.filter(f => f.value.length < minDataPoints);
    if (insufficientFields.length > 0) {
      throw createError(
        'ANALYSIS_ERROR',
        `Insufficient data points for simulation. The following fields need at least ${minDataPoints} points: ${
          insufficientFields.map(f => f.name).join(', ')
        }`
      );
    }

    // Validate numeric values
    for (const field of numericFields) {
      const values = field.value as number[];
      if (values.some(v => !isFinite(v))) {
        throw createError('ANALYSIS_ERROR', `Field "${field.name}" contains invalid numeric values`);
      }
    }
  }

  async runSimulation(): Promise<SimulationResult[]> {
    try {
      const numericFields = this.fields.filter(f => f.type === 'number');
      return await Promise.all(numericFields.map(field => this.simulateField(field)));
    } catch (error) {
      console.error('Simulation error:', error);
      throw createError(
        'ANALYSIS_ERROR',
        error instanceof Error ? error.message : 'Failed to run simulation'
      );
    }
  }

  private async simulateField(field: DataField): Promise<SimulationResult> {
    const values = field.value as number[];
    const stats = calculateFieldStats(field);
    const trend = determineTrend(values);

    // Run multiple models in parallel
    const [
      statisticalPredictions,
      mlPredictions,
      timeSeriesPredictions
    ] = await Promise.all([
      this.runStatisticalModel(values, stats),
      this.runMLModel(values, stats),
      this.runTimeSeriesModel(values, trend)
    ]);

    // Ensemble predictions using configured weights
    const predictions = this.ensemblePredictions(
      statisticalPredictions,
      mlPredictions,
      timeSeriesPredictions
    );

    // Calculate confidence intervals
    const confidence = this.calculateConfidenceIntervals(predictions, stats);

    // Calculate metrics
    const metrics = this.calculateMetrics(predictions, values);

    // Generate insights
    const insights = this.generateInsights(field.name, predictions, metrics, trend);

    return {
      field: field.name,
      predictions,
      confidence,
      metrics,
      insights
    };
  }

  private async runStatisticalModel(
    values: number[],
    stats: ReturnType<typeof calculateFieldStats>
  ): Promise<number[]> {
    const predictions: number[] = [];
    const lastValue = values[values.length - 1];
    const volatility = stats.standardDeviation / stats.mean;

    for (let i = 0; i < this.config.timeHorizon; i++) {
      const randomWalk = volatility * Math.sqrt(1/12) * (Math.random() * 2 - 1);
      const prediction = lastValue * (1 + randomWalk);
      predictions.push(prediction);
    }

    return predictions;
  }

  private async runMLModel(
    values: number[],
    stats: ReturnType<typeof calculateFieldStats>
  ): Promise<number[]> {
    const predictions: number[] = [];
    const windowSize = 3;
    const lastWindow = values.slice(-windowSize);
    const stdDev = stats.standardDeviation;

    for (let i = 0; i < this.config.timeHorizon; i++) {
      // Simple ML prediction using moving average and trend
      const windowMean = lastWindow.reduce((a, b) => a + b, 0) / windowSize;
      const trend = (lastWindow[lastWindow.length - 1] - lastWindow[0]) / windowSize;
      
      const prediction = windowMean + trend + (Math.random() - 0.5) * stdDev * 0.1;
      predictions.push(prediction);
      
      // Update window for next prediction
      lastWindow.shift();
      lastWindow.push(prediction);
    }

    return predictions;
  }

  private async runTimeSeriesModel(
    values: number[],
    trend: ReturnType<typeof determineTrend>
  ): Promise<number[]> {
    const predictions: number[] = [];
    const lastValue = values[values.length - 1];
    const trendFactor = trend === 'up' ? 1.1 : trend === 'down' ? 0.9 : 1.0;

    for (let i = 0; i < this.config.timeHorizon; i++) {
      const seasonalFactor = 1 + 0.1 * Math.sin(2 * Math.PI * i / 12); // Annual seasonality
      const prediction = lastValue * Math.pow(trendFactor, i/12) * seasonalFactor;
      predictions.push(prediction);
    }

    return predictions;
  }

  private ensemblePredictions(
    statistical: number[],
    ml: number[],
    timeSeries: number[]
  ): number[] {
    const { statistical: w1, ml: w2, timeSeries: w3 } = this.config.modelWeights;
    
    return statistical.map((_, i) => 
      w1 * statistical[i] + w2 * ml[i] + w3 * timeSeries[i]
    );
  }

  private calculateConfidenceIntervals(
    predictions: number[],
    stats: ReturnType<typeof calculateFieldStats>
  ) {
    const z = 1.96; // 95% confidence level
    const margin = z * stats.standardDeviation / Math.sqrt(predictions.length);

    return {
      upper: predictions.map(p => p + margin),
      lower: predictions.map(p => p - margin)
    };
  }

  private calculateMetrics(predictions: number[], actuals: number[]) {
    const n = Math.min(predictions.length, actuals.length);
    
    // Calculate RMSE
    const squaredErrors = predictions
      .slice(0, n)
      .map((p, i) => Math.pow(p - actuals[i], 2));
    const rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / n);
    
    // Calculate MAE
    const absoluteErrors = predictions
      .slice(0, n)
      .map((p, i) => Math.abs(p - actuals[i]));
    const mae = absoluteErrors.reduce((a, b) => a + b, 0) / n;
    
    // Calculate accuracy (1 - normalized MAE)
    const accuracy = Math.max(0, 1 - mae / (Math.max(...actuals) - Math.min(...actuals)));

    return { accuracy, rmse, mae };
  }

  private generateInsights(
    fieldName: string,
    predictions: number[],
    metrics: { accuracy: number; rmse: number; mae: number },
    trend: ReturnType<typeof determineTrend>
  ): string[] {
    const insights: string[] = [];

    // Model performance insights
    if (metrics.accuracy > 0.9) {
      insights.push(`High prediction accuracy (${(metrics.accuracy * 100).toFixed(1)}%) for ${fieldName}`);
    } else if (metrics.accuracy < 0.7) {
      insights.push(`Lower prediction confidence for ${fieldName}, consider additional data points`);
    }

    // Trend insights
    const predictionTrend = determineTrend(predictions);
    if (predictionTrend !== trend) {
      insights.push(`Potential trend reversal detected for ${fieldName}`);
    }

    // Volatility insights
    const volatility = metrics.rmse / predictions.reduce((a, b) => a + b, 0) * predictions.length;
    if (volatility > 0.2) {
      insights.push(`High volatility detected in predictions for ${fieldName}`);
    }

    return insights;
  }
}
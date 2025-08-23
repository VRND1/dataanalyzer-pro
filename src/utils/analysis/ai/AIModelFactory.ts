import * as ort from 'onnxruntime-web';
import Prophet from 'prophet-js';
import { DataField } from '@/types/data';
import { createError } from '@/utils/core/error';

export class AIModelFactory {
  private static instance: AIModelFactory;
  private models: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): AIModelFactory {
    if (!AIModelFactory.instance) {
      AIModelFactory.instance = new AIModelFactory();
    }
    return AIModelFactory.instance;
  }

  async createTimeSeriesAnalyzer(data: DataField): Promise<any> {
    try {
      const prophet = new Prophet({
        growth: 'linear',
        changepoints: null,
        n_changepoints: 25,
        changepoint_range: 0.8,
        yearly_seasonality: 'auto',
        weekly_seasonality: 'auto',
        daily_seasonality: 'auto',
        seasonality_mode: 'additive',
        seasonality_prior_scale: 10.0,
        changepoint_prior_scale: 0.05,
        holidays_prior_scale: 10.0,
        mcmc_samples: 0,
        interval_width: 0.8,
        uncertainty_samples: 1000
      });

      // Convert data to Prophet format
      const values = data.value as number[];
      const dates = Array.from({ length: values.length }, (_, i) => 
        new Date(Date.now() - (values.length - i - 1) * 24 * 60 * 60 * 1000)
      );

      const ds = dates.map(d => d.toISOString().split('T')[0]);
      const y = values;

      // Fit model
      await prophet.fit({ ds, y });

      // Store model
      this.models.set(`timeseries_${data.name}`, prophet);
      
      return prophet;
    } catch (error) {
      throw createError('ML_ERROR', 'Failed to create time series model');
    }
  }

  async createAnomalyDetector(data: DataField): Promise<any> {
    try {
      // Initialize ONNX Runtime session
      const session = await ort.InferenceSession.create('/models/isolation_forest.onnx');
      
      // Prepare input data
      const values = data.value as number[];
      const tensor = new ort.Tensor('float32', new Float32Array(values), [values.length, 1]);
      
      // Run inference
      await session.run({ input: tensor });
      
      // Store model
      this.models.set(`anomaly_${data.name}`, session);
      
      return session;
    } catch (error) {
      throw createError('ML_ERROR', 'Failed to create anomaly detection model');
    }
  }

  async createPredictiveModel(data: DataField): Promise<any> {
    try {
      // Initialize ONNX Runtime session
      const session = await ort.InferenceSession.create('/models/random_forest.onnx');
      
      // Store model
      this.models.set(`predictive_${data.name}`, session);
      
      return session;
    } catch (error) {
      throw createError('ML_ERROR', 'Failed to create predictive model');
    }
  }

  getModel(modelId: string): any {
    const model = this.models.get(modelId);
    if (!model) {
      throw createError('ML_ERROR', 'Model not found');
    }
    return model;
  }

  async deleteModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (model) {
      if (model.destroy) await model.destroy();
      this.models.delete(modelId);
    }
  }
}
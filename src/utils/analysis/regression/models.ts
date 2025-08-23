import { DataField } from '@/types/data';
import { createError } from '@/utils/core/error';
import { calculateLinearRegression } from '../regression/linear';

export interface RegressionResult {
  modelName: string;
  metrics: {
    rSquared: number;
    mse: number;
    rmse: number;
    mae: number;
    aic: number;
    bic: number;
  };
  coefficients: number[];
  intercept: number;
  predictions: number[];
  actualValues: number[];
  featureImportance: { name: string; importance: number }[];
  residuals: number[];
  confidence: {
    upper: number[];
    lower: number[];
  };
}

function prepareFeatures(features: DataField[]): number[][] {
  return features.map(feature => 
    Array.isArray(feature.value) ? feature.value.map(v => Number(v)) : []
  );
}

export async function performRegression(
  target: DataField,
  features: DataField[]
): Promise<RegressionResult> {
  try {
    const X = prepareFeatures(features);
    const y = target.value as number[];
    
    // Validate input data
    if (!X[0]?.length || !y?.length) {
      throw new Error('Invalid input data for regression');
    }

    // Perform regression
    const featureDataField: DataField = {
      name: features[0].name,
      type: 'number',
      value: X[0]
    };
    const targetDataField: DataField = {
      name: target.name,
      type: 'number',
      value: y
    };
    const result = await calculateLinearRegression(featureDataField, targetDataField);
    const predictions = result.predictions;
    const residuals = result.actualValues.map((yi, i) => yi - predictions[i]);
    
    // Calculate metrics
    const mse = result.metrics.mse;
    const rmse = result.metrics.rmse;
    const mae = result.metrics.mae;
    const aic = result.metrics.aic;
    const bic = result.metrics.bic;
    
    // Calculate feature importance
    const featureImportance = features.map(feature => ({
      name: feature.name,
      importance: Math.abs(result.coefficients[0])
    }));
    
    // Calculate confidence intervals
    const confidence = result.confidence;

    return {
      modelName: 'Linear Regression',
      metrics: {
        rSquared: result.rSquared,
        mse,
        rmse,
        mae,
        aic,
        bic
      },
      coefficients: result.coefficients,
      intercept: result.intercept,
      predictions,
      actualValues: result.actualValues,
      featureImportance,
      residuals,
      confidence
    };
  } catch (error) {
    console.error('Regression analysis error:', error);
    throw createError(
      'ANALYSIS_ERROR',
      `Failed to perform regression: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
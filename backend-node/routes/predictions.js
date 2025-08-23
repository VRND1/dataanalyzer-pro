import express from 'express';
import Joi from 'joi';
import * as ss from 'simple-statistics';
import { PolynomialRegression } from 'ml-regression';

const router = express.Router();

// Validation schemas
const predictionRequestSchema = Joi.object({
  data: Joi.array().items(Joi.number()).min(3).required(),
  horizon: Joi.number().integer().min(1).max(50).default(5),
  confidence: Joi.number().min(0.5).max(0.99).default(0.95)
});

// POST /api/predict
router.post('/', async (req, res) => {
  try {
    // Validate request
    const { error, value } = predictionRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: 'Validation error',
          details: error.details
        }
      });
    }

    const { data, horizon, confidence } = value;

    // Perform predictions using multiple methods
    const predictions = {
      linear: linearPrediction(data, horizon),
      polynomial: polynomialPrediction(data, horizon),
      exponential: exponentialPrediction(data, horizon),
      ensemble: null
    };

    // Calculate ensemble prediction
    const validPredictions = Object.values(predictions).filter(p => p !== null);
    if (validPredictions.length > 0) {
      predictions.ensemble = ensemblePrediction(validPredictions);
    }

    // Calculate confidence intervals
    const confidenceIntervals = calculateConfidenceIntervals(predictions.ensemble, confidence);

    res.json({
      success: true,
      data: {
        predictions,
        confidence_intervals: confidenceIntervals,
        accuracy_metrics: calculateAccuracyMetrics(data, predictions.ensemble),
        horizon,
        confidence_level: confidence
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    });

  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Prediction failed',
        request_id: req.id
      }
    });
  }
});

// Helper functions
function linearPrediction(data, horizon) {
  try {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const regression = ss.linearRegression([x, data]);
    
    const predictions = [];
    for (let i = 0; i < horizon; i++) {
      predictions.push(regression.m * (n + i) + regression.b);
    }
    
    return predictions;
  } catch (error) {
    console.error('Linear prediction error:', error);
    return null;
  }
}

function polynomialPrediction(data, horizon) {
  try {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;
    
    // Fit polynomial regression (degree 2)
    const regression = new PolynomialRegression(x, y, 2);
    regression.train();
    
    const predictions = [];
    for (let i = 0; i < horizon; i++) {
      predictions.push(regression.predict(n + i));
    }
    
    return predictions;
  } catch (error) {
    console.error('Polynomial prediction error:', error);
    return null;
  }
}

function exponentialPrediction(data, horizon) {
  try {
    // Simple exponential smoothing
    const alpha = 0.3;
    let forecast = data[data.length - 1];
    const predictions = [];
    
    for (let i = 0; i < horizon; i++) {
      predictions.push(forecast);
      forecast = alpha * data[data.length - 1] + (1 - alpha) * forecast;
    }
    
    return predictions;
  } catch (error) {
    console.error('Exponential prediction error:', error);
    return null;
  }
}

function ensemblePrediction(predictions) {
  const horizon = predictions[0].length;
  const ensemble = [];
  
  for (let i = 0; i < horizon; i++) {
    let sum = 0;
    let count = 0;
    
    predictions.forEach(pred => {
      if (pred[i] !== undefined && !isNaN(pred[i])) {
        sum += pred[i];
        count++;
      }
    });
    
    ensemble.push(count > 0 ? sum / count : 0);
  }
  
  return ensemble;
}

function calculateConfidenceIntervals(predictions, confidence) {
  if (!predictions || predictions.length === 0) return [];
  
  const std = ss.standardDeviation(predictions);
  const zScore = getZScore(confidence);
  
  return predictions.map(value => ({
    lower: value - zScore * std,
    upper: value + zScore * std,
    point: value
  }));
}

function getZScore(confidence) {
  // Simplified z-score lookup
  const zScores = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576
  };
  return zScores[confidence] || 1.96;
}

function calculateAccuracyMetrics(data, predictions) {
  if (!predictions || predictions.length === 0) return {};
  
  // Use last few data points for validation
  const validationData = data.slice(-Math.min(5, data.length));
  const validationPredictions = predictions.slice(0, validationData.length);
  
  if (validationData.length === 0) return {};
  
  const mse = ss.meanSquaredError(validationData, validationPredictions);
  const mae = ss.meanAbsoluteError(validationData, validationPredictions);
  
  return {
    mse,
    mae,
    rmse: Math.sqrt(mse),
    mape: calculateMAPE(validationData, validationPredictions)
  };
}

function calculateMAPE(actual, predicted) {
  let sum = 0;
  let count = 0;
  
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      count++;
    }
  }
  
  return count > 0 ? (sum / count) * 100 : 0;
}

// GET /api/predict/health
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'predictions',
    timestamp: new Date().toISOString()
  });
});

export { router as predictionRoutes }; 
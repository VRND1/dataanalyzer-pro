import express from 'express';
import Joi from 'joi';
import * as ss from 'simple-statistics';

const router = express.Router();

// Validation schemas
const anomalyDetectionRequestSchema = Joi.object({
  data: Joi.array().items(Joi.number()).min(3).required(),
  threshold: Joi.number().min(0.5).max(0.99).default(0.95),
  method: Joi.string().valid('zscore', 'iqr', 'moving_average').default('zscore')
});

// POST /api/detect-anomalies
router.post('/', async (req, res) => {
  try {
    // Validate request
    const { error, value } = anomalyDetectionRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: 'Validation error',
          details: error.details
        }
      });
    }

    const { data, threshold, method } = value;

    // Perform anomaly detection using specified method
    let anomalies = [];
    
    switch (method) {
      case 'zscore':
        anomalies = detectAnomaliesZScore(data, threshold);
        break;
      case 'iqr':
        anomalies = detectAnomaliesIQR(data, threshold);
        break;
      case 'moving_average':
        anomalies = detectAnomaliesMovingAverage(data, threshold);
        break;
      default:
        anomalies = detectAnomaliesZScore(data, threshold);
    }

    // Calculate summary statistics
    const summary = {
      total_points: data.length,
      anomalies_detected: anomalies.length,
      anomaly_percentage: (anomalies.length / data.length) * 100,
      method_used: method,
      threshold_used: threshold
    };

    res.json({
      success: true,
      data: {
        anomalies,
        summary,
        original_data: data
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    });

  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Anomaly detection failed',
        request_id: req.id
      }
    });
  }
});

// Anomaly detection methods
function detectAnomaliesZScore(data, threshold) {
  const anomalies = [];
  const mean = ss.mean(data);
  const std = ss.standardDeviation(data);
  
  // Calculate z-score threshold based on confidence level
  const zThreshold = getZScoreThreshold(threshold);
  
  data.forEach((value, index) => {
    const zScore = Math.abs((value - mean) / std);
    if (zScore > zThreshold) {
      anomalies.push({
        index,
        value,
        zScore,
        method: 'zscore',
        threshold: zThreshold,
        deviation: (value - mean) / std
      });
    }
  });
  
  return anomalies;
}

function detectAnomaliesIQR(data, threshold) {
  const anomalies = [];
  const sortedData = [...data].sort((a, b) => a - b);
  
  const q1 = ss.quantile(sortedData, 0.25);
  const q3 = ss.quantile(sortedData, 0.75);
  const iqr = q3 - q1;
  
  // Calculate IQR threshold based on confidence level
  const iqrMultiplier = getIQRMultiplier(threshold);
  const lowerBound = q1 - iqrMultiplier * iqr;
  const upperBound = q3 + iqrMultiplier * iqr;
  
  data.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      anomalies.push({
        index,
        value,
        method: 'iqr',
        lowerBound,
        upperBound,
        iqr,
        q1,
        q3
      });
    }
  });
  
  return anomalies;
}

function detectAnomaliesMovingAverage(data, threshold) {
  const anomalies = [];
  const windowSize = Math.min(5, Math.floor(data.length / 2));
  
  if (windowSize < 2) {
    return detectAnomaliesZScore(data, threshold);
  }
  
  const movingAverages = calculateMovingAverage(data, windowSize);
  const movingStd = calculateMovingStd(data, windowSize);
  
  data.forEach((value, index) => {
    if (index >= windowSize) {
      const ma = movingAverages[index - windowSize];
      const ms = movingStd[index - windowSize];
      const deviation = Math.abs(value - ma);
      const thresholdValue = ms * getZScoreThreshold(threshold);
      
      if (deviation > thresholdValue) {
        anomalies.push({
          index,
          value,
          method: 'moving_average',
          movingAverage: ma,
          movingStd: ms,
          deviation,
          threshold: thresholdValue
        });
      }
    }
  });
  
  return anomalies;
}

// Helper functions
function getZScoreThreshold(confidence) {
  const zScores = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576
  };
  return zScores[confidence] || 1.96;
}

function getIQRMultiplier(confidence) {
  const multipliers = {
    0.90: 1.5,
    0.95: 2.0,
    0.99: 3.0
  };
  return multipliers[confidence] || 1.5;
}

function calculateMovingAverage(data, windowSize) {
  const result = [];
  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1);
    result.push(ss.mean(window));
  }
  return result;
}

function calculateMovingStd(data, windowSize) {
  const result = [];
  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1);
    result.push(ss.standardDeviation(window));
  }
  return result;
}

// GET /api/detect-anomalies/health
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'anomaly_detection',
    timestamp: new Date().toISOString()
  });
});

export { router as anomalyRoutes }; 
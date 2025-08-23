import express from 'express';
import Joi from 'joi';
import SeasonalDecompositionService from '../services/seasonalDecomposition.js';

const router = express.Router();
const decompositionService = new SeasonalDecompositionService();

// Validation schemas
const decompositionSchema = Joi.object({
  data: Joi.array().items(
    Joi.object({
      timestamp: Joi.number().optional(),
      value: Joi.number().required()
    }).or('value')
  ).min(1).required(),
  params: Joi.object({
    period: Joi.number().integer().min(2).default(12),
    model: Joi.string().valid('additive', 'multiplicative', 'auto').default('additive'),
    method: Joi.string().valid('stl', 'x11', 'classical', 'seats').default('stl'),
    robust: Joi.boolean().default(false),
    seasonalWindow: Joi.number().integer().min(3).default(7),
    trendWindow: Joi.number().integer().min(3).optional(),
    lowPassWindow: Joi.number().integer().min(3).optional(),
    forecastPeriods: Joi.number().integer().min(0).max(100).default(0),
    confidenceLevel: Joi.number().min(0.8).max(0.99).default(0.95)
  }).default({})
});

const methodRecommendationSchema = Joi.object({
  data: Joi.array().items(
    Joi.object({
      timestamp: Joi.number().optional(),
      value: Joi.number().required()
    }).or('value')
  ).min(1).required(),
  period: Joi.number().integer().min(2).default(12)
});

/**
 * POST /api/seasonal-decomposition
 * Perform seasonal decomposition analysis
 */
router.post('/', async (req, res) => {
  try {
    // Validate request
    const { error, value } = decompositionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: 'Invalid request data',
          details: error.details.map(d => d.message)
        }
      });
    }

    const { data, params } = value;

    // Perform decomposition
    const result = await decompositionService.decompose(data, params);

    // Format response
    const response = {
      success: true,
      method: result.method,
      period: result.period,
      quality: result.quality,
      confidenceIntervals: result.confidenceIntervals,
      components: {
        trend: result.trend,
        seasonal: result.seasonal,
        residual: result.residual
      },
      forecast: result.forecast || [],
      summary: {
        dataPoints: data.length,
        varianceExplained: result.quality.varianceExplained,
        seasonalStrength: result.quality.seasonalStrength,
        trendStrength: result.quality.trendStrength,
        overallQuality: result.quality.overall
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Seasonal decomposition error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'decomposition_error'
      }
    });
  }
});

/**
 * POST /api/seasonal-decomposition/recommendations
 * Get method recommendations based on data characteristics
 */
router.post('/recommendations', async (req, res) => {
  try {
    // Validate request
    const { error, value } = methodRecommendationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: 'Invalid request data',
          details: error.details.map(d => d.message)
        }
      });
    }

    const { data, period } = value;

    // Get recommendations
    const recommendations = decompositionService.getMethodRecommendations(data, period);

    // Analyze data characteristics
    const values = data.map(d => d.value || d);
    const characteristics = {
      dataPoints: values.length,
      period: period,
      mean: stats.mean(values),
      standardDeviation: stats.standardDeviation(values),
      coefficientOfVariation: stats.standardDeviation(values) / Math.abs(stats.mean(values)),
      hasNegativeValues: values.some(v => v < 0),
      hasZeroValues: values.some(v => v === 0),
      recommendedMinDataPoints: period * 6,
      sufficientForSTL: values.length >= period * 6,
      sufficientForX11: values.length >= period * 8
    };

    res.json({
      success: true,
      recommendations,
      characteristics,
      bestMethod: recommendations.length > 0 ? recommendations[0].method : 'classical'
    });

  } catch (error) {
    console.error('Method recommendation error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'recommendation_error'
      }
    });
  }
});

/**
 * GET /api/seasonal-decomposition/methods
 * Get available decomposition methods
 */
router.get('/methods', (req, res) => {
  try {
    const methods = decompositionService.getMethods();
    
    const methodDetails = {
      stl: {
        name: 'STL (Seasonal and Trend decomposition using Loess)',
        description: 'Most accurate method, robust to outliers',
        advantages: ['Handles outliers well', 'Flexible seasonal patterns', 'High accuracy'],
        disadvantages: ['Computationally intensive', 'Requires more data'],
        minDataPoints: 6,
        recommended: true
      },
      x11: {
        name: 'X11 (Census Bureau Method)',
        description: 'Traditional method used by statistical agencies',
        advantages: ['Well-established', 'Detailed analysis', 'Multiple passes'],
        disadvantages: ['Complex', 'Requires much data', 'Fixed assumptions'],
        minDataPoints: 8,
        recommended: false
      },
      classical: {
        name: 'Classical Decomposition',
        description: 'Simple additive/multiplicative decomposition',
        advantages: ['Simple to understand', 'Fast computation', 'Works with small datasets'],
        disadvantages: ['Sensitive to outliers', 'Rigid assumptions', 'Less accurate'],
        minDataPoints: 3,
        recommended: false
      },
      seats: {
        name: 'SEATS (Signal Extraction in ARIMA Time Series)',
        description: 'Advanced method using ARIMA modeling',
        advantages: ['Very accurate', 'Handles complex patterns', 'Statistical rigor'],
        disadvantages: ['Very complex', 'Requires expertise', 'Computationally expensive'],
        minDataPoints: 10,
        recommended: false
      }
    };

    res.json({
      success: true,
      methods,
      details: methodDetails
    });

  } catch (error) {
    console.error('Methods error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'methods_error'
      }
    });
  }
});

/**
 * POST /api/seasonal-decomposition/validate
 * Validate data and parameters before decomposition
 */
router.post('/validate', async (req, res) => {
  try {
    const { data, params = {} } = req.body;
    const { period = 12 } = params;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Data must be a non-empty array',
          type: 'validation_error'
        }
      });
    }

    const values = data.map(d => d.value || d);
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      info: [],
      dataPoints: values.length,
      period: period,
      minRequiredPoints: period * 2,
      recommendedPoints: period * 6
    };

    // Check data length
    if (values.length < period * 2) {
      validation.isValid = false;
      validation.errors.push(`Insufficient data: need at least ${period * 2} points for period ${period}`);
    } else if (values.length < period * 6) {
      validation.warnings.push(`Limited data: ${period * 6} points recommended for reliable results`);
    }

    // Check for non-numeric values
    const nonNumeric = values.filter(v => typeof v !== 'number' || isNaN(v));
    if (nonNumeric.length > 0) {
      validation.isValid = false;
      validation.errors.push(`Found ${nonNumeric.length} non-numeric values`);
    }

    // Check for negative values with multiplicative model
    if (params.model === 'multiplicative' && values.some(v => v <= 0)) {
      validation.isValid = false;
      validation.errors.push('Multiplicative model requires all positive values');
    }

    // Data quality checks
    const mean = stats.mean(values);
    const stdDev = stats.standardDeviation(values);
    const cv = stdDev / Math.abs(mean);

    if (cv > 2) {
      validation.warnings.push('High coefficient of variation detected. Consider data transformation.');
    }

    // Outlier detection
    const outliers = this.detectOutliers(values);
    if (outliers.length > values.length * 0.1) {
      validation.warnings.push(`High outlier percentage (${((outliers.length / values.length) * 100).toFixed(1)}%). Consider robust decomposition.`);
    }

    // Method-specific validation
    if (params.method === 'x11' && values.length < period * 8) {
      validation.warnings.push('X11 method requires more data points for stability');
    }

    res.json({
      success: true,
      validation
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'validation_error'
      }
    });
  }
});

/**
 * Helper function to detect outliers
 */
function detectOutliers(values) {
  const q1 = stats.quantile(values, 0.25);
  const q3 = stats.quantile(values, 0.75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return values.filter(v => v < lowerBound || v > upperBound);
}

export { router as seasonalDecompositionRoutes }; 
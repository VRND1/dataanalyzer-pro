import express from 'express';
import Joi from 'joi';
import { AnalyticsEngine } from '../services/analyticsEngine.js';

const router = express.Router();
const analyticsEngine = new AnalyticsEngine();

// Validation schemas
const dataFieldSchema = Joi.object({
  name: Joi.string().required(),
  value: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
  type: Joi.string().valid('number', 'text').required()
});

const analysisRequestSchema = Joi.object({
  data: Joi.array().items(dataFieldSchema).min(1).required(),
  analysis_type: Joi.string().valid('basic', 'time_series', 'anomaly', 'correlation', 'industry').required(),
  parameters: Joi.object().optional()
});

// POST /api/analyze
router.post('/', async (req, res) => {
  try {
    // Validate request
    const { error, value } = analysisRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: 'Validation error',
          details: error.details
        }
      });
    }

    const { data, analysis_type, parameters } = value;

    // Perform analysis
    const results = await analyticsEngine.analyzeData(data, analysis_type, parameters);

    res.json({
      success: true,
      data: results,
      analysis_type,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Analysis failed',
        request_id: req.id
      }
    });
  }
});

// GET /api/analyze/health
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'analytics',
    timestamp: new Date().toISOString()
  });
});

export { router as analyticsRoutes }; 
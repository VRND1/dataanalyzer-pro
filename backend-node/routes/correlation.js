import express from 'express';
import Joi from 'joi';
import * as ss from 'simple-statistics';

const router = express.Router();

// Validation schemas
const correlationRequestSchema = Joi.object({
  data: Joi.array().items(Joi.array().items(Joi.number())).min(2).required()
});

// POST /api/advanced/correlation
router.post('/', async (req, res) => {
  try {
    // Validate request
    const { error, value } = correlationRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: 'Validation error',
          details: error.details
        }
      });
    }

    const { data } = value;

    // Perform correlation analysis
    const results = await analyzeCorrelation(data);

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });

  } catch (error) {
    console.error('Correlation analysis error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Correlation analysis failed',
        request_id: req.id
      }
    });
  }
});

async function analyzeCorrelation(data) {
  try {
    const numVariables = data.length;
    if (numVariables < 2) {
      return { error: 'Insufficient data for correlation analysis' };
    }

    const correlationMatrix = {};
    const pValues = {};
    const strongCorrelations = [];

    // Calculate correlation matrix
    for (let i = 0; i < numVariables; i++) {
      correlationMatrix[`var_${i}`] = {};
      pValues[`var_${i}`] = {};
      
      for (let j = 0; j < numVariables; j++) {
        if (i === j) {
          correlationMatrix[`var_${i}`][`var_${j}`] = 1;
          pValues[`var_${i}`][`var_${j}`] = 0;
        } else {
          const correlation = ss.correlation(data[i], data[j]);
          correlationMatrix[`var_${i}`][`var_${j}`] = correlation;
          
          // Calculate p-value
          const n = data[i].length;
          const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
          pValues[`var_${i}`][`var_${j}`] = calculatePValue(t, n - 2);
        }
      }
    }

    // Find strong correlations
    for (let i = 0; i < numVariables; i++) {
      for (let j = i + 1; j < numVariables; j++) {
        const corr = correlationMatrix[`var_${i}`][`var_${j}`];
        if (Math.abs(corr) > 0.7) {
          strongCorrelations.push({
            variable1: `var_${i}`,
            variable2: `var_${j}`,
            correlation: corr,
            pValue: pValues[`var_${i}`][`var_${j}`],
            strength: Math.abs(corr) > 0.9 ? 'very_strong' : 
                     Math.abs(corr) > 0.8 ? 'strong' : 'moderate'
          });
        }
      }
    }

    return {
      correlationMatrix,
      pValues,
      strongCorrelations,
      summary: {
        totalVariables: numVariables,
        strongCorrelations: strongCorrelations.length,
        averageCorrelation: calculateAverageCorrelation(correlationMatrix)
      }
    };

  } catch (error) {
    console.error('Correlation analysis error:', error);
    return { error: 'Correlation analysis failed' };
  }
}

function calculatePValue(t, df) {
  // Simplified p-value calculation
  return Math.exp(-0.5 * t * t) / Math.sqrt(2 * Math.PI);
}

function calculateAverageCorrelation(matrix) {
  const keys = Object.keys(matrix);
  let sum = 0;
  let count = 0;
  
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      sum += Math.abs(matrix[keys[i]][keys[j]]);
      count++;
    }
  }
  
  return count > 0 ? sum / count : 0;
}

// GET /api/advanced/correlation/health
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'correlation_analysis',
    timestamp: new Date().toISOString()
  });
});

export { router as correlationRoutes }; 
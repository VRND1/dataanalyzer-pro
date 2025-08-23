// routes/arima.js
import express from 'express';
import Joi from 'joi';
import { analyze, prepareDailySeries, forecast } from '../services/arimaService.js';

const router = express.Router();

/** Validate request body */
const schema = Joi.object({
  data: Joi.array()
    .items(
      Joi.object({
        timestamp: Joi.number().required(), // ms since epoch
        value: Joi.number().required()
      })
    )
    .min(3) // allow short series, but we'll warn if <10
    .required(),
  parameters: Joi.object({
    p: Joi.number().integer().min(0).max(5).default(1),
    d: Joi.number().integer().min(0).max(2).default(1),
    q: Joi.number().integer().min(0).max(5).default(1),
    seasonal: Joi.boolean().default(false),
    seasonalPeriod: Joi.number().integer().min(2).max(24).default(12)
  }).default(),
  forecastPeriods: Joi.number().integer().min(1).max(60).default(12),
  confidenceLevel: Joi.number().min(0.5).max(0.99).default(0.95),
  log1p: Joi.boolean().default(true)
});

router.post('/analyze', async (req, res) => {
  try {
    const { value, error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }

    const { data, parameters, forecastPeriods, log1p } = value;

    // Run analysis (prepares daily, sorted, gap-filled series)
    const result = analyze(data, parameters, forecastPeriods, { log1p });

    // If caller asked for >12 periods earlier your code used generateForecast(...)
    // We standardize on the existing forecast(...) function we export.
    let extendedForecast = result.data.forecast;
    if (forecastPeriods > result.data.forecast.length) {
      const seriesForExt = prepareDailySeries(data);
      extendedForecast = forecast(
        seriesForExt,
        result.data.parameters.ar,
        result.data.parameters.ma,
        forecastPeriods
      );
    }

    // Calculate confidence intervals
    const se = Math.sqrt(result.data.metrics.rmse * result.data.metrics.rmse);
    const margin = 1.96 * se;
    const lower = extendedForecast.map(f => f - margin);
    const upper = extendedForecast.map(f => f + margin);

    return res.json({
      ok: true,
      warning: result.warning,
      parameters: result.data.parameters,
      metrics: result.data.metrics,
      fittedValues: result.data.fittedValues,
      forecast: extendedForecast,
      forecastIntervals: { lower, upper }
    });
  } catch (e) {
    console.error('ARIMA analyze failed:', e);
    return res.status(500).json({ ok: false, error: 'Internal error running ARIMA analysis' });
  }
});

export default router; 
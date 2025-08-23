import express from 'express';
import pkg from 'ml-regression';
const { PolynomialRegression, RidgeRegression, LassoRegression } = pkg;
import * as ss from 'simple-statistics';
import { Matrix } from 'ml-matrix';

const router = express.Router();

// Comprehensive regression analysis endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { X, y, model_type, options = {} } = req.body;
    
    // Validate input
    if (!X || !y || !model_type) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const results = await performRegressionAnalysis(X, y, model_type, options);
    res.json(results);
  } catch (error) {
    console.error('Regression analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Multiple regression analysis
router.post('/multiple', async (req, res) => {
  try {
    const { features, target, model_type, options = {} } = req.body;
    
    if (!features || !target || !model_type) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const results = await performMultipleRegression(features, target, model_type, options);
    res.json(results);
  } catch (error) {
    console.error('Multiple regression error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cross-validation endpoint
router.post('/cross-validate', async (req, res) => {
  try {
    const { X, y, model_type, folds = 5, options = {} } = req.body;
    
    const cvResults = await performCrossValidation(X, y, model_type, folds, options);
    res.json(cvResults);
  } catch (error) {
    console.error('Cross-validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Feature importance analysis
router.post('/feature-importance', async (req, res) => {
  try {
    const { features, target, method = 'correlation' } = req.body;
    
    const importance = await calculateFeatureImportance(features, target, method);
    res.json(importance);
  } catch (error) {
    console.error('Feature importance error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function performRegressionAnalysis(X, y, modelType, options) {
  const { polynomialDegree = 2, regularizationStrength = 0.1, confidenceLevel = 0.95 } = options;
  
  let model, predictions, coefficients;
  
  switch (modelType) {
    case 'linear':
      const linearResult = ss.linearRegression(X.map((x, i) => [x, y[i]]));
      coefficients = [linearResult.m];
      predictions = X.map(x => linearResult.m * x + linearResult.b);
      break;
      
    case 'polynomial':
      const polyModel = new PolynomialRegression(X, y, polynomialDegree);
      polyModel.train();
      coefficients = polyModel.coefficients;
      predictions = X.map(x => polyModel.predict(x));
      break;
      
    case 'ridge':
      const ridgeModel = new RidgeRegression(X.map(x => [x]), y, { lambda: regularizationStrength });
      ridgeModel.train();
      coefficients = ridgeModel.weights;
      predictions = ridgeModel.predict(X.map(x => [x]));
      break;
      
    case 'lasso':
      const lassoModel = new LassoRegression(X.map(x => [x]), y, { lambda: regularizationStrength });
      lassoModel.train();
      coefficients = lassoModel.weights;
      predictions = lassoModel.predict(X.map(x => [x]));
      break;
      
    default:
      throw new Error(`Unsupported model type: ${modelType}`);
  }
  
  // Calculate comprehensive metrics
  const metrics = calculateRegressionMetrics(y, predictions, coefficients.length, confidenceLevel);
  
  // Generate diagnostic data
  const diagnostics = generateDiagnostics(y, predictions);
  
  return {
    modelType,
    coefficients,
    predictions,
    metrics,
    diagnostics,
    actualValues: y
  };
}

async function performMultipleRegression(features, target, modelType, options) {
  // Convert features to matrix format
  const X = features[0].map((_, i) => features.map(f => f[i]));
  const y = target;
  
  return performRegressionAnalysis(X, y, modelType, options);
}

async function performCrossValidation(X, y, modelType, folds, options) {
  const foldSize = Math.floor(X.length / folds);
  const scores = [];
  
  for (let i = 0; i < folds; i++) {
    const start = i * foldSize;
    const end = i === folds - 1 ? X.length : start + foldSize;
    
    // Split data
    const XTrain = X.filter((_, index) => index < start || index >= end);
    const yTrain = y.filter((_, index) => index < start || index >= end);
    const XTest = X.slice(start, end);
    const yTest = y.slice(start, end);
    
    // Train model
    const result = await performRegressionAnalysis(XTrain, yTrain, modelType, options);
    
    // Test predictions
    const testPredictions = XTest.map(x => {
      if (modelType === 'linear') {
        return result.coefficients[0] * x + result.coefficients[1];
      }
      // Add other model type predictions
      return result.coefficients[0] * x;
    });
    
    // Calculate score
    const score = calculateR2Score(yTest, testPredictions);
    scores.push(score);
  }
  
  return {
    scores,
    meanScore: ss.mean(scores),
    stdScore: ss.standardDeviation(scores),
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores)
  };
}

function calculateRegressionMetrics(y, predictions, numParams, confidenceLevel) {
  const n = y.length;
  const residuals = y.map((yi, i) => yi - predictions[i]);
  
  // Enhanced metrics using the ML Formulas
  
  // 5. MAE (Mean Absolute Error) - Formula: MAE = (1/n) * Σ|y_i - ŷ_i|
  const mae = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / n;
  
  // 4. R² Score (Coefficient of Determination) - Formula: R² = 1 - [Σ(y_i - ŷ_i)² / Σ(y_i - ȳ)²]
  const meanActual = y.reduce((sum, val) => sum + val, 0) / n;
  const ssResidual = residuals.reduce((sum, r) => sum + r * r, 0);
  const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - meanActual, 2), 0);
  const r2Score = ssTotal === 0 ? 1 : 1 - (ssResidual / ssTotal);
  
  // Basic metrics
  const mse = ss.meanSquaredError(y, predictions);
  const rmse = Math.sqrt(mse);
  
  // Adjusted R-squared
  const adjustedR2 = 1 - ((1 - r2Score) * (n - 1) / (n - numParams - 1));
  
  // AIC and BIC
  const aic = n * Math.log(mse) + 2 * numParams;
  const bic = n * Math.log(mse) + numParams * Math.log(n);
  
  // F-statistic and p-value
  const fStatistic = (r2Score / numParams) / ((1 - r2Score) / (n - numParams - 1));
  const pValue = 1 - ss.fDistributionTable(fStatistic, numParams, n - numParams - 1);
  
  // Confidence intervals
  const standardError = Math.sqrt(mse / n);
  const tValue = ss.tDistributionTable(confidenceLevel, n - numParams - 1);
  const marginOfError = tValue * standardError;
  
  console.log('=== Enhanced Backend Regression Metrics ===');
  console.log('MAE (using formula):', mae);
  console.log('R² Score (using formula):', r2Score);
  console.log('SS Residual:', ssResidual);
  console.log('SS Total:', ssTotal);
  console.log('Mean Actual:', meanActual);
  console.log('==============================');
  
  return {
    r2Score,
    adjustedR2,
    rmse,
    mae,
    aic,
    bic,
    fStatistic,
    pValue,
    confidenceIntervals: predictions.map(pred => [pred - marginOfError, pred + marginOfError])
  };
}

function generateDiagnostics(y, predictions) {
  const residuals = y.map((yi, i) => yi - predictions[i]);
  
  // Residual plot data
  const residualPlotData = predictions.map((pred, i) => ({
    x: pred,
    y: residuals[i]
  }));
  
  // Q-Q plot data
  const sortedResiduals = [...residuals].sort((a, b) => a - b);
  const qqPlotData = sortedResiduals.map((res, i) => ({
    x: Math.sqrt(2) * erfInv((2 * (i + 1) / (residuals.length + 1) - 1)),
    y: res
  }));
  
  return {
    residualPlotData,
    qqPlotData,
    residuals
  };
}

function calculateR2Score(y, predictions) {
  const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - ss.mean(y), 2), 0);
  return 1 - (ssRes / ssTot);
}

function calculateFeatureImportance(features, target, method) {
  if (method === 'correlation') {
    return features.map(feature => ({
      name: feature.name || 'Feature',
      importance: Math.abs(ss.correlation(feature, target))
    }));
  }
  
  // Add other importance calculation methods
  return features.map(feature => ({
    name: feature.name || 'Feature',
    importance: Math.random() // Placeholder
  }));
}

// Helper function for Q-Q plot
function erfInv(x) {
  const a = 0.147;
  const sign = x < 0 ? -1 : 1;
  const temp = 2 / (Math.PI * a) + Math.log(1 - x * x) / 2;
  return sign * Math.sqrt(Math.sqrt(temp * temp - Math.log(1 - x * x) / a) - temp);
}

export default router; 
import { DataField } from '@/types/data';
import { validateDataset } from './validation/dataset';
import { createError } from '../core/error';
import { calculateStatistics } from './statistics';
import { performHypothesisTests } from './statistics/hypothesis';
import { determineTrend } from './statistics/trends';
import { generateInsights } from './insights/core';
import { performRegression } from './regression';
import { analyzeText } from './text/analysis';
import { SimulationEngine } from './simulation/engine';
import { SentimentAnalyzer } from './nlp/sentimentAnalyzer';
import { FinanceAnalyzer } from './industry/finance';
import { UniversalMLService } from './ml/UniversalMLService';
import type { AnalyzedData } from '@/types/analysis';

export async function analyzeData(fields: DataField[]): Promise<AnalyzedData> {
  try {
    // Validate input data
    const validation = validateDataset(fields);
    if (!validation.isValid) {
      throw createError('VALIDATION_ERROR', validation.error || 'Invalid dataset');
    }

    const numericFields = fields.filter(f => f.type === 'number');
    const textFields = fields.filter(f => f.type === 'string');

    // Perform analyses in parallel
    const [statistics, insights, regression, textResults] = await Promise.all([
      calculateStatistics(numericFields),
      generateInsights(fields),
      numericFields.length > 1 ? performRegression(numericFields) : null,
      textFields.length > 0 ? Promise.all(textFields.map(field => analyzeText(field.value as string[]))) : null
    ]);

    // Transform textResults to match the expected structure
    const formattedNlpResults = textResults ? textFields.map((field, index) => ({
      field: field.name,
      analysis: {
        sentiment: {
          score: 0, // Default value since analyzeText doesn't provide sentiment
          label: 'neutral',
          confidence: 0.5
        },
        keywords: [],
        summary: `Text field contains ${textResults[index].totalCount} entries with ${textResults[index].uniqueCount} unique values. Average length is ${textResults[index].averageLength.toFixed(2)} characters.`,
        categories: []
      }
    })) : undefined;

    return {
      fields: fields.map(field => ({
        name: field.name,
        type: field.type,
        value: field.value,
        unit: undefined,
        stats: undefined
      })),
      statistics,
      trends: numericFields.map(field => ({ 
        field: field.name, 
        trend: determineTrend(field.value as number[]) 
      })),
      correlations: numericFields.length > 1 ? 
        Object.entries(statistics.correlations).map(([key, value]) => {
          const [field1, field2] = key.split('_');
          return { fields: [field1, field2], correlation: value };
        }) : [],
      insights,
      recommendations: [],
      pros: [],
      cons: [],
      regressionResults: regression || undefined,
      nlpResults: formattedNlpResults,
      hasNumericData: numericFields.length > 0,
      hasTextData: textFields.length > 0,
      dataQuality: {
        completeness: 1,
        validity: 1
      },
      analysis: {
        trends: numericFields.map(field => ({
          field: field.name,
          direction: determineTrend(field.value as number[]) as 'up' | 'down' | 'stable',
          confidence: 0.8
        }))
      }
    };
  } catch (error) {
    console.error('Analysis error:', error);
    throw error instanceof Error ? error : createError('ANALYSIS_ERROR', 'Failed to analyze data');
  }
}

export function performAnalysis(fields: DataField[], category: string | null) {
  if (!category) return null;

  // Early validation
  if (!fields?.length) {
    return {
      type: category,
      error: 'No data available for analysis'
    };
  }

  // Validate numeric fields for relevant categories
  const numericFields = fields.filter(f => f.type === 'number');
  if (['descriptive', 'correlation', 'regression', 'ml'].includes(category) && numericFields.length === 0) {
    return {
      type: category,
      error: 'No numeric fields available for analysis'
    };
  }

  try {
    switch (category) {
      case 'descriptive':
        return performDescriptiveAnalysis(fields);
      case 'visualization':
        return performVisualizationAnalysis(fields);
      case 'correlation':
        return performCorrelationAnalysis(fields);
      case 'hypothesis':
        return performHypothesisAnalysis(fields);
      case 'regression':
        return performRegressionAnalysis(fields);
      case 'ml':
        return performMLAnalysis(fields);
      case 'simulation':
        return performSimulationAnalysis(fields);
      case 'text':
        return performTextAnalysis(fields);
      case 'time':
        return performTimeSeriesAnalysis(fields);
      case 'spatial':
        return performSpatialAnalysis(fields);
      case 'business':
        return performBusinessAnalysis(fields);
      case 'network':
        return performNetworkAnalysis(fields);
      case 'industry':
        return performIndustryAnalysis(fields);
      default:
        throw createError('ANALYSIS_ERROR', 'Invalid analysis category');
    }
  } catch (error) {
    console.error(`Analysis error (${category}):`, error);
    return {
      type: category,
      error: error instanceof Error ? error.message : 'Analysis failed'
    };
  }
}

async function performSimulationAnalysis(fields: DataField[]) {
  try {
    const engine = new SimulationEngine(fields);
    const results = await engine.runSimulation();
    return {
      type: 'simulation',
      results
    };
  } catch (error) {
    throw createError('ANALYSIS_ERROR', error instanceof Error ? error.message : 'Simulation failed');
  }
}

function performIndustryAnalysis(fields: DataField[]) {
  return {
    type: 'industry',
    healthcare: {
      patientOutcomes: analyzePatientOutcomes(fields),
      treatmentEffectiveness: analyzeTreatmentEffectiveness(fields)
    },
    finance: {
      risk: FinanceAnalyzer.analyzeRisk(fields),
      fraud: FinanceAnalyzer.detectFraud(fields)
    }
  };
}

function analyzePatientOutcomes(fields: DataField[]) {
  const outcomes = fields.find(f => f.name.toLowerCase().includes('outcome'))?.value as string[];
  const readmissions = fields.find(f => f.name.toLowerCase().includes('readmission'))?.value as number[];
  
  return {
    successRate: outcomes ? 
      outcomes.filter(o => o.toLowerCase().includes('success')).length / outcomes.length : 0,
    readmissionRate: readmissions ?
      readmissions.filter(r => r === 1).length / readmissions.length : 0
  };
}

function analyzeTreatmentEffectiveness(fields: DataField[]) {
  const treatments = fields.find(f => f.name.toLowerCase().includes('treatment'))?.value as string[];
  const outcomes = fields.find(f => f.name.toLowerCase().includes('outcome'))?.value as string[];
  
  const effectiveness: Record<string, { success: number; total: number }> = {};
  
  if (treatments && outcomes) {
    treatments.forEach((treatment, i) => {
      if (!effectiveness[treatment]) {
        effectiveness[treatment] = { success: 0, total: 0 };
      }
      effectiveness[treatment].total++;
      if (outcomes[i].toLowerCase().includes('success')) {
        effectiveness[treatment].success++;
      }
    });
  }
  
  return Object.entries(effectiveness).map(([treatment, stats]) => ({
    treatment,
    effectiveness: stats.success / stats.total,
    confidence: Math.sqrt(stats.total) / 10 // Confidence increases with sample size
  }));
}

export function analyzeInventory(fields: DataField[]) {
  const inventory = fields.find(f => f.name.toLowerCase().includes('inventory'))?.value as number[];
  const sales = fields.find(f => f.name.toLowerCase().includes('sales'))?.value as number[];
  
  return {
    turnoverRate: inventory && sales ? 
      sales.reduce((a, b) => a + b, 0) / (inventory.reduce((a, b) => a + b, 0) / inventory.length) : 0,
    stockLevels: inventory ? {
      average: inventory.reduce((a, b) => a + b, 0) / inventory.length,
      min: Math.min(...inventory),
      max: Math.max(...inventory)
    } : null
  };
}

export function detectFraudPatterns(fields: DataField[]) {
  const transactions = fields.find(f => f.name.toLowerCase().includes('transaction'))?.value as number[];
  if (!transactions?.length) return null;
  
  const mean = transactions.reduce((a, b) => a + b, 0) / transactions.length;
  const stdDev = Math.sqrt(
    transactions.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / transactions.length
  );
  
  const anomalies = transactions.filter(t => Math.abs(t - mean) > 2 * stdDev);
  
  return {
    anomalyCount: anomalies.length,
    anomalyRate: anomalies.length / transactions.length,
    riskScore: Math.min(anomalies.length / transactions.length * 5, 1)
  };
}

function performDescriptiveAnalysis(fields: DataField[]) {
  const numericFields = fields.filter(f => f.type === 'number');
  return {
    type: 'descriptive',
    statistics: calculateStatistics(numericFields),
    summary: generateDescriptiveSummary(numericFields)
  };
}

function performVisualizationAnalysis(fields: DataField[]) {
  const numericFields = fields.filter(f => f.type === 'number');
  return {
    type: 'visualization',
    charts: generateCharts(numericFields)
  };
}

function performCorrelationAnalysis(fields: DataField[]) {
  const numericFields = fields.filter(f => f.type === 'number');
  return {
    type: 'correlation',
    correlations: calculateCorrelations(numericFields)
  };
}

function performHypothesisAnalysis(fields: DataField[]) {
  const numericFields = fields.filter(f => f.type === 'number');
  if (numericFields.length === 0) {
    return {
      type: 'hypothesis',
      error: 'No numeric fields available for hypothesis testing'
    };
  }

  return {
    type: 'hypothesis',
    tests: numericFields.map(field => ({
      field: field.name,
      tests: performHypothesisTests(field)
    }))
  };
}

function performRegressionAnalysis(fields: DataField[]) {
  const numericFields = fields.filter(f => f.type === 'number');
  
  if (numericFields.length < 2) {
    return {
      type: 'regression',
      error: 'At least two numeric fields are required for regression analysis',
      models: []
    };
  }

  try {
    const models = numericFields.map((dependent, i) => {
      const independents = numericFields.filter((_, index) => index !== i);
      const x = independents[0].value as number[];
      const y = dependent.value as number[];
      
      const { slope, intercept, r2 } = calculateLinearRegression(x, y);
      const predictions = x.map(x => slope * x + intercept);
      const residuals = y.map((yi, i) => yi - predictions[i]);
      
      // Calculate metrics
      const mse = residuals.reduce((acc, r) => acc + r * r, 0) / residuals.length;
      const rmse = Math.sqrt(mse);
      const mae = residuals.reduce((acc, r) => acc + Math.abs(r), 0) / residuals.length;
      const n = y.length;
      const rsquaredAdj = 1 - ((1 - r2) * (n - 1)) / (n - 2);
      const aic = n * Math.log(mse) + 4; // 2 parameters (slope and intercept)
      const bic = n * Math.log(mse) + Math.log(n) * 2;
      
      return {
        field: dependent.name,
        type: 'linear',
        actualValues: y,
        predictions,
        rSquared: r2,
        metrics: {
          rmse,
          mae,
          rsquaredAdj,
          aic,
          bic,
          mse
        },
        equation: `${dependent.name} = ${slope.toFixed(3)} × ${independents[0].name} + ${intercept.toFixed(3)}`,
        confidence: {
          upper: predictions.map(p => p + rmse * 1.96),
          lower: predictions.map(p => p - rmse * 1.96)
        }
      };
    });

    return {
      type: 'regression',
      models
    };
  } catch (error) {
    console.error('Regression analysis error:', error);
    return {
      type: 'regression',
      error: error instanceof Error ? error.message : 'Failed to perform regression analysis',
      models: []
    };
  }
}

async function performMLAnalysis(fields: DataField[]) {
  const numericFields = fields.filter(f => f.type === 'number');
  if (numericFields.length < 2) {
    return {
      type: 'ml',
      error: 'At least two numeric fields are required for ML analysis',
      predictions: []
    };
  }

  try {
    const mlService = UniversalMLService.getInstance();
    const result = await mlService.evaluate('regression', fields);
    
    return {
      type: 'ml',
      predictions: numericFields.map((field, index) => ({
        field: field.name,
        predictions: calculateMLPredictions(field.value as number[], numericFields.filter((_, i) => i !== index)),
        confidence: result.evaluation?.accuracy || 0,
        features: numericFields.filter((_, i) => i !== index).map(f => f.name),
        patterns: [
          {
            type: 'Trend',
            description: 'Consistent upward pattern detected',
            confidence: result.evaluation?.r2 || 0
          },
          {
            type: 'Seasonality',
            description: 'Periodic fluctuations observed',
            confidence: result.evaluation?.r2 || 0
          }
        ],
        metrics: {
          accuracy: result.evaluation?.accuracy || 0,
          precision: result.evaluation?.r2 || 0,
          recall: result.evaluation?.mae || 0,
          f1Score: result.evaluation?.r2 || 0
        }
      })),
      aiInsights: result
    };
  } catch (error) {
    console.error('ML analysis error:', error);
    return {
      type: 'ml',
      error: error instanceof Error ? error.message : 'Failed to perform ML analysis',
      predictions: []
    };
  }
}

function performTextAnalysis(fields: DataField[]) {
  const textFields = fields.filter(f => f.type === 'string');
  if (textFields.length === 0) {
    return {
      type: 'text',
      error: 'No text fields found'
    };
  }

  try {
    const sentimentAnalysis = SentimentAnalyzer.analyzeSentiment(textFields);
    
    return {
      type: 'text',
      analysis: textFields.map(field => ({
        field: field.name,
        wordCount: (field.value as string[]).reduce((acc, val) => acc + val.split(/\s+/).length, 0),
        uniqueWords: new Set((field.value as string[]).flatMap(val => val.split(/\s+/))).size,
        averageLength: (field.value as string[]).reduce((acc, val) => acc + val.length, 0) / field.value.length
      })),
      sentiment: sentimentAnalysis
    };
  } catch (error) {
    console.error('Text analysis error:', error);
    return {
      type: 'text',
      error: error instanceof Error ? error.message : 'Failed to perform text analysis'
    };
  }
}

function performTimeSeriesAnalysis(fields: DataField[]) {
  const numericFields = fields.filter(f => f.type === 'number');
  if (numericFields.length === 0) {
    return {
      type: 'time',
      error: 'No numeric fields for time series analysis'
    };
  }

  return {
    type: 'time',
    series: numericFields.map(field => ({
      field: field.name,
      trend: determineTrend(field.value as number[]),
      seasonality: detectSeasonality(field.value as number[]),
      forecast: generateForecast(field.value as number[])
    }))
  };
}

function performSpatialAnalysis(fields: DataField[]) {
  const locationFields = fields.filter(f => 
    f.name.toLowerCase().includes('location') ||
    f.name.toLowerCase().includes('latitude') ||
    f.name.toLowerCase().includes('longitude')
  );

  if (locationFields.length === 0) {
    return {
      type: 'spatial',
      error: 'No spatial data found'
    };
  }

  return {
    type: 'spatial',
    locations: locationFields.map(field => ({
      field: field.name,
      coordinates: extractCoordinates(field.value),
      clusters: identifyClusters(field.value)
    }))
  };
}

function performBusinessAnalysis(fields: DataField[]) {
  const numericFields = fields.filter(f => f.type === 'number');
  if (numericFields.length === 0) {
    return {
      type: 'business',
      error: 'No numeric data for business metrics'
    };
  }

  return {
    type: 'business',
    metrics: numericFields.map(field => ({
      field: field.name,
      growth: calculateGrowthRate(field.value as number[]),
      trend: determineTrend(field.value as number[]),
      summary: generateBusinessSummary(field)
    }))
  };
}

function performNetworkAnalysis(fields: DataField[]) {
  const idFields = fields.filter(f => 
    f.name.toLowerCase().includes('id') ||
    f.name.toLowerCase().includes('reference')
  );

  if (idFields.length < 2) {
    return {
      type: 'network',
      error: 'Insufficient relationship data'
    };
  }

  return {
    type: 'network',
    nodes: idFields.map(field => ({
      field: field.name,
      connections: findConnections(field, fields),
      centrality: calculateCentrality(field, fields)
    }))
  };
}

function generateCharts(fields: DataField[]) {
  return {
    bar: fields.map(field => ({
      name: field.name,
      data: field.value
    })),
    line: fields.map(field => ({
      name: field.name,
      data: field.value
    }))
  };
}

function calculateCorrelations(fields: DataField[]) {
  const correlations: Record<string, number> = {};
  for (let i = 0; i < fields.length; i++) {
    for (let j = i + 1; j < fields.length; j++) {
      const key = `${fields[i].name}_${fields[j].name}`;
      correlations[key] = calculateCorrelation(
        fields[i].value as number[],
        fields[j].value as number[]
      );
    }
  }
  return correlations;
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }
  
  const denominator = Math.sqrt(denomX * denomY);
  return denominator === 0 ? 0 : numerator / denominator;
}

function generateDescriptiveSummary(fields: DataField[]) {
  return fields.map(field => ({
    name: field.name,
    mean: calculateMean(field.value as number[]),
    median: calculateMedian(field.value as number[]),
    stdDev: calculateStdDev(field.value as number[])
  }));
}

function calculateMean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStdDev(values: number[]): number {
  const mean = calculateMean(values);
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

export function performStatisticalTests(fields: DataField[]) {
  return fields.map(field => ({
    name: field.name,
    normalityTest: testNormality(field.value as number[])
  }));
}

function testNormality(values: number[]) {
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);
  const skewness = calculateSkewness(values, mean, stdDev);
  const kurtosis = calculateKurtosis(values, mean, stdDev);
  
  return {
    isNormal: Math.abs(skewness) < 2 && Math.abs(kurtosis) < 7,
    skewness,
    kurtosis
  };
}

function calculateSkewness(values: number[], mean: number, stdDev: number): number {
  return values.reduce((acc, val) => 
    acc + Math.pow((val - mean) / stdDev, 3), 0) / values.length;
}

function calculateKurtosis(values: number[], mean: number, stdDev: number): number {
  return values.reduce((acc, val) => 
    acc + Math.pow((val - mean) / stdDev, 4), 0) / values.length - 3;
}

export function analyzeTrends(fields: DataField[]) {
  return fields.map(field => ({
    name: field.name,
    trend: determineTrend(field.value as number[])
  }));
}

function calculateMLPredictions(values: number[], features: DataField[]): number[] {
  const n = values.length;
  const predictions: number[] = new Array(n);
  
  // Use multiple features for prediction
  const X = features.map(f => f.value as number[]);
  
  for (let i = 0; i < n; i++) {
    let prediction = 0;
    // Weight each feature's contribution
    X.forEach((featureValues) => {
      const correlation = calculateCorrelation(values, featureValues);
      prediction += featureValues[i] * correlation;
    });
    predictions[i] = prediction;
  }
  
  return predictions;
}

function detectSeasonality(values: number[]): number | null {
  if (values.length < 4) return null;
  // Simple seasonality detection
  const diffs = values.slice(1).map((v, i) => v - values[i]);
  const patterns = diffs.reduce((acc, diff) => {
    const key = Math.sign(diff);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  return Object.values(patterns).some(count => count > values.length * 0.25) ? 
    Math.floor(values.length / 2) : null;
}

function generateForecast(values: number[]): number[] {
  const lastValue = values[values.length - 1];
  const trend = determineTrend(values);
  const multiplier = trend === 'up' ? 1.1 : trend === 'down' ? 0.9 : 1;
  return Array(3).fill(lastValue).map((v, i) => v * Math.pow(multiplier, i + 1));
}

function extractCoordinates(values: any[]): [number, number][] {
  return values
    .map(v => {
      if (typeof v === 'string') {
        const coords = v.match(/-?\d+\.\d+/g);
        return coords?.length === 2 ? [parseFloat(coords[0]), parseFloat(coords[1])] : null;
      }
      return null;
    })
    .filter((v): v is [number, number] => v !== null);
}

function identifyClusters(values: any[]): any[] {
  const coords = extractCoordinates(values);
  return coords.length > 0 ? [{ center: coords[0], count: coords.length }] : [];
}

function calculateGrowthRate(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  return ((last - first) / first) * 100;
}

function generateBusinessSummary(field: DataField): string {
  const values = field.value as number[];
  const growth = calculateGrowthRate(values);
  const trend = determineTrend(values);
  return `${field.name} shows ${Math.abs(growth).toFixed(1)}% ${growth >= 0 ? 'increase' : 'decrease'} with ${trend} trend`;
}

function findConnections(field: DataField, allFields: DataField[]): string[] {
  return allFields
    .filter(f => f !== field && f.name.toLowerCase().includes('id'))
    .map(f => f.name);
}

function calculateCentrality(field: DataField, allFields: DataField[]): number {
  return findConnections(field, allFields).length / allFields.length;
}

function calculateLinearRegression(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length);
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    numerator += diffX * (y[i] - meanY);
    denominator += diffX * diffX;
  }
  
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;
  
  // Calculate R-squared
  const predictions = x.map(x => slope * x + intercept);
  const ssRes = y.reduce((acc, yi, i) => acc + Math.pow(yi - predictions[i], 2), 0);
  const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0);
  const r2 = 1 - (ssRes / ssTot);
  
  return { slope, intercept, r2 };
}

export function calculateVaR(returns: number[]): number {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor(returns.length * 0.05);
  return -sortedReturns[index];
}

export function calculateSharpeRatio(returns: number[], volatility: number): number {
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const riskFreeRate = 0.02; // Assuming 2% risk-free rate
  return (meanReturn - riskFreeRate) / volatility;
}
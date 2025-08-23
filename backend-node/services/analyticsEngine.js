import * as ss from 'simple-statistics';
import { Matrix } from 'ml-matrix';
import { PolynomialRegression } from 'ml-regression';


export class AnalyticsEngine {
  constructor() {
  }

  prepareData(data) {
    const numericData = {};
    const textData = {};
    
    for (const field of data) {
      if (field.type === 'number') {
        try {
          numericData[field.name] = parseFloat(field.value);
        } catch (error) {
          console.warn(`Could not convert ${field.name} to number`);
        }
      } else {
        textData[field.name] = String(field.value);
      }
    }
    
    return {
      numeric: numericData,
      text: textData
    };
  }

  async analyzeData(data, analysisType, parameters = {}) {
    try {
      const preparedData = this.prepareData(data);
      const results = {};

      // Basic statistics for numeric data
      if (Object.keys(preparedData.numeric).length > 0) {
        const numericValues = Object.values(preparedData.numeric);
        results.statistics = {
          mean: ss.mean(numericValues),
          median: ss.median(numericValues),
          std: ss.standardDeviation(numericValues),
          min: ss.min(numericValues),
          max: ss.max(numericValues),
          variance: ss.variance(numericValues),
          skewness: ss.sampleSkewness(numericValues),
          kurtosis: ss.sampleKurtosis(numericValues)
        };

        // Perform specific analysis based on type
        switch (analysisType) {
          case 'time_series':
            results.time_series = this.basicTimeSeriesAnalysis(numericValues, parameters);
            break;
            
          case 'holt_forecast':
            results.holt_forecast = this.basicHoltForecast(numericValues, parameters);
            break;
            
          case 'anomaly':
            results.anomalies = this.basicAnomalyDetection(numericValues, parameters);
            break;
            
          case 'correlation':
            results.correlation = this.basicCorrelationAnalysis(preparedData.numeric);
            break;
            
          case 'industry':
            const industry = (parameters.industry || '').toLowerCase();
            results.industry_insights = this.getIndustryInsights(preparedData.numeric, industry);
            break;
            
          default:
            results.basic_analysis = {
              count: numericValues.length,
              range: results.statistics.max - results.statistics.min,
              coefficient_of_variation: results.statistics.std / results.statistics.mean
            };
        }
      }

      // Text analysis if available
      if (Object.keys(preparedData.text).length > 0) {
        results.text_analysis = {
          field_count: Object.keys(preparedData.text).length,
          fields: Object.keys(preparedData.text),
          total_characters: Object.values(preparedData.text).reduce((sum, text) => sum + text.length, 0)
        };
      }

      return results;
    } catch (error) {
      console.error('Analysis error:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  getIndustryInsights(numericData, industry) {
    switch (industry) {
      case 'finance':
        return {
          note: 'Finance industry: focus on revenue growth and risk management.',
          custom_metric: (numericData.revenue || 0) * 1.1,
          risk_score: this.calculateRiskScore(numericData),
          growth_rate: this.calculateGrowthRate(numericData)
        };
        
      case 'healthcare':
        return {
          note: 'Healthcare industry: patient satisfaction and compliance are key.',
          custom_metric: (numericData.customers || 0) * 0.8,
          patient_satisfaction_score: this.calculatePatientSatisfaction(numericData),
          compliance_rate: this.calculateComplianceRate(numericData)
        };
        
      case 'retail':
        return {
          note: 'Retail industry: customer experience and inventory management are critical.',
          custom_metric: (numericData.sales || 0) * 1.2,
          customer_satisfaction: this.calculateCustomerSatisfaction(numericData),
          inventory_turnover: this.calculateInventoryTurnover(numericData)
        };
        
      case 'technology':
        return {
          note: 'Technology industry: innovation and user engagement drive success.',
          custom_metric: (numericData.users || 0) * 1.5,
          innovation_score: this.calculateInnovationScore(numericData),
          user_engagement: this.calculateUserEngagement(numericData)
        };
        
      default:
        return {
          note: `No custom logic for industry: ${industry}`,
          general_metrics: {
            total_value: Object.values(numericData).reduce((sum, val) => sum + val, 0),
            average_value: Object.values(numericData).reduce((sum, val) => sum + val, 0) / Object.values(numericData).length
          }
        };
    }
  }

  calculateRiskScore(data) {
    // Simple risk calculation based on variance
    const values = Object.values(data);
    if (values.length === 0) return 0;
    
    const mean = ss.mean(values);
    const variance = ss.variance(values);
    return Math.min(100, (variance / mean) * 100);
  }

  calculateGrowthRate(data) {
    // Simple growth rate calculation
    const values = Object.values(data);
    if (values.length < 2) return 0;
    
    const sortedValues = values.sort((a, b) => a - b);
    return ((sortedValues[sortedValues.length - 1] - sortedValues[0]) / sortedValues[0]) * 100;
  }

  calculatePatientSatisfaction(data) {
    // Mock patient satisfaction calculation
    const values = Object.values(data);
    if (values.length === 0) return 0;
    
    const avg = ss.mean(values);
    return Math.min(100, Math.max(0, (avg / 100) * 100));
  }

  calculateComplianceRate(data) {
    // Mock compliance rate calculation
    const values = Object.values(data);
    if (values.length === 0) return 0;
    
    const compliant = values.filter(v => v > 80).length;
    return (compliant / values.length) * 100;
  }

  calculateCustomerSatisfaction(data) {
    // Mock customer satisfaction calculation
    const values = Object.values(data);
    if (values.length === 0) return 0;
    
    const avg = ss.mean(values);
    return Math.min(100, Math.max(0, (avg / 100) * 100));
  }

  calculateInventoryTurnover(data) {
    // Mock inventory turnover calculation
    const values = Object.values(data);
    if (values.length === 0) return 0;
    
    return ss.mean(values) / 30; // Assuming monthly turnover
  }

  calculateInnovationScore(data) {
    // Mock innovation score calculation
    const values = Object.values(data);
    if (values.length === 0) return 0;
    
    const growth = this.calculateGrowthRate(data);
    return Math.min(100, Math.max(0, growth + 50));
  }

  calculateUserEngagement(data) {
    // Mock user engagement calculation
    const values = Object.values(data);
    if (values.length === 0) return 0;
    
    const avg = ss.mean(values);
    return Math.min(100, Math.max(0, (avg / 1000) * 100));
  }

  // Basic implementations to replace UniversalAnalytics methods
  basicTimeSeriesAnalysis(data, parameters = {}) {
    if (data.length === 0) return { error: 'No data provided' };
    
    const mean = ss.mean(data);
    const trend = data.length > 1 ? (data[data.length - 1] - data[0]) / data.length : 0;
    
    return {
      trend: trend > 0 ? 'increasing' : 'decreasing',
      trend_strength: Math.abs(trend),
      seasonality: 'none',
      forecast: data.map((_, i) => mean + (trend * i)),
      confidence: 0.7
    };
  }

  basicHoltForecast(data, parameters = {}) {
    if (data.length < 2) return { error: 'Insufficient data for forecasting' };
    
    const periods = parameters.periods || 5;
    const alpha = parameters.alpha || 0.3;
    const beta = parameters.beta || 0.1;
    
    // Simple exponential smoothing
    let level = data[0];
    let trend = data.length > 1 ? (data[1] - data[0]) : 0;
    
    const forecast = [];
    for (let i = 0; i < periods; i++) {
      const prediction = level + (trend * (i + 1));
      forecast.push(prediction);
    }
    
    return {
      forecast,
      level,
      trend,
      alpha,
      beta,
      confidence: 0.6
    };
  }

  basicAnomalyDetection(data, parameters = {}) {
    if (data.length === 0) return { error: 'No data provided' };
    
    const mean = ss.mean(data);
    const std = ss.standardDeviation(data);
    const threshold = parameters.threshold || 2;
    
    const anomalies = data.map((value, index) => ({
      index,
      value,
      isAnomaly: Math.abs(value - mean) > threshold * std,
      severity: Math.abs(value - mean) / std
    }));
    
    return {
      anomalies: anomalies.filter(a => a.isAnomaly),
      total_anomalies: anomalies.filter(a => a.isAnomaly).length,
      threshold,
      mean,
      std
    };
  }

  basicCorrelationAnalysis(data) {
    const fields = Object.keys(data);
    if (fields.length < 2) return { error: 'Need at least 2 fields for correlation' };
    
    const correlations = {};
    for (let i = 0; i < fields.length; i++) {
      for (let j = i + 1; j < fields.length; j++) {
        const field1 = fields[i];
        const field2 = fields[j];
        const correlation = ss.correlation([data[field1]], [data[field2]]);
        correlations[`${field1}_${field2}`] = correlation;
      }
    }
    
    return {
      correlations,
      strongest_correlation: Object.entries(correlations)
        .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))[0]
    };
  }
} 
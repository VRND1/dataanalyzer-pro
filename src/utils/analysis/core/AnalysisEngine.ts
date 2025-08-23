import { DataField } from '@/types/data';
import { createError } from '@/utils/core/error';
import { NetworkAnalysis } from '../network/NetworkAnalysis';
import { UniversalMLService } from '../ml/UniversalMLService';

export class AnalysisEngine {
  private fields: DataField[];
  private networkAnalysis: NetworkAnalysis;
  private mlService: UniversalMLService;

  constructor(fields: DataField[]) {
    this.fields = fields;
    this.networkAnalysis = new NetworkAnalysis(fields);
    this.mlService = UniversalMLService.getInstance();
    this.validateFields();
  }

  private validateFields() {
    if (!this.fields?.length) {
      throw createError('VALIDATION_ERROR', 'No fields provided for analysis');
    }

    const invalidFields = this.fields.filter(field => 
      !field.name || !field.type || !Array.isArray(field.value)
    );

    if (invalidFields.length > 0) {
      throw createError(
        'VALIDATION_ERROR',
        `Invalid fields found: ${invalidFields.map(f => f.name).join(', ')}`
      );
    }
  }

  async analyze(category?: string) {
    try {
      this.validateFields();
      
      // Filter numeric fields and ensure they contain valid numbers
      const numericFields = this.fields.filter(field => {
        if (field.type !== 'number') return false;
        const values = field.value as number[];
        return values && values.length > 0 && values.every(v => typeof v === 'number' && !isNaN(v));
      });

      if (numericFields.length === 0) {
        throw createError('VALIDATION_ERROR', 'No valid numeric fields found for analysis');
      }

      // Return specific analysis based on category
      switch (category) {
        case 'network':
          return { networkAnalysis: this.networkAnalysis.analyze() };
        case 'ml':
          return { mlAnalysis: await this.mlService.evaluate('regression', this.fields) };
        case 'sentiment':
          return { sentimentAnalysis: this.performSentimentAnalysis(this.fields) };
        case 'topics':
          return { topics: this.extractTopics(this.fields) };
        case 'entities':
          return { entities: this.extractEntities(this.fields) };
        case 'summary':
          return { textSummary: this.generateTextSummary(this.fields) };
        default:
          return {
            statistics: {
              descriptive: this.calculateDescriptiveStats(numericFields),
              correlations: this.calculateCorrelations(numericFields)
            },
            hypothesisTests: this.performHypothesisTests(numericFields),
            networkAnalysis: this.networkAnalysis.analyze(),
            mlAnalysis: await this.mlService.evaluate('regression', this.fields)
          };
      }
    } catch (error) {
      console.error('Analysis error:', error);
      throw createError('ANALYSIS_ERROR', error instanceof Error ? error.message : 'Analysis failed');
    }
  }

  private calculateDescriptiveStats(fields: DataField[]) {
    const stats: Record<string, any> = {};
    
    fields.forEach(field => {
      const values = field.value as number[];
      
      if (!values || values.length === 0) {
        throw createError('VALIDATION_ERROR', `Field ${field.name} has no valid data`);
      }
      
      if (!values.every(v => typeof v === 'number' && !isNaN(v))) {
        throw createError('VALIDATION_ERROR', `Field ${field.name} contains non-numeric values`);
      }

      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      
      // Sort values for median and quartiles
      const sorted = [...values].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      
      // Calculate standard deviation
      const squaredDiffs = values.map(x => Math.pow(x - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      stats[field.name] = {
        mean,
        median,
        standardDeviation: stdDev,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    });
    
    return stats;
  }

  private calculateCorrelations(fields: DataField[]) {
    const correlations: Record<string, number> = {};
    
    for (let i = 0; i < fields.length; i++) {
      for (let j = i + 1; j < fields.length; j++) {
        const field1 = fields[i];
        const field2 = fields[j];
        const values1 = field1.value as number[];
        const values2 = field2.value as number[];
        
        const correlation = this.calculatePearsonCorrelation(values1, values2);
        correlations[`${field1.name}_${field2.name}`] = correlation;
      }
    }
    
    return correlations;
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private performHypothesisTests(fields: DataField[]) {
    if (fields.length < 2) {
      return [];
    }

    const tests = [];
    
    // Perform t-test for each pair of fields
    for (let i = 0; i < fields.length; i++) {
      for (let j = i + 1; j < fields.length; j++) {
        const field1 = fields[i];
        const field2 = fields[j];
        const result = this.performTTest(
          field1.value as number[],
          field2.value as number[]
        );
        
        tests.push({
          type: 'ttest',
          fields: [field1.name, field2.name],
          result
        });
      }
    }
    
    return tests;
  }

  private performTTest(sample1: number[], sample2: number[]) {
    const n1 = sample1.length;
    const n2 = sample2.length;
    
    const mean1 = sample1.reduce((a, b) => a + b, 0) / n1;
    const mean2 = sample2.reduce((a, b) => a + b, 0) / n2;
    
    const variance1 = sample1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (n1 - 1);
    const variance2 = sample2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (n2 - 1);
    
    const pooledVariance = ((n1 - 1) * variance1 + (n2 - 1) * variance2) / (n1 + n2 - 2);
    const standardError = Math.sqrt(pooledVariance * (1/n1 + 1/n2));
    
    const tStatistic = Math.abs(mean1 - mean2) / standardError;
    
    // Simplified p-value calculation (using normal approximation)
    const pValue = 2 * (1 - this.normalCDF(tStatistic));
    
    return {
      statistic: tStatistic,
      pValue,
      significant: pValue < 0.05
    };
  }

  private normalCDF(x: number): number {
    // Approximation of the normal cumulative distribution function
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - probability : probability;
  }

  private performSentimentAnalysis(fields: DataField[]) {
    // Basic sentiment analysis implementation
    const sentiments: Record<string, { positive: number; negative: number; neutral: number }> = {};
    
    fields.forEach(field => {
      const values = field.value as string[];
      let positive = 0;
      let negative = 0;
      let neutral = 0;
      
      values.forEach(text => {
        // Simple sentiment analysis based on positive/negative words
        const positiveWords = ['good', 'great', 'excellent', 'positive', 'happy', 'love'];
        const negativeWords = ['bad', 'poor', 'terrible', 'negative', 'sad', 'hate'];
        
        const words = text.toLowerCase().split(/\s+/);
        const positiveCount = words.filter(w => positiveWords.includes(w)).length;
        const negativeCount = words.filter(w => negativeWords.includes(w)).length;
        
        if (positiveCount > negativeCount) positive++;
        else if (negativeCount > positiveCount) negative++;
        else neutral++;
      });
      
      sentiments[field.name] = {
        positive: positive / values.length,
        negative: negative / values.length,
        neutral: neutral / values.length
      };
    });
    
    return sentiments;
  }

  private extractTopics(fields: DataField[]) {
    // Basic topic extraction implementation
    const topics: Record<string, string[]> = {};
    
    fields.forEach(field => {
      const values = field.value as string[];
      const wordFrequencies: Record<string, number> = {};
      
      values.forEach(text => {
        const words = text.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 3) { // Skip short words
            wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
          }
        });
      });
      
      // Get top 5 most frequent words as topics
      topics[field.name] = Object.entries(wordFrequencies)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);
    });
    
    return topics;
  }

  private extractEntities(fields: DataField[]) {
    // Basic entity extraction implementation
    const entities: Record<string, string[]> = {};
    
    fields.forEach(field => {
      const values = field.value as string[];
      const foundEntities = new Set<string>();
      
      values.forEach(text => {
        // Simple entity detection based on capitalization
        const words = text.split(/\s+/);
        words.forEach(word => {
          if (word.length > 1 && word[0] === word[0].toUpperCase()) {
            foundEntities.add(word);
          }
        });
      });
      
      entities[field.name] = Array.from(foundEntities);
    });
    
    return entities;
  }

  private generateTextSummary(fields: DataField[]) {
    // Basic text summarization implementation
    const summaries: Record<string, string> = {};
    
    fields.forEach(field => {
      const values = field.value as string[];
      if (values.length === 0) return;
      
      // Simple summarization: take first sentence of each text
      const firstSentences = values.map(text => {
        const sentences = text.split(/[.!?]+/);
        return sentences[0]?.trim() || '';
      }).filter(Boolean);
      
      summaries[field.name] = firstSentences.join('. ');
    });
    
    return summaries;
  }
}
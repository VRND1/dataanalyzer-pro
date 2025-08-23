import type { ValidationResult } from '@/types/validation';

export interface DataField {
  name: string;
  type: 'number' | 'string' | 'date' | 'boolean';
  value: any[];
}

export interface ParsedData {
  headers: string[];
  rows: any[][];
  summary: {
    totalRows: number;
    totalColumns: number;
    dataTypes: string[];
  };
}

export { ValidationResult };

export interface AnalysisResult {
  statistics: {
    fields: Record<string, FieldStatistics>;
    correlations: Record<string, number>;
  };
  insights: string[];
  regression?: RegressionResult[];
  textAnalysis?: TextAnalysisResult[];
}

export interface FieldStatistics {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  sampleSize: number;
}

export interface RegressionResult {
  field: string;
  coefficients: number[];
  intercept: number;
  rSquared: number;
  predictions: number[];
  equation: string;
}

export interface TextAnalysisResult {
  field: string;
  analysis: {
    totalCount: number;
    uniqueCount: number;
    averageLength: number;
  };
}
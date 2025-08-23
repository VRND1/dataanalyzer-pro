export interface PipelineStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface AnalysisResult {
  statistics?: any;
  insights?: any;
  regression?: any;
  textAnalysis?: any;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface StatisticalResult {
  mean: number;
  median: number;
  stdDev: number;
  skewness: number;
  kurtosis: number;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predictions: number[];
}

export interface TimeSeriesResult {
  trend: string;
  seasonality: number | null;
  forecast: number[];
}

export interface MLResult {
  field: string;
  predictions: number[];
  confidence: number;
  features: string[];
  patterns: {
    type: string;
    description: string;
    confidence: number;
  }[];
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
}

export interface TextAnalysisResult {
  sentiment: number;
  keywords: string[];
  topics: string[];
}

export interface BusinessAnalysisResult {
  summary: string;
  growthRate: number;
  riskMetrics: {
    var: number;
    sharpeRatio: number;
  };
}

export type AnalysisCategory = 
  | 'statistical'
  | 'regression'
  | 'timeSeries'
  | 'ml'
  | 'text'
  | 'business'
  | 'industry'
  | 'nlp';
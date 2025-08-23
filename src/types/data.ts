export interface DataField {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'date';
  value: any[];
  nullPercentage?: number;
  stats?: {
    mean?: number;
    median?: number;
    min?: number;
    max?: number;
    standardDeviation?: number;
    trend?: 'up' | 'down' | 'stable';
    metrics?: {
      trend: 'up' | 'down' | 'stable';
      confidence: number;
    };
    trendStrength?: number;
    growthRate?: number;
    volatility?: number;
    outliers?: number[];
    value?: number[];
    avg?: number;
    quartiles?: {
      q1: number;
      q2: number;
      q3: number;
    };
  };
}

export type DataRow = Record<string, string | number | boolean | Date>;

export interface DataType {
  [key: string]: 'string' | 'number' | 'boolean' | 'date';
}

export interface DescriptiveStats {
  mean?: number;
  median?: number;
  standardDeviation?: number;
  min?: number;
  max?: number;
  quartiles?: {
    q1: number;
    q2: number;
    q3: number;
  };
}

export interface AnalysisResult {
  statistics?: {
    descriptive: Record<string, DescriptiveStats>;
    correlations?: Record<string, number>;
  };
  hypothesisTests?: Array<{
    type: string;
    fields: string[];
    result: {
      statistic: number;
      pValue: number;
      significant: boolean;
    };
  }>;
  insights?: string[];
  error?: string;
}

export interface AnalyzedData {
  fields: DataField[];
  statistics: {
    mean: Record<string, number>;
    median: Record<string, number>;
    standardDeviation: Record<string, number>;
    correlations: Record<string, number>;
  };
  insights: string[];
  mlAnalysis?: {
    predictions: Record<string, number[]>;
    confidence: number;
    features: string[];
  };
  nlpResults?: Array<{
    field: string;
    analysis: {
      sentiment: {
        score: number;
        label: string;
        confidence: number;
      };
      keywords: string[];
      summary: string;
      categories: string[];
    };
  }>;
  predictions?: Array<{
    fieldName: string;
    predictions: number[];
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercentage: number;
  }>;
  regressionResults?: Array<{
    field: string;
    coefficients: number[];
    intercept: number;
    rSquared: number;
    predictions: number[];
    equation: string;
  }>;
  timeSeriesResults?: Array<{
    field: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    seasonality: number | null;
    forecast: number[];
    confidence: number;
    components: {
      trend: number[];
      seasonal: number[];
      residual: number[];
    };
  }>;
  hasNumericData: boolean;
  hasTextData: boolean;
  dataQuality: {
    completeness: number;
    validity: number;
  };
  originalData?: any;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileData {
  name: string;
  type: 'csv';
  content: {
    fields: DataField[];
  };
}

export interface AnalysisData {
  fields: DataField[];
}

export interface NLPResponse {
  sentiment: {
    score: number;
    label: string;
    confidence: number;
  };
  keywords: string[];
  summary: string;
  categories: string[];
}

export interface QueryResponse {
  answer: string;
  data?: DataField[];
  visualization?: {
    type: 'bar' | 'line' | 'scatter';
    title?: string;
  };
}
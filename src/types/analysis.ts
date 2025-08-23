export interface AnalysisSettings {
  enableML: boolean;
  enableNLP: boolean;
  enablePredictive: boolean;
  enableRegression: boolean;
  enableTimeSeries: boolean;
}

export type FieldType = 'string' | 'number' | 'boolean' | 'date';

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

export interface StrategyRecommendation {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: 'short' | 'medium' | 'long';
}

export interface FieldStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
  trend?: 'up' | 'down' | 'stable';
  metrics?: {
    trend: 'up' | 'down' | 'stable';
    confidence: number;
  };
  trendStrength: number;
  growthRate: number;
  volatility: number;
  outliers: number[];
  value: number[];
  avg: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
}

export interface AnalyzedData {
  fields: DataField[];
  statistics: Record<string, any>;
  trends: { field: string; trend: 'up' | 'down' | 'stable' }[];
  correlations: { fields: string[]; correlation: number }[];
  insights: string[];
  recommendations: string[];
  pros: string[];
  cons: string[];
  error?: string;
  models?: Array<{
    field: string;
    type: string;
    metrics: {
      rSquared: number;
      rmse: number;
      mae: number;
      rsquaredAdj: number;
    };
  }>;
  analysis: {
    trends: Array<{
      field: string;
      direction: 'up' | 'down' | 'stable';
      confidence: number;
    }>;
  };
  mlAnalysis?: {
    predictions: number[];
    evaluation: {
      accuracy: number;
      loss: number;
    };
    training: {
      duration: number;
      history: {
        loss: number[];
        val_loss?: number[];
      };
    };
  };
  mlPredictions?: Record<string, number[]>;
  mlConfidence?: number;
  mlFeatures?: string[];
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

export interface Analysis {
  insights: string[];
  recommendations: string[];
  pros: string[];
  cons: string[];
}

export type AnalysisCategory = 'descriptive' | 'visualization' | 'regression' | 'predictive' | 'insights';

export interface AnalysisData {
  fields: DataField[];
}

export interface AnalysisResults {
  insights: string[];
  recommendations: string[];
  pros: string[];
  cons: string[];
  regression?: {
    model: any;
    predictions: number[];
    rSquared: number;
  };
  visualization?: {
    type: string;
    data: any;
  };
}
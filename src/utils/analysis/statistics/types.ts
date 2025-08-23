import { DataField } from '@/types/data';

export type Trend = 'up' | 'down' | 'stable';

export interface FieldStats {
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  sampleSize: number;
  trend: Trend;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
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
  hasNumericData: boolean;
  hasTextData: boolean;
  dataQuality: {
    completeness: number;
    validity: number;
  };
}

export interface StatisticalAnalysis {
  fieldName: string;
  stats: FieldStats;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}
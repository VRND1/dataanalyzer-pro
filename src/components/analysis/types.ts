import { TimeSeriesResult } from '../../utils/analysis/timeSeries';

export interface FieldStatsProps {
  field: {
    name: string;
    values: number[];
  };
}

export interface TimeSeriesData {
  timestamp: number;
  value: number;
  field?: string;
}

export interface TimeSeriesAnalysisProps {
  data?: TimeSeriesData[];
}

export interface TimeSeriesViewProps {
  results: TimeSeriesResult[];
  isLoading?: boolean;
  error?: string | null;
}

export interface ModelPerformance {
  rmse: number;
}

export type TimeSeriesModel = 'arima' | 'exponential' | 'prophet' | 'lstm'; 
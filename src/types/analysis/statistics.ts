// Define types for statistical analysis
export interface StatisticData {
  id: string;
  name: string;
  value: number;
  unit?: string;
}

export interface StatisticalAnalysis {
  statistics: StatisticData[];
  summary: string;
  confidence: number;
} 
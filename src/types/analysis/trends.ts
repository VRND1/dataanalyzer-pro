// Define types for trend analysis
export interface TrendData {
  id: string;
  name: string;
  value: number;
  change: number;
  timestamp: Date;
}

export interface TrendAnalysis {
  trends: TrendData[];
  period: string;
  summary: string;
} 
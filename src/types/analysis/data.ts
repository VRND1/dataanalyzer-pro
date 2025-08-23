// Define types for data analysis
export interface DataPoint {
  id: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface DataAnalysis {
  dataPoints: DataPoint[];
  summary: string;
  period: string;
} 
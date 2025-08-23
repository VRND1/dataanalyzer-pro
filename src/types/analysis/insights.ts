// Define types for data insights
export interface InsightData {
  id: string;
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
  category: string;
}

export interface InsightAnalysis {
  insights: InsightData[];
  summary: string;
  recommendations: string[];
} 
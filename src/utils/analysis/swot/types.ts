export interface SWOTItem {
  description: string;
  impact?: 'low' | 'medium' | 'high';
  priority?: number;
  category?: string;
  confidence?: number;
  source?: string;
}

export interface SWOTScore {
  internal: number;
  external: number;
  overall: number;
  confidence: number;
}

export interface SWOTAnalysis {
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  score: SWOTScore;
  metadata?: {
    totalItems: number;
    highImpactCount: number;
    mediumImpactCount: number;
    lowImpactCount: number;
    analysisDate: string;
    dataSource: string;
  };
} 
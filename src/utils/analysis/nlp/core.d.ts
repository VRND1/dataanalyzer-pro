import type { DataField } from '../../../types/data';

export interface NLPAnalysisResult {
  field: string;
  analysis: {
    uniqueValues: number;
    averageLength: number;
    commonTerms: Array<{
      term: string;
      frequency: number;
    }>;
  };
}

export function performNLPAnalysis(fields: DataField[]): Promise<NLPAnalysisResult[]>; 
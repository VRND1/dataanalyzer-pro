import { PipelineStage } from '@/types/pipeline/index';
import { validateDataset } from '@/utils/validation/dataValidation';
import { UniversalMLService } from '@/utils/analysis/ml/UniversalMLService';
import { performNLPAnalysis } from '@/utils/analysis/nlp/core';
import { performPredictiveAnalysis } from '@/utils/analysis/predictive/core';
import { DataField } from '@/types/data';

export const ANALYSIS_STAGES: PipelineStage[] = [
  { name: 'Data Validation', status: 'pending', weight: 1 },
  { name: 'ML Analysis', status: 'pending', weight: 1 },
  { name: 'NLP Analysis', status: 'pending', weight: 1 },
  { name: 'Predictive Analysis', status: 'pending', weight: 1 }
];

export function createAnalysisStages(fields: DataField[]) {
  return [
    async () => {
      const validation = validateDataset(fields);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return fields;
    },
    async () => {
      const mlService = UniversalMLService.getInstance();
      return await mlService.evaluate('regression', fields);
    },
    async () => performNLPAnalysis(fields),
    async () => performPredictiveAnalysis(fields)
  ];
}
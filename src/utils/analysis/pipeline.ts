import { DataField, AnalyzedData } from '@/types/data';
import { processData } from './data/processing';
import { analyzeFields } from './statistics/analysis';
import { validateDataset } from './validation/dataset';
import { createError } from '../core/error';

type ProgressCallback = (progress: number) => void;

interface PipelineStage {
  name: string;
  weight: number;
  execute: (data: any) => Promise<any>;
}

export function createAnalysisPipeline(onProgress: ProgressCallback) {
  const stages: PipelineStage[] = [
    {
      name: 'Validation',
      weight: 0.1,
      execute: async (data: DataField[] | AnalyzedData) => {
        const fields = 'fields' in data ? data.fields : data;
        const validation = validateDataset(fields);
        if (!validation.isValid) {
          throw createError('VALIDATION_ERROR', validation.error || 'Invalid dataset');
        }
        return fields;
      }
    },
    {
      name: 'Processing',
      weight: 0.3,
      execute: async (data: DataField[] | AnalyzedData) => {
        const fields = 'fields' in data ? data.fields : data;
        return processData(fields);
      }
    },
    {
      name: 'Analysis',
      weight: 0.6,
      execute: async (data: DataField[] | AnalyzedData) => {
        const fields = 'fields' in data ? data.fields : data;
        const analysis = await analyzeFields(fields);
        return {
          fields,
          statistics: analysis.statistics || {
            mean: {},
            median: {},
            standardDeviation: {},
            correlations: {}
          },
          insights: analysis.insights || [],
          hasNumericData: analysis.hasNumericData || false,
          hasTextData: analysis.hasTextData || false,
          dataQuality: analysis.dataQuality || {
            completeness: 1,
            validity: 1
          }
        };
      }
    }
  ];

  let currentProgress = 0;

  const updateProgress = (stageIndex: number, stageProgress: number) => {
    const previousStagesWeight = stages
      .slice(0, stageIndex)
      .reduce((sum, stage) => sum + stage.weight, 0);
    
    const currentStageContribution = stageProgress * stages[stageIndex].weight;
    currentProgress = (previousStagesWeight + currentStageContribution) * 100;
    onProgress(Math.round(currentProgress));
  };

  return {
    async execute(fields: DataField[]): Promise<AnalyzedData> {
      let result: DataField[] | AnalyzedData = fields;
      
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        updateProgress(i, 0);
        
        try {
          result = await stage.execute(result);
          updateProgress(i, 1);
        } catch (error) {
          throw createError(
            'ANALYSIS_ERROR',
            `Failed at ${stage.name} stage: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      return result as AnalyzedData;
    }
  };
}
import { PipelineStage } from '@/types/pipeline';

export const PIPELINE_STAGES: PipelineStage[] = [
  { name: 'Data Validation', status: 'pending', weight: 0.1 },
  { name: 'Data Preprocessing', status: 'pending', weight: 0.15 },
  { name: 'Statistical Analysis', status: 'pending', weight: 0.2 },
  { name: 'Machine Learning', status: 'pending', weight: 0.2 },
  { name: 'Text Analysis', status: 'pending', weight: 0.15 },
  { name: 'Predictive Analysis', status: 'pending', weight: 0.1 },
  { name: 'Insights Generation', status: 'pending', weight: 0.1 }
];
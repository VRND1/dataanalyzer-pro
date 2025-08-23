export interface PipelineStage {
  name: string;
  weight?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface Pipeline {
  stages: PipelineStage[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentStage?: string;
  error?: string;
} 
export interface DataField {
  type: 'string' | 'number' | 'date' | 'boolean';
}

export interface PipelineStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface Pipeline {
  stages: PipelineStage[];
  currentStage: number;
  isComplete: boolean;
} 
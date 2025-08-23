import { Pipeline, PipelineStage } from '@/types/pipeline';
import { createError } from '../error';

export class PipelineExecutor {
  private pipeline: Pipeline;
  private onProgress?: (progress: number) => void;
  private metrics: Map<string, { duration: number; memory: number }>;

  constructor(stages: PipelineStage[], onProgress?: (progress: number) => void) {
    this.pipeline = {
      stages,
      status: 'pending',
      currentStage: stages[0]?.name
    };
    this.onProgress = onProgress;
    this.metrics = new Map();
  }

  async executeStage<T>(
    executor: () => Promise<T>,
    stageName: string
  ): Promise<T> {
    const stage = this.pipeline.stages.find((s: PipelineStage) => s.name === stageName);
    if (!stage) {
      throw createError('ANALYSIS_ERROR', `Stage ${stageName} not found`);
    }

    try {
      const startTime = performance.now();
      const startMemory = 'memory' in performance ? (performance as any).memory?.usedJSHeapSize : 0;
      
      stage.status = 'running';
      const result = await executor();
      stage.status = 'completed';
      
      const endTime = performance.now();
      const endMemory = 'memory' in performance ? (performance as any).memory?.usedJSHeapSize : 0;
      
      // Store metrics
      this.metrics.set(stageName, {
        duration: endTime - startTime,
        memory: endMemory - startMemory
      });
      
      this.updateProgress();
      return result;
    } catch (error) {
      stage.status = 'failed';
      stage.error = error instanceof Error ? error.message : 'Stage execution failed';
      throw error;
    }
  }

  private updateProgress() {
    if (!this.onProgress) return;
    
    const totalWeight = this.pipeline.stages.reduce((sum: number, stage: PipelineStage) => sum + (stage.weight || 1), 0);
    const completedWeight = this.pipeline.stages
      .filter((s: PipelineStage) => s.status === 'completed')
      .reduce((sum: number, stage: PipelineStage) => sum + (stage.weight || 1), 0);
    
    this.onProgress((completedWeight / totalWeight) * 100);
  }

  getPipeline(): Pipeline {
    return this.pipeline;
  }

  getMetrics(): Record<string, { duration: number; memory: number }> {
    return Object.fromEntries(this.metrics);
  }

  isComplete(): boolean {
    return this.pipeline.stages.every((s: PipelineStage) => s.status === 'completed');
  }

  getCurrentStage(): string | undefined {
    return this.pipeline.currentStage;
  }
}
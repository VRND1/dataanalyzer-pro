import { useState, useCallback } from 'react';
import { Pipeline } from '../../types/pipeline';
import { PipelineResult } from '../../types/pipeline/index';
import { PIPELINE_STAGES } from '../../utils/core/pipeline/stages';
import { PipelineExecutor } from '../../utils/core/pipeline/executor';

export const usePipeline = () => {
  const [pipeline, setPipeline] = useState<Pipeline>({
    stages: PIPELINE_STAGES,
    status: 'pending',
    currentStage: PIPELINE_STAGES[0]?.name,
    error: undefined
  });

  const startPipeline = useCallback(async () => {
    try {
      setPipeline(prev => ({ ...prev, status: 'running' }));
      
      const executor = new PipelineExecutor(PIPELINE_STAGES);
      let currentResult: PipelineResult = { success: true };

      for (const stage of pipeline.stages) {
        setPipeline(prev => ({ ...prev, currentStage: stage.name }));
        currentResult = await executor.executeStage(
          async () => {
            // Execute stage logic here
            return { success: true };
          },
          stage.name
        );

        if (!currentResult.success) {
          setPipeline(prev => ({ 
            ...prev, 
            status: 'failed',
            error: currentResult.error 
          }));
          return;
        }
      }

      setPipeline(prev => ({
        ...prev,
        status: 'completed'
      }));
    } catch (error) {
      setPipeline(prev => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }));
    }
  }, [pipeline.stages]);

  return {
    pipeline,
    startPipeline
  };
};
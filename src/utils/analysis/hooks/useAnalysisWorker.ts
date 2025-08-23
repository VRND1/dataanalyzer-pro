import { useCallback, useRef } from 'react';
import type { DataField, AnalyzedData } from '@/types/data';
import { createWorker } from '@/utils/core/workerUtils';

export function useAnalysisWorker() {
  const workerRef = useRef<Worker | null>(null);

  const analyze = useCallback(async (fields: DataField[]): Promise<AnalyzedData> => {
    if (!workerRef.current) {
      const workerResult = createWorker(
        new URL('../workers/analysis.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      if (workerResult.worker) {
        workerRef.current = workerResult.worker;
      } else {
        throw new Error(`Failed to create analysis worker: ${workerResult.error}`);
      }
    }

    return new Promise((resolve, reject) => {
      const worker = workerRef.current!;
      
      worker.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.result);
        }
      };

      worker.onerror = (error) => {
        reject(error);
      };

      worker.postMessage({ fields });
    });
  }, []);

  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return { analyze, cleanup };
}
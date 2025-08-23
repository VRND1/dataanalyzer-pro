import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { DataField } from '../../types/data';
import type { AnalyzedData } from '@/types/analysis';
import { createError } from '../../utils/core/error';
import { AnalysisEngine } from '../../utils/analysis/core/AnalysisEngine';
import { createWorker, isWorkerSupported } from '../../utils/core/workerUtils';

export function useAnalysis() {
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<AnalyzedData | null>(null);
  const [progress, setProgress] = useState(0);
  const engineRef = useRef<AnalysisEngine | null>(null);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const [workerSupport, setWorkerSupport] = useState<boolean>(true);

  const workers: Worker[] = [];
  const MAX_WORKERS = navigator.hardwareConcurrency || 4;
  const MEMORY_CHECK_INTERVAL = 1000; // Check memory every second

  // Check worker support on mount
  useEffect(() => {
    setWorkerSupport(isWorkerSupported());
  }, []);

  const analysisMutation = useMutation({
    mutationFn: async ({ fields, category }: { fields: DataField[], category?: string }) => {
      setProgress(10); // Initial progress
      
      // Filter numeric fields for analysis engine
      const numericFields = fields.filter(field => {
        if (field.type !== 'number') return false;
        const values = field.value as number[];
        return values && values.length > 0 && values.every(v => typeof v === 'number' && !isNaN(v));
      });

      // Only create AnalysisEngine if we have enough numeric fields for network analysis
      if (numericFields.length >= 2) {
        engineRef.current = new AnalysisEngine(numericFields);
      } else {
        // For basic analysis without network analysis, we can still proceed
        // but we'll need to handle this case in the analysis
        console.warn('Insufficient numeric fields for network analysis. Proceeding with basic analysis.');
      }
      
      // Create workers only if supported and needed
      if (workerSupport && fields.length > 0) {
        const numWorkers = Math.min(fields.length, MAX_WORKERS);
        for (let i = 0; i < numWorkers; i++) {
          const workerResult = createWorker(
            new URL('../../utils/analysis/worker.ts', import.meta.url),
            { type: 'module' }
          );
          
          if (workerResult.worker) {
            workers.push(workerResult.worker);
          } else {
            console.warn('Failed to create worker:', workerResult.error);
            // Continue without workers if they fail to create
          }
        }
      }
      
      setProgress(30); // Engine initialized
      
      if (engineRef.current) {
        const result = await engineRef.current.analyze(category);
        setProgress(100); // Analysis complete
        return result;
      } else {
        // Return basic analysis results without network analysis
        setProgress(100);
        return {
          fields: numericFields,
          statistics: {},
          trends: [],
          correlations: [],
          insights: [],
          recommendations: [],
          pros: [],
          cons: [],
          hasNumericData: numericFields.length > 0,
          hasTextData: fields.some(f => f.type === 'string'),
          dataQuality: {
            completeness: 1,
            validity: 1
          },
          analysis: {
            trends: []
          }
        };
      }
    },
    onSuccess: (data) => {
      setResults(data as unknown as AnalyzedData);
    },
    onError: (err) => {
      setError(err instanceof Error ? err : createError('ANALYSIS_ERROR', 'Analysis failed'));
    }
  });

  // Monitor memory usage
  useEffect(() => {
    if (!analysisMutation.isPending) return;

    const interval = setInterval(async () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usageInMB = Math.round(memory.usedJSHeapSize / (1024 * 1024));
        setMemoryUsage(usageInMB);

        // Force garbage collection if memory usage is too high
        if (usageInMB > 500) { // 500MB threshold
          workers.forEach(worker => worker.terminate());
          workers.length = 0;
          global.gc?.();
        }
      }
    }, MEMORY_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [analysisMutation.isPending]);

  return {
    isAnalyzing: analysisMutation.isPending,
    error,
    results,
    progress,
    memoryUsage,
    workerSupport,
    analyze: (fields: DataField[], category?: string) => analysisMutation.mutate({ fields, category }),
    reset: analysisMutation.reset
  };
}
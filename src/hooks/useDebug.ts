import { useState, useCallback } from 'react';
import { DebugLogger } from '@/utils/monitoring/DebugLogger';
import { ConnectionValidator } from '@/utils/monitoring/ConnectionValidator';
import { PerformanceMonitor } from '@/utils/monitoring/PerformanceMonitor';

export function useDebug() {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Error | null>(null);

  const runDiagnostics = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    const logger = DebugLogger.getInstance();
    const validator = ConnectionValidator.getInstance();
    const monitor = PerformanceMonitor.getInstance();

    try {
      // Check Supabase connection
      const endConnection = monitor.startOperation('Supabase', 'connection-check');
      const connectionValid = await validator.validateSupabaseConnection();
      endConnection();

      // Check file upload
      const endUpload = monitor.startOperation('Storage', 'upload-test');
      const uploadValid = await validator.validateFileUpload();
      endUpload();

      // Check data processing
      const endProcessing = monitor.startOperation('Processing', 'sample-data');
      const processingValid = await validator.validateDataProcessing([
        { id: 1, value: 100 },
        { id: 2, value: 200 }
      ]);
      endProcessing();

      setResults({
        connection: connectionValid,
        upload: uploadValid,
        processing: processingValid
      });

      logger.log('info', 'Diagnostics', 'Diagnostics completed', {
        results: {
          connection: connectionValid,
          upload: uploadValid,
          processing: processingValid
        }
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Diagnostics failed');
      setError(error);
      logger.log('error', 'Diagnostics', 'Diagnostics failed', {
        error: error.message
      });
    } finally {
      setIsChecking(false);
    }
  }, []);

  const getLogs = useCallback((component?: string) => {
    const logger = DebugLogger.getInstance();
    return component ? logger.getLogsByComponent(component) : logger.getRecentLogs();
  }, []);

  const getPerformanceMetrics = useCallback((component?: string) => {
    const monitor = PerformanceMonitor.getInstance();
    return monitor.getMetrics(component);
  }, []);

  return {
    isChecking,
    results,
    error,
    runDiagnostics,
    getLogs,
    getPerformanceMetrics
  };
}
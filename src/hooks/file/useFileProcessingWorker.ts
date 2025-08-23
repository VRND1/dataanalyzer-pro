import { useState, useCallback, useRef, useEffect } from 'react';
import { FileData } from '@/types/data';
import { FileProcessingWorkerManager, ProcessingOptions, ProgressInfo } from '../../utils/file/workers/WorkerManager';

export interface UseFileProcessingWorkerReturn {
  fileData: FileData | null;
  isProcessing: boolean;
  progress: ProgressInfo | null;
  error: string | null;
  processFile: (file: File, options?: ProcessingOptions) => Promise<FileData>;
  cancelProcessing: () => void;
  reset: () => void;
}

export function useFileProcessingWorker(): UseFileProcessingWorkerReturn {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const workerManagerRef = useRef<FileProcessingWorkerManager | null>(null);

  // Initialize worker manager
  useEffect(() => {
    workerManagerRef.current = new FileProcessingWorkerManager();

    return () => {
      if (workerManagerRef.current) {
        workerManagerRef.current.destroy();
      }
    };
  }, []);

  const processFile = useCallback(async (file: File, options: ProcessingOptions = {}): Promise<FileData> => {
    if (!workerManagerRef.current) {
      throw new Error('Worker manager not initialized');
    }

    setIsProcessing(true);
    setError(null);
    setProgress(null);

    try {
      console.log('Worker manager processing file:', file.name);
      
      const result = await workerManagerRef.current.processFile(file, {
        ...options,
        onProgress: (progressInfo: ProgressInfo) => {
          setProgress(progressInfo);
          if (options.onProgress) {
            options.onProgress(progressInfo);
          }
        },
        onError: (errorMessage: string) => {
          setError(errorMessage);
          if (options.onError) {
            options.onError(errorMessage);
          }
        }
      });

      console.log('Worker manager result:', result);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to process file');
      }

      console.log('Worker manager data:', result.data);

      setFileData(result.data);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, []);

  const cancelProcessing = useCallback(() => {
    if (workerManagerRef.current) {
      workerManagerRef.current.cancel();
    }
    setIsProcessing(false);
    setProgress(null);
  }, []);

  const reset = useCallback(() => {
    setFileData(null);
    setError(null);
    setProgress(null);
    setIsProcessing(false);
  }, []);

  return {
    fileData,
    isProcessing,
    progress,
    error,
    processFile,
    cancelProcessing,
    reset
  };
} 
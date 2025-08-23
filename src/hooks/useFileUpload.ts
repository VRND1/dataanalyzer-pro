import { useState, useCallback, useRef, useEffect } from 'react';
import { FileData } from '@/types/data';
import { validateFile } from '../utils/file/validation';
import { processFile } from '../utils/file/processing';
import { storeAnalysisData } from '../utils/storage/db';
import { createError } from '../utils/core/error';

const MAX_RETRIES = 3;

export function useFileUpload(onSuccess?: (data: FileData) => void) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<number | undefined>();

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const resetState = useCallback(() => {
    setIsUploading(false);
    setError(null);
    setProgress(0);
    setRetryCount(0);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        throw createError('INVALID_INPUT', validation.error || 'Invalid file');
      }

      setProgress(20);

      // Process file
      const processedData = await processFile(file);
      if (!isValidFileData(processedData)) {
        throw createError('PROCESSING_FAILED', 'Invalid processed file data');
      }

      setProgress(60);

      // Store data with retries
      let stored = false;
      while (!stored && retryCount < MAX_RETRIES) {
        try {
          await storeAnalysisData(processedData);
          stored = true;
          setProgress(100);
          onSuccess?.(processedData);
        } catch (storageError) {
          console.warn(`Storage attempt ${retryCount + 1} failed:`, storageError);
          setRetryCount(prev => prev + 1);
          
          if (retryCount >= MAX_RETRIES - 1) {
            throw storageError;
          }
          
          // Wait before retry
          await new Promise(resolve => {
            retryTimeoutRef.current = window.setTimeout(resolve, 1000 * (retryCount + 1));
          });
        }
      }

      return processedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process file');
      setError(error);
      throw error;
    } finally {
      resetState();
    }
  }, [onSuccess, retryCount, resetState]);

  // Helper function to validate FileData structure
  function isValidFileData(data: any): data is FileData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.type === 'string' &&
      typeof data.name === 'string' &&
      data.content &&
      Array.isArray(data.content.fields) &&
      data.content.fields.length > 0 &&
      data.content.fields.every((field: any) =>
        field &&
        typeof field === 'object' &&
        typeof field.name === 'string' &&
        typeof field.type === 'string' &&
        Array.isArray(field.value)
      )
    );
  }

  return {
    isUploading,
    error,
    progress,
    handleFileUpload
  };
}
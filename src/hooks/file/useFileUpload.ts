import { useState, useCallback } from 'react';
import { FileData } from '@/types/data';
import { processFile } from '../../utils/file/processing';
import { validateFile } from '../../utils/validation/fileValidation';
import { createError } from '../../utils/core/error';

export function useFileUpload(onSuccess: (data: FileData) => void) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Validate file first
      const validation = validateFile(file);
      if (!validation.isValid) {
        throw createError('INVALID_INPUT', validation.error || 'Invalid file');
      }

      console.log('Starting file processing for:', file.name);

      // Always use worker-based processing for all files
      const processedData = await processFile(file);
      
      console.log('File processing completed:', processedData);
      
      if (onSuccess) {
        onSuccess(processedData);
      }
      return processedData;
    } catch (err) {
      console.error('File upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(new Error(errorMessage));
      throw new Error(errorMessage);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [onSuccess]);

  const cancelUpload = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    isUploading,
    error,
    progress,
    handleFileUpload,
    cancelUpload,
    resetUpload
  };
}
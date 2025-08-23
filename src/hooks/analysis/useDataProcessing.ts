import { useState, useCallback } from 'react';
import { FileData } from '@/types/data';
import { processData } from '../../utils/analysis/data/processing';
import { validateDataset } from '../../utils/validation/dataValidation';
import { useAnalysisPipeline } from './useAnalysisPipeline';

export function useDataProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [processedData, setProcessedData] = useState<any>(null);
  const { runAnalysis } = useAnalysisPipeline();

  const processFileData = useCallback(async (fileData: FileData) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Extract fields from file data
      const fields = fileData.content.fields || [];
      if (!fields.length) {
        throw new Error('No data fields found in file');
      }
      
      // Validate the dataset
      const validation = validateDataset(fields);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid dataset');
      }

      // Process the data
      const processedFields = await processData(fields);
      
      // Run analysis on the processed data
      const analysis = await runAnalysis(processedFields);
      
      setProcessedData({
        ...analysis,
        originalData: fileData
      });
      
      return processedFields;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Processing failed');
      setError(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [runAnalysis]);

  return {
    isProcessing,
    error,
    processedData,
    processFileData
  };
}
import { useState, useCallback } from 'react';
import { DataField, AnalyzedData } from '@/types/data';
import { processData } from '../utils/analysis/data/processing';
import { calculateStatistics } from '../utils/analysis/statistics';
import { createError } from '../utils/core/error';

export function useAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<AnalyzedData | null>(null);
  const [progress, setProgress] = useState(0);

  const analyze = useCallback(async (fields: DataField[]) => {
    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    setProgress(0);

    try {
      // Process data
      setProgress(25);
      const processedFields = processData(fields);

      // Analyze data using calculateStatistics
      setProgress(50);
      const statistics = calculateStatistics(processedFields);
      
      // Create analysis result
      const analysis: AnalyzedData = {
        fields: processedFields,
        statistics,
        insights: [],
        hasNumericData: processedFields.some(f => f.type === 'number'),
        hasTextData: processedFields.some(f => f.type === 'string'),
        dataQuality: {
          completeness: calculateCompleteness(processedFields),
          validity: calculateValidity(processedFields)
        }
      };
      
      setProgress(100);

      setResults(analysis);
      return analysis;
    } catch (err) {
      const error = err instanceof Error ? err : createError('ANALYSIS_ERROR', 'Analysis failed');
      setError(error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    isAnalyzing,
    error,
    results,
    progress,
    analyze
  };
}

function calculateCompleteness(fields: DataField[]): number {
  let totalValues = 0;
  let nonNullValues = 0;

  fields.forEach(field => {
    totalValues += field.value?.length || 0;
    nonNullValues += field.value && Array.isArray(field.value) ? field.value.filter(v => v != null && v !== '').length : 0;
  });

  return totalValues > 0 ? nonNullValues / totalValues : 0;
}

function calculateValidity(fields: DataField[]): number {
  let totalValues = 0;
  let validValues = 0;

  fields.forEach(field => {
    totalValues += field.value?.length || 0;
    
    if (!field.value || !Array.isArray(field.value)) {
      return; // Skip invalid fields
    }
    
    validValues += field.value.filter(v => {
      if (field.type === 'number') return typeof v === 'number' && !isNaN(v);
      if (field.type === 'string') return typeof v === 'string' && v.trim() !== '';
      return v != null;
    }).length;
  });

  return totalValues > 0 ? validValues / totalValues : 0;
}
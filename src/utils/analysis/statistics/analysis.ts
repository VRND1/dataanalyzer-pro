import { DataField } from '@/types/data';
import { calculateMean, calculateMedian, calculateStandardDeviation } from './calculations';
import { determineTrend } from './trends';
import type { FieldStats, AnalyzedData } from './types';
import { calculateCorrelations } from './correlation';

export function analyzeField(field: DataField): FieldStats {
  const values = field.value as number[];
  const mean = calculateMean(values);
  const median = calculateMedian(values);
  const standardDeviation = calculateStandardDeviation(values, mean);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const trend = determineTrend(values);
  
  // Calculate quartiles
  const sortedValues = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(values.length * 0.25);
  const q2Index = Math.floor(values.length * 0.5);
  const q3Index = Math.floor(values.length * 0.75);
  
  return {
    mean,
    median,
    standardDeviation,
    min,
    max,
    sampleSize: values.length,
    trend,
    quartiles: {
      q1: sortedValues[q1Index],
      q2: sortedValues[q2Index],
      q3: sortedValues[q3Index]
    }
  };
}

export async function analyzeFields(fields: DataField[]): Promise<AnalyzedData> {
  const numericFields = fields.filter(f => f.type === 'number');
  const textFields = fields.filter(f => f.type === 'string');

  // Calculate statistics for numeric fields
  const fieldStats = numericFields.map(field => ({
    ...analyzeField(field),
    fieldName: field.name
  }));
  
  const correlations = numericFields.length >= 2 ? 
    calculateCorrelations(numericFields.map(f => ({ 
      name: f.name, 
      value: f.value as number[] 
    }))) : {};

  return {
    fields,
    statistics: {
      mean: Object.fromEntries(fieldStats.map(s => [s.fieldName, s.mean])),
      median: Object.fromEntries(fieldStats.map(s => [s.fieldName, s.median])),
      standardDeviation: Object.fromEntries(fieldStats.map(s => [s.fieldName, s.standardDeviation])),
      correlations
    },
    insights: [],
    hasNumericData: numericFields.length > 0,
    hasTextData: textFields.length > 0,
    dataQuality: {
      completeness: calculateCompleteness(fields),
      validity: calculateValidity(fields)
    }
  };
}

function calculateCompleteness(fields: DataField[]): number {
  const totalValues = fields.reduce((sum, field) => sum + (field.value?.length || 0), 0);
  const nonNullValues = fields.reduce((sum, field) => 
    sum + (field.value && Array.isArray(field.value) ? field.value.filter(v => v != null && v !== '').length : 0), 0);
  return totalValues > 0 ? nonNullValues / totalValues : 0;
}

function calculateValidity(fields: DataField[]): number {
  const totalValues = fields.reduce((sum, field) => sum + (field.value?.length || 0), 0);
  const validValues = fields.reduce((sum, field) => {
    if (!field.value || !Array.isArray(field.value)) {
      return sum + 0;
    }
    
    return sum + field.value.filter(v => {
      if (field.type === 'number') return typeof v === 'number' && !isNaN(v);
      if (field.type === 'string') return typeof v === 'string' && v.trim() !== '';
      return v != null;
    }).length;
  }, 0);
  return totalValues > 0 ? validValues / totalValues : 0;
}
import { DataField } from '@/types/data';
import { calculateFieldStats } from '../statistics/calculations';
import { determineTrend } from '../statistics/trends';

export async function performPredictiveAnalysis(fields: DataField[]) {
  const numericFields = fields.filter(f => f.type === 'number');
  
  return numericFields.map(field => {
    const stats = calculateFieldStats(field);
    const trend = determineTrend(field.value as number[]);
    
    return {
      field: field.name,
      prediction: {
        nextValue: stats.mean * (trend === 'up' ? 1.1 : trend === 'down' ? 0.9 : 1),
        confidence: Math.max(0, Math.min(1, 1 - (stats.standardDeviation / stats.mean)))
      }
    };
  });
} 
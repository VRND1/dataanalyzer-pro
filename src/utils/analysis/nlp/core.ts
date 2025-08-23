import { DataField } from '@/types/data';

export async function performNLPAnalysis(fields: DataField[]) {
  const textFields = fields.filter(f => f.type === 'string');
  
  return textFields.map(field => {
    const values = field.value as string[];
    return {
      field: field.name,
      analysis: {
        uniqueValues: new Set(values).size,
        averageLength: values.reduce((sum, val) => sum + val.length, 0) / values.length,
        commonTerms: findCommonTerms(values)
      }
    };
  });
}

function findCommonTerms(values: string[]): { term: string; frequency: number }[] {
  const terms = new Map<string, number>();
  
  values.forEach(value => {
    value.toLowerCase().split(/\s+/).forEach(term => {
      terms.set(term, (terms.get(term) || 0) + 1);
    });
  });
  
  return Array.from(terms.entries())
    .map(([term, count]) => ({ term, frequency: count }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);
} 
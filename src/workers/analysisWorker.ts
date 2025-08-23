/// <reference lib="webworker" />

// Browser-compatible Web Worker for heavy analysis
// Simple analysis function for the worker
function analyzeData(fields: any[]) {
  const results = {
    summary: {
      totalFields: fields.length,
      totalRecords: fields[0]?.value?.length || 0,
      fieldTypes: {} as Record<string, string>
    },
    statistics: {} as Record<string, any>,
    insights: [] as string[]
  };

  // Analyze each field
  fields.forEach((field: any) => {
    const { name, type, value } = field;
    
    // Store field type
    results.summary.fieldTypes[name] = type;
    
    // Basic statistics based on type
    if (type === 'number') {
      const numericValues = value.filter((v: any) => typeof v === 'number' && !isNaN(v));
      if (numericValues.length > 0) {
        const sum = numericValues.reduce((a: any, b: any) => a + b, 0);
        const mean = sum / numericValues.length;
        const sorted = numericValues.sort((a: any, b: any) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        
        results.statistics[name] = {
          count: numericValues.length,
          sum,
          mean,
          median,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          range: sorted[sorted.length - 1] - sorted[0]
        };
      }
    } else if (type === 'string') {
      const stringValues = value.filter((v: any) => typeof v === 'string');
      if (stringValues.length > 0) {
        const uniqueValues = new Set(stringValues);
        results.statistics[name] = {
          count: stringValues.length,
          uniqueCount: uniqueValues.size,
          mostCommon: getMostCommon(stringValues)
        };
      }
    }
  });

  // Generate insights
  if (fields.length > 0) {
    results.insights.push(`Analyzed ${fields.length} fields with ${results.summary.totalRecords} records`);
    
    const numericFields = fields.filter((f: any) => f.type === 'number');
    if (numericFields.length > 0) {
      results.insights.push(`Found ${numericFields.length} numeric fields for statistical analysis`);
    }
    
    const stringFields = fields.filter((f: any) => f.type === 'string');
    if (stringFields.length > 0) {
      results.insights.push(`Found ${stringFields.length} text fields for categorical analysis`);
    }
  }

  return results;
}

function getMostCommon(values: string[]) {
  const counts: Record<string, number> = {};
  values.forEach((v: string) => {
    counts[v] = (counts[v] || 0) + 1;
  });
  
  let maxCount = 0;
  let mostCommon = '';
  
  Object.entries(counts).forEach(([value, count]: [string, number]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = value;
    }
  });
  
  return { value: mostCommon, count: maxCount };
}

// Handle messages from main thread using Web Worker API
self.onmessage = async (e: MessageEvent) => {
  try {
    const { fields } = e.data;
    const result = analyzeData(fields);
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Analysis failed' 
    });
  }
}; 
import Papa from 'papaparse';
import { holtAuto } from './holtDynamic';
import { buildSeries, seriesSignature } from './series';
import { forecastAnyCsv, type ForecastConfig, type ForecastResult as NewForecastResult } from './forecastAnyCsv';

// Legacy interface for backward compatibility
export interface ForecastOptions {
  field?: string;
  mode?: 'row' | 'date_sum';
  horizon?: number;
  useGrid?: boolean;
  timeKey?: string;
  confidence?: number;
  phi?: number;
}

export interface ForecastResult {
  meta: {
    n: number;
    mode: string;
    timeKey: string;
    field: string;
  };
  result: any; // HoltResult from holtDynamic
  seriesSignature: string;
}

// New unified function using forecastAnyCsv
export async function runForecastFromCsv(
  file: File, 
  options: ForecastConfig = {}
): Promise<NewForecastResult> {
  const text = await file.text();
  const parsed = Papa.parse(text, { header: true }).data as Record<string, any>[];
  
  // Filter out empty rows
  const rows = parsed.filter(row => Object.keys(row).length > 0);
  
  // Use provided options with sensible defaults
  const config = {
    mode: "row" as const,
    field: "sales",
    ...options
  };
  
  return forecastAnyCsv(rows, config);
}

// Legacy function for backward compatibility
export async function runLegacyForecastFromCsv(
  file: File, 
  options: ForecastOptions = {}
): Promise<ForecastResult> {
  const text = await file.text();
  const parsed = Papa.parse(text, { header: true }).data as Record<string, any>[];

  const { y, meta } = buildSeries(parsed, { 
    field: options.field, 
    mode: options.mode, 
    timeKey: options.timeKey 
  });
  const signature = seriesSignature(y);
  
  console.log('Series signature', signature, meta);

  const result = holtAuto(y, { 
    horizon: options.horizon, 
    useGrid: options.useGrid,
    confidence: options.confidence,
    phi: options.phi
  });

  return { meta, result, seriesSignature: JSON.stringify(signature) };
}

// Helper function to get available fields from CSV
export function getAvailableFields(csvData: Record<string, any>[]): string[] {
  if (!csvData?.length) return [];
  
  const fields = Object.keys(csvData[0]);
  return fields.filter(field => {
    const sampleValues = csvData.slice(0, 10).map(row => row[field]);
    return sampleValues.some(val => 
      val !== null && 
      val !== undefined && 
      val !== '' && 
      !isNaN(Number(val))
    );
  });
}

// Helper function to get time fields from CSV
export function getTimeFields(csvData: Record<string, any>[]): string[] {
  if (!csvData?.length) return [];
  
  const fields = Object.keys(csvData[0]);
  const timeKeywords = ['date', 'timestamp', 'time', 'dt', 'day', 'month', 'year'];
  
  return fields.filter(field => 
    timeKeywords.some(keyword => 
      field.toLowerCase().includes(keyword)
    )
  );
}

// Helper function to get numeric fields from CSV
export function getNumericFields(csvData: Record<string, any>[]): string[] {
  if (!csvData?.length) return [];
  
  const fields = Object.keys(csvData[0]);
  const numericFields: string[] = [];
  
  for (const field of fields) {
    const sampleValues = csvData.slice(0, 10).map(row => row[field]);
    const isNumeric = sampleValues.every(val => 
      val !== null && 
      val !== undefined && 
      val !== '' && 
      !isNaN(Number(val))
    );
    
    if (isNumeric) {
      numericFields.push(field);
    }
  }
  
  return numericFields;
}

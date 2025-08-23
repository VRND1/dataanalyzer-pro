/// <reference lib="webworker" />

import { parse } from 'papaparse';
import * as XLSX from 'xlsx';

interface WorkerMessage {
  type: 'process' | 'cancel';
  payload: {
    file: File;
    fileType: 'csv' | 'excel';
    options?: {
      chunkSize?: number;
      maxRows?: number;
      includeStats?: boolean;
    };
  };
}

interface ProgressMessage {
  type: 'progress';
  payload: {
    processed: number;
    total?: number;
    percentage: number;
    currentChunk: number;
  };
}

interface CompleteMessage {
  type: 'complete';
  payload: {
    fields: Array<{
      name: string;
      type: 'number' | 'string' | 'boolean' | 'date';
      value: any[];
      stats?: {
        mean?: number;
        median?: number;
        min?: number;
        max?: number;
        standardDeviation?: number;
        nullPercentage?: number;
      };
    }>;
    totalRows: number;
    processingTime: number;
  };
}

interface ErrorMessage {
  type: 'error';
  payload: {
    message: string;
    code?: string;
  };
}

let isProcessing = false;
let shouldCancel = false;

// Enhanced field type inference with statistics
function inferFieldTypeWithStats(values: any[]): {
  type: 'number' | 'string' | 'boolean' | 'date';
  stats?: {
    mean?: number;
    median?: number;
    min?: number;
    max?: number;
    standardDeviation?: number;
    nullPercentage?: number;
  };
} {
  const nonNullValues = values.filter(v => v != null && v !== '' && v !== undefined);
  const nullPercentage = ((values.length - nonNullValues.length) / values.length) * 100;
  
  if (nonNullValues.length === 0) {
    return { 
      type: 'string',
      stats: { nullPercentage }
    };
  }

  // Try to infer the type based on the values
  const typeChecks = nonNullValues.map(value => {
    // Handle Excel date numbers
    if (typeof value === 'number' && value > 25569 && value < 50000) {
      return 'date';
    }
    
    // Handle regular numbers
    if (typeof value === 'number' || (!isNaN(Number(value)) && value !== '')) {
      return 'number';
    }
    
    // Handle dates
    const dateStr = String(value);
    if (!isNaN(Date.parse(dateStr))) {
      return 'date';
    }
    
    // Handle booleans
    if (typeof value === 'boolean' || ['true', 'false', '0', '1'].includes(String(value).toLowerCase())) {
      return 'boolean';
    }
    
    return 'string';
  });
  
  const uniqueTypes = [...new Set(typeChecks)];
  let finalType: 'number' | 'string' | 'boolean' | 'date' = 'string';
  
  if (uniqueTypes.length === 1) {
    finalType = uniqueTypes[0] as 'number' | 'string' | 'boolean' | 'date';
  } else if (uniqueTypes.includes('number') && uniqueTypes.length === 2 && uniqueTypes.includes('string')) {
    finalType = 'number'; // Handle cases where some numbers are stored as strings
  }

  // Calculate statistics for numeric fields
  let stats: any = { nullPercentage };
  
  if (finalType === 'number') {
    const numericValues = nonNullValues
      .map(v => typeof v === 'number' ? v : Number(v))
      .filter(v => !isNaN(v));
    
    if (numericValues.length > 0) {
      const sorted = numericValues.sort((a, b) => a - b);
      const sum = numericValues.reduce((acc, val) => acc + val, 0);
      const mean = sum / numericValues.length;
      const median = sorted.length % 2 === 0 
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
      
      const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length;
      const standardDeviation = Math.sqrt(variance);
      
      stats = {
        ...stats,
        mean,
        median,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        standardDeviation
      };
    }
  }

  return { type: finalType, stats };
}

// Process CSV files with enhanced chunking and progress tracking
async function processCSV(file: File, options: any = {}): Promise<void> {
  const startTime = performance.now();
  const chunkSize = options.chunkSize || 10000;
  const maxRows = options.maxRows || Infinity;
  
  let headers: string[] = [];
  const fieldValues: Record<string, any[]> = {};
  let rowCount = 0;
  let chunkCount = 0;

  return new Promise((resolve, reject) => {
    parse(file, {
      chunk: (results) => {
        if (shouldCancel) {
          reject(new Error('Processing cancelled'));
          return;
        }

        try {
          const rows = results.data as any[][];
          chunkCount++;
          
          if (rowCount === 0 && rows.length > 0) {
            headers = rows[0].map(String);
            headers.forEach(header => {
              fieldValues[header] = [];
            });
            rows.slice(1).forEach(row => {
              if (rowCount >= maxRows) return;
              headers.forEach((header, i) => {
                fieldValues[header].push(row[i]);
              });
              rowCount++;
            });
          } else {
            rows.forEach(row => {
              if (rowCount >= maxRows) return;
              headers.forEach((header, i) => {
                fieldValues[header].push(row[i]);
              });
              rowCount++;
            });
          }
          
          // Report progress
          const percentage = Math.min((rowCount / maxRows) * 100, 100);
          self.postMessage({
            type: 'progress',
            payload: {
              processed: rowCount,
              total: maxRows === Infinity ? undefined : maxRows,
              percentage,
              currentChunk: chunkCount
            }
          } as ProgressMessage);
          
        } catch (error) {
          console.error('CSV chunk processing error:', error);
        }
      },
      complete: () => {
        if (shouldCancel) {
          reject(new Error('Processing cancelled'));
          return;
        }

        if (headers.length === 0) {
          reject(new Error('No headers found in CSV'));
          return;
        }

        const processingTime = performance.now() - startTime;
        const fields = headers.map(header => {
          const { type, stats } = inferFieldTypeWithStats(fieldValues[header]);
          return {
            name: header,
            type,
            value: fieldValues[header],
            stats
          };
        });

        self.postMessage({
          type: 'complete',
          payload: {
            fields,
            totalRows: rowCount,
            processingTime
          }
        } as CompleteMessage);
        
        resolve();
      },
      error: (error) => {
        reject(new Error(error.message));
      },
      header: false,
      skipEmptyLines: true,
      chunkSize
    });
  });
}

// Process Excel files with enhanced memory management
async function processExcel(file: File, options: any = {}): Promise<void> {
  const startTime = performance.now();
  const maxRows = options.maxRows || Infinity;
  
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false
    });

    if (!workbook.SheetNames.length) {
      throw new Error('Excel file contains no sheets');
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const totalRows = Math.min(range.e.r + 1, maxRows);
    
    let processedRows = 0;
    const headers: string[] = [];
    const fieldValues: Record<string, any[]> = {};

    // Process rows in chunks to avoid memory issues
    const chunkSize = 1000;
    for (let row = 0; row < totalRows; row += chunkSize) {
      if (shouldCancel) {
        throw new Error('Processing cancelled');
      }

      const endRow = Math.min(row + chunkSize, totalRows);
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        dateNF: 'yyyy-mm-dd',
        blankrows: false,
        range: row === 0 ? undefined : `${row + 1}:${endRow}`
      });

      if (row === 0 && jsonData.length > 0) {
        headers.push(...(jsonData[0] as string[]).map(String));
        headers.forEach(header => {
          fieldValues[header] = [];
        });
        
        // Process first chunk including headers
        (jsonData.slice(1) as any[][]).forEach((rowData) => {
          if (processedRows >= maxRows) return;
          headers.forEach((header, i) => {
            fieldValues[header].push(rowData[i]);
          });
          processedRows++;
        });
      } else {
        // Process subsequent chunks
        (jsonData as any[][]).forEach((rowData) => {
          if (processedRows >= maxRows) return;
          headers.forEach((header, i) => {
            fieldValues[header].push(rowData[i]);
          });
          processedRows++;
        });
      }

      // Report progress
      const percentage = Math.min((processedRows / maxRows) * 100, 100);
      self.postMessage({
        type: 'progress',
        payload: {
          processed: processedRows,
          total: maxRows === Infinity ? totalRows : maxRows,
          percentage,
          currentChunk: Math.floor(row / chunkSize) + 1
        }
      } as ProgressMessage);
    }

    if (headers.length === 0) {
      throw new Error('Invalid or empty Excel file');
    }

    const processingTime = performance.now() - startTime;
    const fields = headers.map(header => {
      const { type, stats } = inferFieldTypeWithStats(fieldValues[header]);
      return {
        name: String(header),
        type,
        value: fieldValues[header],
        stats
      };
    });

    self.postMessage({
      type: 'complete',
      payload: {
        fields,
        totalRows: processedRows,
        processingTime
      }
    } as CompleteMessage);

  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to process Excel file');
  }
}

// Main message handler
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  if (type === 'cancel') {
    shouldCancel = true;
    return;
  }

  if (type === 'process') {
    if (isProcessing) {
      self.postMessage({
        type: 'error',
        payload: { message: 'Already processing a file' }
      } as ErrorMessage);
      return;
    }

    isProcessing = true;
    shouldCancel = false;

    try {
      const { file, fileType, options = {} } = payload;

      if (fileType === 'csv') {
        await processCSV(file, options);
      } else if (fileType === 'excel') {
        await processExcel(file, options);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      self.postMessage({
        type: 'error',
        payload: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'PROCESSING_ERROR'
        }
      } as ErrorMessage);
    } finally {
      isProcessing = false;
    }
  }
};

// Handle worker errors
self.onerror = () => {
  self.postMessage({
    type: 'error',
    payload: {
      message: 'Worker error occurred',
      code: 'WORKER_ERROR'
    }
  } as ErrorMessage);
};

export default null; 
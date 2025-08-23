import { FileData } from '@/types/data';

export interface ProcessingOptions {
  chunkSize?: number;
  maxRows?: number;
  includeStats?: boolean;
  onProgress?: (progress: ProgressInfo) => void;
  onError?: (error: string) => void;
}

export interface ProgressInfo {
  processed: number;
  total?: number;
  percentage: number;
  currentChunk: number;
}

export interface ProcessingResult {
  success: boolean;
  data?: FileData;
  error?: string;
  processingTime?: number;
}

export class FileProcessingWorkerManager {
  private worker: Worker | null = null;
  private isProcessing = false;
  private resolvePromise: ((result: ProcessingResult) => void) | null = null;
  private rejectPromise: ((error: Error) => void) | null = null;
  private currentFileName: string | null = null;

  constructor() {
    this.initializeWorker();
  }

  private async initializeWorker(): Promise<void> {
    try {
      // Use Vite's native worker import for TypeScript
      this.worker = new Worker(new URL('./FileProcessingWorker.ts', import.meta.url), { type: 'module' });
      this.setupWorkerListeners();
      return;
      // ... fallback logic can remain if needed ...
      // Fallback to blob-based worker if module worker fails
      // if (isWorkerSupported()) {
      //   const workerScript = await this.getWorkerScript();
      //   const blobResult = createWorkerFromBlob(workerScript, { type: 'module' });
      //   if (blobResult.worker) {
      //     this.worker = blobResult.worker;
      //     this.setupWorkerListeners();
      //     return;
      //   }
      // }
      // console.warn('Failed to create Web Worker, falling back to main thread processing');
    } catch (error) {
      console.error('Error initializing worker:', error);
    }
  }

  private setupWorkerListeners(): void {
    if (!this.worker) return;

    this.worker.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;

      switch (type) {
        case 'progress':
          if (this.resolvePromise) {
            // Progress updates are handled through the onProgress callback
            // We don't resolve the promise here
          }
          break;

        case 'complete':
          if (this.resolvePromise) {
            console.log('Worker complete payload:', payload);
            console.log('Worker fields:', payload.fields);
            
            const fileData: FileData = {
              name: this.currentFileName || 'processed_file',
              type: 'csv',
              content: {
                fields: payload.fields.map((field: any) => ({
                  name: field.name,
                  type: field.type,
                  value: field.value,
                  stats: field.stats
                }))
              }
            };

            console.log('Constructed fileData:', fileData);

            this.resolvePromise({
              success: true,
              data: fileData,
              processingTime: payload.processingTime
            });
            this.cleanup();
          }
          break;

        case 'error':
          if (this.rejectPromise) {
            this.rejectPromise(new Error(payload.message));
            this.cleanup();
          }
          break;
      }
    };

    this.worker.onerror = () => {
      if (this.rejectPromise) {
        this.rejectPromise(new Error('Worker error occurred'));
        this.cleanup();
      }
    };
  }

  async processFile(file: File, options: ProcessingOptions = {}): Promise<ProcessingResult> {
    if (this.isProcessing) {
      return {
        success: false,
        error: 'Already processing a file'
      };
    }

    this.isProcessing = true;
    this.currentFileName = file.name;

    return new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      if (!this.worker) {
        // Fallback to main thread processing
        this.processFileInMainThread(file, options)
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.isProcessing = false;
            this.currentFileName = null;
          });
        return;
      }

      // Set up progress listener
      if (options.onProgress) {
        const worker = this.worker;
        const originalOnMessage = worker.onmessage;
        worker.onmessage = (e: MessageEvent) => {
          if (e.data.type === 'progress') {
            options.onProgress!(e.data.payload);
          }
          if (typeof originalOnMessage === 'function') {
            originalOnMessage.call(worker, e);
          }
        };
      }

      // Determine file type
      const extension = file.name.toLowerCase().split('.').pop();
      const fileType = extension === 'csv' ? 'csv' : 'excel';

      // Send file to worker
      this.worker.postMessage({
        type: 'process',
        payload: {
          file,
          fileType,
          options: {
            chunkSize: options.chunkSize || 10000,
            maxRows: options.maxRows,
            includeStats: options.includeStats
          }
        }
      });
    });
  }

  private async processFileInMainThread(file: File, options: ProcessingOptions): Promise<ProcessingResult> {
    try {
      const extension = file.name.toLowerCase().split('.').pop();
      
      if (extension === 'csv') {
        return await this.processCSVInMainThread(file, options);
      } else if (['xlsx', 'xls'].includes(extension || '')) {
        return await this.processExcelInMainThread(file);
      } else {
        return {
          success: false,
          error: 'Unsupported file type'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process file'
      };
    }
  }

  private async processCSVInMainThread(file: File, options: ProcessingOptions): Promise<ProcessingResult> {
    return new Promise((resolve) => {
      const { parse } = require('papaparse');
      const headers: string[] = [];
      const fieldValues: Record<string, any[]> = {};
      let rowCount = 0;

      parse(file, {
        chunk: (results: any) => {
          const rows = results.data as any[][];
          if (rowCount === 0 && rows.length > 0) {
            headers.push(...rows[0].map(String));
            headers.forEach(header => {
              fieldValues[header] = [];
            });
            rows.slice(1).forEach(row => {
              headers.forEach((header, i) => {
                fieldValues[header].push(row[i]);
              });
            });
          } else {
            rows.forEach(row => {
              headers.forEach((header, i) => {
                fieldValues[header].push(row[i]);
              });
            });
          }
          rowCount += rows.length;

          // Report progress
          if (options.onProgress) {
            options.onProgress({
              processed: rowCount,
              percentage: Math.min((rowCount / (options.maxRows || 1000000)) * 100, 100),
              currentChunk: Math.floor(rowCount / 1000) + 1
            });
          }
        },
        complete: () => {
          if (headers.length === 0) {
            resolve({
              success: false,
              error: 'No headers found in CSV'
            });
            return;
          }

          const fields = headers.map(header => ({
            name: header,
            type: this.inferFieldType(fieldValues[header]),
            value: fieldValues[header]
          }));

          resolve({
            success: true,
            data: {
              type: 'csv',
              content: { fields },
              name: file.name
            }
          });
        },
        error: (error: any) => {
          resolve({
            success: false,
            error: error.message
          });
        },
        header: false,
        skipEmptyLines: true,
        chunkSize: options.chunkSize || 10000
      });
    });
  }

  private async processExcelInMainThread(file: File): Promise<ProcessingResult> {
    try {
      const XLSX = require('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);

      if (!workbook.SheetNames.length) {
        return {
          success: false,
          error: 'Excel file contains no sheets'
        };
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        dateNF: 'yyyy-mm-dd',
        blankrows: false
      });

      if (!jsonData || jsonData.length < 2) {
        return {
          success: false,
          error: 'Invalid or empty Excel file'
        };
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];
      const fields = headers.map((name, columnIndex) => {
        const columnValues = rows.map(row => row[columnIndex]);
        return {
          name: String(name),
          type: this.inferFieldType(columnValues),
          value: columnValues
        };
      });

      return {
        success: true,
        data: {
          type: 'csv',
          content: { fields },
          name: file.name
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process Excel file'
      };
    }
  }

  private inferFieldType(values: any[]): 'number' | 'string' | 'boolean' | 'date' {
    const nonNullValues = values.filter(v => v != null && v !== '');
    if (nonNullValues.length === 0) return 'string';
    
    const types = nonNullValues.map(value => {
      if (typeof value === 'number' && value > 25569 && value < 50000) {
        return 'date';
      }
      if (typeof value === 'number' || (!isNaN(Number(value)) && value !== '')) {
        return 'number';
      }
      if (!isNaN(Date.parse(String(value)))) {
        return 'date';
      }
      if (typeof value === 'boolean' || ['true', 'false', '0', '1'].includes(String(value).toLowerCase())) {
        return 'boolean';
      }
      return 'string';
    });

    const uniqueTypes = [...new Set(types)];
    if (uniqueTypes.length === 1) return uniqueTypes[0] as 'number' | 'string' | 'boolean' | 'date';
    if (uniqueTypes.includes('number') && uniqueTypes.length === 2 && uniqueTypes.includes('string')) {
      return 'number';
    }
    return 'string';
  }

  cancel(): void {
    if (this.worker && this.isProcessing) {
      this.worker.postMessage({ type: 'cancel' });
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.isProcessing = false;
    this.resolvePromise = null;
    this.rejectPromise = null;
    this.currentFileName = null;
  }

  destroy(): void {
    this.cancel();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
} 
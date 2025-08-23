import { FileData } from '@/types/data';
import { createError } from '../core/error';
import { validateFile } from './validation';
import { FileProcessingWorkerManager } from './workers/WorkerManager';

const CHUNK_SIZE = 500000;

// Create a singleton worker manager instance
let workerManager: FileProcessingWorkerManager | null = null;

function getWorkerManager(): FileProcessingWorkerManager {
  if (!workerManager) {
    workerManager = new FileProcessingWorkerManager();
  }
  return workerManager;
}

export async function processFile(file: File): Promise<FileData> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw createError('INVALID_INPUT', validation.error || 'Invalid file');
    }

    // Use the worker manager for processing
    const manager = getWorkerManager();
    const result = await manager.processFile(file, {
      chunkSize: CHUNK_SIZE,
      includeStats: true
    });

    if (!result.success || !result.data) {
      throw createError('PROCESSING_FAILED', result.error || 'Failed to process file');
    }

    // Validate processed data
    if (!validateProcessedData(result.data)) {
      throw createError('PROCESSING_FAILED', 'Invalid processed data structure');
    }

    return result.data;
  } catch (error) {
    console.error('File processing error:', error);
    throw error instanceof Error ? error : createError('PROCESSING_FAILED', 'Failed to process file');
  }
}

function validateProcessedData(data: FileData): boolean {
  // Validate basic structure
  if (!data || typeof data !== 'object') {
    console.error('Validation failed: data is not an object', data);
    return false;
  }
  if (!data.type || !data.name) {
    console.error('Validation failed: missing type or name', { type: data.type, name: data.name });
    return false;
  }
  if (!data.content || !Array.isArray(data.content.fields)) {
    console.error('Validation failed: missing content or fields array', { content: data.content });
    return false;
  }
  if (data.content.fields.length === 0) {
    console.error('Validation failed: fields array is empty');
    return false;
  }

  // Validate each field
  const fieldValidation = data.content.fields.every((field, index) => {
    if (!field || typeof field !== 'object') {
      console.error(`Validation failed: field ${index} is not an object`, field);
      return false;
    }
    if (typeof field.name !== 'string' || field.name.length === 0) {
      console.error(`Validation failed: field ${index} has invalid name`, field.name);
      return false;
    }
    if (typeof field.type !== 'string' || !['number', 'string', 'date', 'boolean'].includes(field.type)) {
      console.error(`Validation failed: field ${index} has invalid type`, field.type);
      return false;
    }
    if (!Array.isArray(field.value) || field.value.length === 0) {
      console.error(`Validation failed: field ${index} has invalid value array`, field.value);
      return false;
    }
    return true;
  });

  if (!fieldValidation) {
    console.error('Validation failed: one or more fields failed validation');
  }

  return fieldValidation;
}

// Cleanup function for the worker manager
export function cleanupWorkerManager(): void {
  if (workerManager) {
    workerManager.destroy();
    workerManager = null;
  }
}
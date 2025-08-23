import { ERROR_MESSAGES, ANALYSIS_LIMITS } from './constants';

export class AnalysisError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

export function createAnalysisError(code: keyof typeof ERROR_MESSAGES, details?: any): AnalysisError {
  return new AnalysisError(code, ERROR_MESSAGES[code], details);
}

export function handleAnalysisError(error: unknown): AnalysisError {
  if (error instanceof AnalysisError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AnalysisError('COMPUTATION_ERROR', error.message);
  }
  
  return new AnalysisError('COMPUTATION_ERROR', 'An unknown error occurred');
}

export function validateAnalysisInput(data: any): void {
  if (!data || typeof data !== 'object') {
    throw createAnalysisError('INVALID_DATA');
  }
  
  if (Array.isArray(data) && data.length === 0) {
    throw createAnalysisError('INVALID_DATA', 'Empty dataset provided');
  }
}

export function checkAnalysisLimits(data: any): void {
  if (Array.isArray(data) && data.length > ANALYSIS_LIMITS.MAX_ROWS) {
    throw createAnalysisError('INVALID_DATA', `Dataset exceeds maximum row limit of ${ANALYSIS_LIMITS.MAX_ROWS}`);
  }
  
  if (typeof data === 'string' && data.length > ANALYSIS_LIMITS.MAX_TEXT_LENGTH) {
    throw createAnalysisError('INVALID_DATA', `Text exceeds maximum length of ${ANALYSIS_LIMITS.MAX_TEXT_LENGTH}`);
  }
} 
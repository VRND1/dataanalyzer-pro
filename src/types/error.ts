export enum ErrorCode {
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  SIMULATION_ERROR = 'SIMULATION_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PIPELINE_ERROR = 'PIPELINE_ERROR',
  INVALID_DATA = 'INVALID_DATA'
}

export type ErrorType = ErrorCode;

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: any;
} 
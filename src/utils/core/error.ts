export type ErrorType = 
  | 'VALIDATION_ERROR'
  | 'ANALYSIS_ERROR'
  | 'DATA_ERROR'
  | 'SYSTEM_ERROR'
  | 'ML_ERROR';

export type ErrorCode = 
  | 'INVALID_INPUT'
  | 'PROCESSING_FAILED'
  | 'DATA_NOT_FOUND'
  | 'SYSTEM_FAILURE';

export interface ErrorDetails {
  field?: string;
  value?: any;
  constraint?: string;
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: ErrorDetails
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AnalysisError extends Error {
  constructor(
    public type: ErrorType,
    message: string
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

export function createError(
  typeOrCode: ErrorType | ErrorCode, 
  message: string, 
  details?: ErrorDetails
): AppError | AnalysisError {
  if (isErrorCode(typeOrCode)) {
    return new AppError(typeOrCode, message, details);
  }
  return new AnalysisError(typeOrCode, message);
}

function isErrorCode(value: ErrorType | ErrorCode): value is ErrorCode {
  const errorCodes: ErrorCode[] = [
    'INVALID_INPUT',
    'PROCESSING_FAILED',
    'DATA_NOT_FOUND',
    'SYSTEM_FAILURE'
  ];
  return errorCodes.includes(value as ErrorCode);
}
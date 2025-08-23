import { AppError, createError, ErrorCode } from '../core/error';
import type { ValidationResult } from '@/types/validation';

export function handleValidationError(
  message: string,
  field?: string
): ValidationResult {
  return {
    isValid: false,
    error: message,
    details: field ? { field } : undefined
  };
}

export function throwValidationError(
  code: ErrorCode,
  message: string,
  field?: string
): never {
  throw createError(code, message, field ? { field } : undefined);
}

export function validateOrThrow(result: ValidationResult): void {
  if (!result.isValid) {
    throwValidationError(
      'INVALID_INPUT',
      result.error || 'Validation failed',
      result.details?.field as string
    );
  }
}

export function wrapValidationErrors<T>(
  fn: () => T,
  errorMessage: string = 'Validation failed'
): ValidationResult {
  try {
    fn();
    return { isValid: true };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        isValid: false,
        error: error.message,
        details: error.details
      };
    }
    return {
      isValid: false,
      error: errorMessage
    };
  }
}
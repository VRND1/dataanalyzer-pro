import { DataField } from '@/types/data';
import { ValidationResult } from '@/types/validation';
import { createError } from '../core/error';

export function validateDataset(fields: DataField[]): ValidationResult {
  try {
    if (!Array.isArray(fields) || fields.length === 0) {
      return {
        isValid: false,
        error: 'No data fields provided'
      };
    }

    for (const field of fields) {
      const fieldValidation = validateField(field);
      if (!fieldValidation.isValid) {
        return fieldValidation;
      }
    }

    return { isValid: true };
  } catch (error) {
    throw createError(
      'VALIDATION_ERROR',
      error instanceof Error ? error.message : 'Validation failed'
    );
  }
}

export function validateField(field: DataField): ValidationResult {
  if (!field.name?.trim()) {
    return {
      isValid: false,
      error: 'Field name is required'
    };
  }

  if (!field.type || !['number', 'string', 'date', 'boolean'].includes(field.type)) {
    return {
      isValid: false,
      error: `Invalid type for field ${field.name}`
    };
  }

  if (!Array.isArray(field.value) || field.value.length === 0) {
    return {
      isValid: false,
      error: `No values provided for field ${field.name}`
    };
  }

  return { isValid: true };
}

export function validateNumericData(values: any[]): number[] {
  return values.filter(v => 
    typeof v === 'number' && !isNaN(v) && isFinite(v)
  );
}

/**
 * Validates if a data field has the proper structure
 */
export function isValidDataField(field: any): field is DataField {
  return (
    field &&
    typeof field === 'object' &&
    typeof field.name === 'string' &&
    typeof field.type === 'string' &&
    ['number', 'string', 'boolean', 'date'].includes(field.type) &&
    Array.isArray(field.value)
  );
}

/**
 * Validates if a data field has valid values for analysis
 */
export function hasValidValues(field: DataField): boolean {
  if (!field.value || !Array.isArray(field.value)) {
    return false;
  }

  if (field.type === 'number') {
    return field.value.length > 0 && field.value.every(v => 
      typeof v === 'number' && !isNaN(v) && isFinite(v)
    );
  }

  return field.value.length > 0;
}

/**
 * Filters and validates an array of data fields
 */
export function getValidFields(fields: any[]): DataField[] {
  return fields.filter(field => isValidDataField(field) && hasValidValues(field));
}

/**
 * Gets numeric fields that are valid for analysis
 */
export function getValidNumericFields(fields: DataField[]): DataField[] {
  return fields.filter(field => 
    field.type === 'number' && hasValidValues(field)
  );
}

/**
 * Gets text fields that are valid for analysis
 */
export function getValidTextFields(fields: DataField[]): DataField[] {
  return fields.filter(field => 
    field.type === 'string' && hasValidValues(field)
  );
}

/**
 * Validates the overall data structure
 */
export function validateDataStructure(data: any): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Data is not an object' };
  }

  if (!data.fields || !Array.isArray(data.fields)) {
    return { isValid: false, error: 'Fields array is missing or invalid' };
  }

  if (data.fields.length === 0) {
    return { isValid: false, error: 'No fields found in data' };
  }

  const validFields = getValidFields(data.fields);
  if (validFields.length === 0) {
    return { isValid: false, error: 'No valid fields found in data' };
  }

  return { isValid: true };
}

/**
 * Debug utility to help identify filter errors
 */
export function debugFieldStructure(field: any, fieldName?: string): void {
  console.group(`Field Debug: ${fieldName || field?.name || 'Unknown'}`);
  console.log('Field object:', field);
  console.log('Field type:', typeof field);
  console.log('Field value:', field?.value);
  console.log('Field value type:', typeof field?.value);
  console.log('Is array:', Array.isArray(field?.value));
  console.log('Has filter method:', field?.value && typeof field.value.filter === 'function');
  console.groupEnd();
}

/**
 * Safe filter utility that won't throw errors
 */
export function safeFilter<T>(array: T[] | undefined | null, predicate: (item: T) => boolean): T[] {
  if (!array || !Array.isArray(array)) {
    return [];
  }
  try {
    return array.filter(predicate);
  } catch (error) {
    console.warn('Safe filter error suppressed:', error);
    return [];
  }
}
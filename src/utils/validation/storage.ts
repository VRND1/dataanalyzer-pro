import { ValidationResult } from '@/types/validation';
import { DataField } from '@/utils/core/types';

export function validateStorageData(data: any): ValidationResult {
  // Basic structure validation
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      error: 'Invalid data structure'
    };
  }

  // Required properties validation
  if (!data.type || !data.name) {
    return {
      isValid: false,
      error: 'Missing required properties'
    };
  }

  // Content structure validation
  if (!data.content || !Array.isArray(data.content.fields) || !data.content.fields.length) {
    return {
      isValid: false,
      error: 'Invalid or empty data fields'
    };
  }

  // Field structure validation
  const invalidFields = data.content.fields.filter((field: Partial<DataField>) => {
    if (!field || typeof field !== 'object') return true;
    if (!field.name || typeof field.name !== 'string') return true;
    if (!field.type || !['number', 'string', 'date', 'boolean'].includes(field.type)) return true;
    if (!Array.isArray(field.value)) return true;
    return false;
  });

  if (invalidFields.length > 0) {
    const invalidFieldNames = invalidFields
      .map((f: Partial<DataField>) => (f?.name && typeof f.name === 'string' ? f.name : 'unnamed'))
      .filter(Boolean);

    return {
      isValid: false,
      error: `Invalid fields found: ${invalidFieldNames.join(', ')}`,
      details: {
        invalidFields: invalidFieldNames
      }
    };
  }

  return { isValid: true };
}
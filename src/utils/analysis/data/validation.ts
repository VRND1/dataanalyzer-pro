import { DataField } from '@/types/data';
import { ValidationResult } from '../validation/types';
import { isValidValueForType } from '../validation/utils';

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

  if (!field.value || !Array.isArray(field.value)) {
    return {
      isValid: false,
      error: `Invalid value structure for field ${field.name}`
    };
  }

  const invalidValues = field.value.filter(v => !isValidValueForType(v, field.type));
  if (invalidValues.length > 0) {
    return {
      isValid: false,
      error: `Field ${field.name} contains ${invalidValues.length} invalid values`
    };
  }

  return { isValid: true };
}
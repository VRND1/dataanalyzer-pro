// Define types for file validation
export interface ValidationRule {
  type: string;
  value: any;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
} 
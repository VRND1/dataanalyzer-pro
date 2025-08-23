// Test file to check TypeScript import resolution
import { UploadOptions } from './file/upload';

export const test: UploadOptions = {
  maxSize: 1024,
  allowedTypes: ['image/jpeg', 'image/png'],
  multiple: false
}; 
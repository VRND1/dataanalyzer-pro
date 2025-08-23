// Define types for file upload
export interface UploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  error?: string;
} 
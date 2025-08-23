// Define types for file processing
export interface ProcessingOptions {
  format?: string;
  quality?: number;
  resize?: {
    width?: number;
    height?: number;
  };
}

export interface ProcessingResult {
  success: boolean;
  processedFileId?: string;
  error?: string;
} 
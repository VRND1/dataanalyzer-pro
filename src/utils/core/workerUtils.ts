/**
 * Utility functions for creating Web Workers with CSP compliance
 */

export interface WorkerOptions {
  type?: 'classic' | 'module';
  credentials?: RequestCredentials;
  name?: string;
}

export interface WorkerCreationResult {
  worker: Worker | null;
  error?: string;
  fallback?: boolean;
}

/**
 * Creates a Web Worker with CSP-compliant error handling
 */
export function createWorker(
  scriptURL: string | URL,
  options?: WorkerOptions
): WorkerCreationResult {
  try {
    const worker = new Worker(scriptURL, options);
    return { worker };
  } catch (error) {
    console.warn('Failed to create Web Worker:', error);
    
    // Check if it's a CSP-related error
    if (error instanceof Error && error.message.includes('Content Security Policy')) {
      return {
        worker: null,
        error: 'Web Workers blocked by Content Security Policy',
        fallback: true
      };
    }
    
    return {
      worker: null,
      error: error instanceof Error ? error.message : 'Unknown error creating worker'
    };
  }
}

/**
 * Creates a Web Worker from a blob URL with CSP compliance
 */
export function createWorkerFromBlob(
  scriptContent: string,
  options?: WorkerOptions
): WorkerCreationResult {
  try {
    const blob = new Blob([scriptContent], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url, options);
    
    // Clean up the blob URL after worker creation
    worker.addEventListener('error', () => URL.revokeObjectURL(url));
    worker.addEventListener('message', () => URL.revokeObjectURL(url));
    
    return { worker };
  } catch (error) {
    console.warn('Failed to create Web Worker from blob:', error);
    
    if (error instanceof Error && error.message.includes('Content Security Policy')) {
      return {
        worker: null,
        error: 'Blob-based Web Workers blocked by Content Security Policy',
        fallback: true
      };
    }
    
    return {
      worker: null,
      error: error instanceof Error ? error.message : 'Unknown error creating blob worker'
    };
  }
}

/**
 * Creates a Web Worker from a data URL with CSP compliance
 */
export function createWorkerFromDataURL(
  scriptContent: string,
  options?: WorkerOptions
): WorkerCreationResult {
  try {
    const dataURL = `data:text/javascript;base64,${btoa(scriptContent)}`;
    const worker = new Worker(dataURL, options);
    return { worker };
  } catch (error) {
    console.warn('Failed to create Web Worker from data URL:', error);
    
    if (error instanceof Error && error.message.includes('Content Security Policy')) {
      return {
        worker: null,
        error: 'Data URL Web Workers blocked by Content Security Policy',
        fallback: true
      };
    }
    
    return {
      worker: null,
      error: error instanceof Error ? error.message : 'Unknown error creating data URL worker'
    };
  }
}

/**
 * Checks if Web Workers are supported and allowed by CSP
 */
export function isWorkerSupported(): boolean {
  try {
    // Try to create a minimal worker to test CSP compliance
    const testWorker = new Worker('data:text/javascript,');
    testWorker.terminate();
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets CSP-compliant worker creation strategy
 */
export function getWorkerStrategy(): 'native' | 'blob' | 'data-url' | 'disabled' {
  if (!isWorkerSupported()) {
    return 'disabled';
  }
  
  // Test different strategies
  try {
    new Worker('data:text/javascript,');
    return 'data-url';
  } catch {
    try {
      const blob = new Blob([''], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      new Worker(url).terminate();
      URL.revokeObjectURL(url);
      return 'blob';
    } catch {
      return 'native';
    }
  }
} 
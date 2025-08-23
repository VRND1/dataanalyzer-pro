// Worker utilities
export { FileProcessingWorkerManager } from './WorkerManager';
export type { ProcessingOptions, ProgressInfo, ProcessingResult } from './WorkerManager';

// Worker script (for reference)
// export { default as FileProcessingWorker } from './FileProcessingWorker'; // Removed, no default export

// React hooks
export { useFileProcessingWorker } from '@/hooks/file/useFileProcessingWorker';
export type { UseFileProcessingWorkerReturn } from '@/hooks/file/useFileProcessingWorker';

// Components
export { FileUploadWithWorker } from '@/components/file/FileUploadWithWorker';
// export { FileProcessingDemo } from '../../components/file/FileProcessingDemo'; // Removed, file does not exist 
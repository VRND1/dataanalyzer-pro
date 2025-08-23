import React, { useCallback, useRef, useState } from 'react';
import { Upload, Loader, AlertCircle, X, CheckCircle, FileText, BarChart3 } from 'lucide-react';
import { useFileProcessingWorker } from '../../hooks/file/useFileProcessingWorker';
import { FileData } from '../../types/data';
import { MAX_FILE_SIZE } from '../../utils/core/constants';

interface FileUploadWithWorkerProps {
  onFileProcessed: (data: FileData) => void;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  showProgress?: boolean;
  className?: string;
}

export function FileUploadWithWorker({
  onFileProcessed,
  maxFileSize = MAX_FILE_SIZE,
  acceptedFileTypes = ['.csv', '.xlsx', '.xls'],
  showProgress = true,
  className = ''
}: FileUploadWithWorkerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const {
    fileData,
    isProcessing,
    progress,
    error,
    processFile,
    cancelProcessing,
    reset
  } = useFileProcessingWorker();

  const handleFileChange = useCallback(async (file: File) => {
    // Validate file size
    if (file.size > maxFileSize) {
      alert(`File size must be less than ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB`);
      return;
    }

    // Validate file type
    const isValidType = acceptedFileTypes.some(type => 
      type.startsWith('.') ? file.name.toLowerCase().endsWith(type) : file.type.includes(type)
    );

    if (!isValidType) {
      alert(`Please select a valid file type: ${acceptedFileTypes.join(', ')}`);
      return;
    }

    setSelectedFile(file);
    reset();

    try {
      const processedData = await processFile(file, {
        chunkSize: 10000,
        includeStats: true,
        onProgress: (progressInfo) => {
          console.log('Processing progress:', progressInfo);
        }
      });

      onFileProcessed(processedData);
    } catch (err) {
      console.error('File processing error:', err);
    }
  }, [maxFileSize, acceptedFileTypes, processFile, reset, onFileProcessed]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  }, [handleFileChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  }, [handleFileChange]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCancel = useCallback(() => {
    cancelProcessing();
    setSelectedFile(null);
    reset();
  }, [cancelProcessing, reset]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'csv':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'xlsx':
      case 'xls':
        return <BarChart3 className="h-8 w-8 text-green-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* File Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${dragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-gray-400'}
          ${isProcessing ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedFileTypes.join(',')}
          onChange={handleInputChange}
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center">
            <Loader className="h-12 w-12 text-teal-500 animate-spin" />
            <p className="mt-4 text-sm font-medium text-gray-900">
              Processing {selectedFile?.name}
            </p>
            
            {showProgress && progress && (
              <div className="mt-4 w-full max-w-md">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress.percentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{progress.processed.toLocaleString()} rows processed</span>
                  {progress.total && (
                    <span>of {progress.total.toLocaleString()}</span>
                  )}
                </div>
              </div>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="mt-4 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              Cancel Processing
            </button>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center">
            {getFileIcon(selectedFile.name)}
            <p className="mt-2 text-sm font-medium text-gray-900">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(selectedFile.size)}
            </p>
            {fileData && (
              <div className="mt-2 flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Processed successfully</span>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="mt-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className={`mx-auto h-12 w-12 ${error ? 'text-red-400' : 'text-gray-400'}`} />
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900">
                Drop your data file here, or click to select
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supported formats: {acceptedFileTypes.join(', ')} (up to {(maxFileSize / (1024 * 1024)).toFixed(1)}MB)
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-2 text-red-600 bg-red-50 p-4 rounded-lg mt-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Processing Error</p>
            <p className="text-sm mt-1 break-words">{error}</p>
          </div>
        </div>
      )}

      {/* Processing Stats */}
      {fileData && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Processing Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Fields:</span>
              <span className="ml-2 font-medium">{fileData.content.fields.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Rows:</span>
              <span className="ml-2 font-medium">
                {fileData.content.fields[0]?.value.length.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
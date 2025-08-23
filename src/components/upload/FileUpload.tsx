import React, { useCallback, useRef } from 'react';
import { Upload, Loader, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  error: Error | null;
}

export function FileUpload({ onFileSelect, isProcessing, error }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.add('border-teal-500', 'bg-teal-500/10');
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-teal-500', 'bg-teal-500/10');
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      event.target.value = '';
    }
  }, [onFileSelect]);

  return (
    <div className="space-y-4">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-teal-500 hover:bg-teal-500/10'}`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <Loader className="h-12 w-12 text-teal-500 animate-spin" />
            <p className="mt-4 text-sm text-gray-300">Processing file...</p>
          </div>
        ) : (
          <>
            <Upload className={`mx-auto h-12 w-12 ${error ? 'text-red-400' : 'text-gray-500'}`} />
            <div className="mt-4">
              <p className="text-sm font-medium text-white">
                Drop a file here, or click to select
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Supported formats: CSV, Excel (up to 10MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error.message}</p>
        </div>
      )}
    </div>
  );
}
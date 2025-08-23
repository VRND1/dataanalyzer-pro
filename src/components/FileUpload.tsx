import React, { useCallback, useRef } from 'react';
import { Upload, Loader, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  error?: Error | null;
}

export default function FileUpload({ onFileSelect, isProcessing, error }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.add('border-blue-500', 'bg-blue-50/10');
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-blue-500', 'bg-blue-50/10');
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onFileSelect(file);
        // Reset the input value to allow selecting the same file again
        event.target.value = '';
      }
    },
    [onFileSelect]
  );

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 p-3 sm:p-4 md:p-6">
      <div className="text-center mb-3 sm:mb-4 space-y-1">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
          DataAnalyzer Pro
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-300">
          Transform your data into actionable insights with AI-powered analytics
        </p>
      </div>

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative
          border-2 
          border-dashed 
          rounded-xl
          p-4 sm:p-6 md:p-8
          text-center 
          transition-all 
          duration-300
          cursor-pointer
          min-h-[180px]
          sm:min-h-[220px]
          md:min-h-[260px]
          flex
          flex-col
          items-center
          justify-center
          backdrop-blur-sm
          ${error 
            ? 'border-red-500/50 bg-red-500/5' 
            : 'border-gray-500/30 hover:border-blue-500/50 hover:bg-blue-500/5'
          }
        `}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <Loader className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-blue-500 animate-spin" />
            <p className="mt-3 text-sm sm:text-base text-gray-300">Processing your data...</p>
          </div>
        ) : (
          <>
            <Upload 
              className={`
                h-8 w-8 
                sm:h-10 sm:w-10 
                md:h-12 md:w-12 
                mb-3
                ${error ? 'text-red-400' : 'text-blue-400'}
              `} 
            />
            <div className="space-y-1.5">
              <p className="text-base sm:text-lg md:text-xl font-medium text-white">
                Drop your data file here, or click to select
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
              <p className="text-xs sm:text-sm text-gray-400">
                Supported formats: CSV and Excel (up to 500MB)
              </p>
            </div>
          </>
        )}

        {/* Animated Border Gradient */}
        <div className="absolute inset-0 -z-10 animate-pulse-slow">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl" />
        </div>
      </div>

      {error && (
        <div className="
          flex 
          items-center 
          gap-2 
          text-red-400 
          bg-red-500/10 
          backdrop-blur-sm
          p-3 
          sm:p-4 
          rounded-lg
          border
          border-red-500/20
          mt-2
        ">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <p className="text-sm">{error.message}</p>
        </div>
      )}
    </div>
  );
}
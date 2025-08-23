# Web Worker File Processing Implementation

This document describes the Web Worker implementation for processing large files in the browser without blocking the main thread.

## Overview

The Web Worker file processing system allows users to upload and process large CSV and Excel files (up to 100MB) directly in the browser using background threads. This provides several benefits:

- **Non-blocking UI**: File processing happens in background threads
- **Real-time progress tracking**: Users can see processing progress
- **Better performance**: Large files are processed efficiently
- **Data privacy**: Processing happens entirely in the browser
- **Fallback support**: Graceful degradation to main thread processing

## Architecture

### Core Components

1. **FileProcessingWorker.ts** - Main worker script that handles file processing
2. **WorkerManager.ts** - Manager class for worker communication and lifecycle
3. **useFileProcessingWorker.ts** - React hook for worker integration
4. **FileUploadWithWorker.tsx** - Enhanced file upload component
5. **FileUploadWithWorker.tsx** - Enhanced file upload component with worker support

### File Structure

```
src/
├── utils/
│   └── file/
│       └── workers/
│           ├── FileProcessingWorker.ts    # Main worker script
│           ├── WorkerManager.ts           # Worker manager
│           └── index.ts                   # Exports
├── hooks/
│   └── file/
│       └── useFileProcessingWorker.ts     # React hook
├── components/
│   └── file/
│       ├── FileUploadWithWorker.tsx       # Enhanced upload component
│       └── FileUploadWithWorker.tsx       # Enhanced upload component
└── utils/
    └── core/
        └── workerUtils.ts                 # Worker utilities
```

## Features

### 1. Large File Support
- **CSV files**: Up to 100MB with chunked processing
- **Excel files**: Up to 100MB with memory-efficient processing
- **Progress tracking**: Real-time progress updates
- **Cancellation**: Users can cancel processing

### 2. Smart Data Processing
- **Automatic type inference**: Detects number, string, date, boolean types
- **Statistical analysis**: Calculates mean, median, standard deviation
- **Data validation**: Ensures data integrity
- **Memory management**: Efficient memory usage for large files

### 3. Enhanced User Experience
- **Drag & drop support**: Intuitive file upload
- **Progress indicators**: Visual progress bars and metrics
- **Error handling**: Comprehensive error reporting
- **Responsive design**: Works on all screen sizes

## Usage

### Basic Usage

```tsx
import { FileUploadWithWorker } from '@/components/file/FileUploadWithWorker';

function MyComponent() {
  const handleFileProcessed = (data: FileData) => {
    console.log('File processed:', data);
  };

  return (
    <FileUploadWithWorker
      onFileProcessed={handleFileProcessed}
      maxFileSize={100 * 1024 * 1024} // 100MB
      acceptedFileTypes={['.csv', '.xlsx', '.xls']}
      showProgress={true}
    />
  );
}
```

### Advanced Usage with Custom Options

```tsx
import { useFileProcessingWorker } from '@/hooks/file/useFileProcessingWorker';

function AdvancedComponent() {
  const {
    fileData,
    isProcessing,
    progress,
    error,
    processFile,
    cancelProcessing,
    reset
  } = useFileProcessingWorker();

  const handleFileUpload = async (file: File) => {
    try {
      const result = await processFile(file, {
        chunkSize: 5000,
        maxRows: 100000,
        includeStats: true,
        onProgress: (progressInfo) => {
          console.log(`Processing: ${progressInfo.percentage}%`);
        }
      });
      console.log('Processing complete:', result);
    } catch (error) {
      console.error('Processing failed:', error);
    }
  };

  return (
    <div>
      {isProcessing && (
        <div>
          <p>Processing: {progress?.percentage}%</p>
          <button onClick={cancelProcessing}>Cancel</button>
        </div>
      )}
      {/* Your custom UI */}
    </div>
  );
}
```

### Direct Worker Manager Usage

```tsx
import { FileProcessingWorkerManager } from '@/utils/file/workers';

const manager = new FileProcessingWorkerManager();

// Process a file
const result = await manager.processFile(file, {
  chunkSize: 10000,
  includeStats: true,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
  }
});

// Cleanup
manager.destroy();
```

## Configuration Options

### ProcessingOptions

```typescript
interface ProcessingOptions {
  chunkSize?: number;        // Number of rows per chunk (default: 10000)
  maxRows?: number;          // Maximum rows to process (default: Infinity)
  includeStats?: boolean;    // Include statistical analysis (default: true)
  onProgress?: (progress: ProgressInfo) => void;  // Progress callback
  onError?: (error: string) => void;              // Error callback
}
```

### ProgressInfo

```typescript
interface ProgressInfo {
  processed: number;         // Number of rows processed
  total?: number;           // Total rows to process
  percentage: number;       // Progress percentage (0-100)
  currentChunk: number;     // Current chunk being processed
}
```

## Performance Considerations

### Memory Management
- Files are processed in chunks to prevent memory overflow
- Excel files use range-based processing for large datasets
- Automatic cleanup of worker resources

### Browser Compatibility
- **Modern browsers**: Full Web Worker support
- **Older browsers**: Fallback to main thread processing
- **CSP restrictions**: Multiple worker creation strategies

### File Size Limits
- **Recommended**: Up to 50MB for optimal performance
- **Maximum**: 100MB (may be slower on older devices)
- **Small files**: Use regular processing for better performance

## Error Handling

### Common Errors
1. **File too large**: Exceeds maximum file size limit
2. **Invalid file type**: Unsupported file format
3. **Corrupted file**: File cannot be parsed
4. **Worker creation failed**: Fallback to main thread processing
5. **Processing cancelled**: User cancelled the operation

### Error Recovery
- Automatic fallback to main thread processing
- Graceful degradation for unsupported features
- Clear error messages for user feedback

## Testing

### Manual Testing
1. Upload small files (< 1MB) - should work quickly
2. Upload medium files (1-10MB) - should show progress
3. Upload large files (10-100MB) - should handle gracefully
4. Test cancellation during processing
5. Test different file formats (CSV, Excel)

### Performance Testing
- Monitor memory usage during large file processing
- Test processing speed with different chunk sizes
- Verify UI responsiveness during processing

## Browser Support

### Web Worker Support
- ✅ Chrome 4+
- ✅ Firefox 3.5+
- ✅ Safari 4+
- ✅ Edge 12+
- ❌ Internet Explorer 10 and below

### Fallback Behavior
- **No Web Worker support**: Falls back to main thread processing
- **CSP restrictions**: Uses alternative worker creation methods
- **Memory limitations**: Reduces chunk size automatically

## Troubleshooting

### Common Issues

1. **Worker not starting**
   - Check browser console for errors
   - Verify CSP settings allow workers
   - Try refreshing the page

2. **Slow processing**
   - Reduce chunk size for better performance
   - Check available memory
   - Consider using smaller files

3. **Progress not updating**
   - Verify progress callback is working
   - Check for JavaScript errors
   - Ensure UI is not blocked

4. **File upload fails**
   - Check file size limits
   - Verify file format is supported
   - Check browser console for errors

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
REACT_APP_DEBUG_WORKERS=true
```

This will log detailed information about worker creation, processing, and errors.

## Future Enhancements

### Planned Features
1. **Streaming processing**: Process files as they're being uploaded
2. **Parallel processing**: Use multiple workers for very large files
3. **Advanced analytics**: More sophisticated data analysis
4. **File compression**: Support for compressed files
5. **Batch processing**: Process multiple files simultaneously

### Performance Optimizations
1. **WebAssembly integration**: Use WASM for faster processing
2. **SharedArrayBuffer**: For better memory sharing
3. **Service Worker caching**: Cache processed results
4. **IndexedDB storage**: Store large datasets locally

## Contributing

When contributing to the Web Worker implementation:

1. **Test thoroughly**: Test with various file sizes and types
2. **Check performance**: Monitor memory usage and processing speed
3. **Handle errors gracefully**: Provide clear error messages
4. **Maintain compatibility**: Ensure fallback behavior works
5. **Update documentation**: Keep this document current

## License

This implementation is part of the DataAnalyzer Pro project and follows the same licensing terms. 
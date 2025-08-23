import { useState, useEffect } from 'react';
import { isWorkerSupported, getWorkerStrategy } from '@/utils/core/workerUtils';

interface WorkerDiagnosticsProps {
  className?: string;
}

export function WorkerDiagnostics({ className }: WorkerDiagnosticsProps) {
  const [workerStatus, setWorkerStatus] = useState<{
    supported: boolean;
    strategy: string;
    cspBlocked: boolean;
  }>({
    supported: false,
    strategy: 'unknown',
    cspBlocked: false
  });

  useEffect(() => {
    const checkWorkerSupport = () => {
      const supported = isWorkerSupported();
      const strategy = getWorkerStrategy();
      
      // Check if CSP is blocking workers
      let cspBlocked = false;
      try {
        new Worker('data:text/javascript,');
      } catch (error) {
        if (error instanceof Error && error.message.includes('Content Security Policy')) {
          cspBlocked = true;
        }
      }

      setWorkerStatus({
        supported,
        strategy,
        cspBlocked
      });
    };

    checkWorkerSupport();
  }, []);

  const getStatusColor = () => {
    if (!workerStatus.supported || workerStatus.cspBlocked) {
      return 'text-red-500';
    }
    if (workerStatus.strategy === 'disabled') {
      return 'text-yellow-500';
    }
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (workerStatus.cspBlocked) {
      return 'Blocked by CSP';
    }
    if (!workerStatus.supported) {
      return 'Not Supported';
    }
    if (workerStatus.strategy === 'disabled') {
      return 'Disabled';
    }
    return 'Working';
  };

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Web Worker Diagnostics</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Strategy:</span>
          <span className="font-mono text-sm">{workerStatus.strategy}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Supported:</span>
          <span className={workerStatus.supported ? 'text-green-500' : 'text-red-500'}>
            {workerStatus.supported ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>CSP Blocked:</span>
          <span className={workerStatus.cspBlocked ? 'text-red-500' : 'text-green-500'}>
            {workerStatus.cspBlocked ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {workerStatus.cspBlocked && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium text-yellow-800 mb-2">CSP Issue Detected</h4>
          <p className="text-sm text-yellow-700">
            Web Workers are being blocked by Content Security Policy. 
            The application will fall back to main thread processing, 
            which may be slower for large datasets.
          </p>
        </div>
      )}

      {!workerStatus.supported && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="font-medium text-red-800 mb-2">Web Workers Not Supported</h4>
          <p className="text-sm text-red-700">
            Your browser doesn't support Web Workers. 
            The application will use main thread processing.
          </p>
        </div>
      )}
    </div>
  );
} 
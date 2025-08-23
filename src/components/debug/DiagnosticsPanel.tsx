import React from 'react';
import { Activity, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useDebug } from '@/hooks/useDebug';

export function DiagnosticsPanel() {
  const { isChecking, results, error, runDiagnostics, getLogs, getPerformanceMetrics } = useDebug();
  const [showLogs, setShowLogs] = React.useState(false);
  const [selectedComponent, setSelectedComponent] = React.useState<string | undefined>();

  const logs = React.useMemo(() => 
    getLogs(selectedComponent),
    [getLogs, selectedComponent]
  );

  const metrics = React.useMemo(() => 
    getPerformanceMetrics(selectedComponent),
    [getPerformanceMetrics, selectedComponent]
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold">System Diagnostics</h3>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={isChecking}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Run Diagnostics
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
          {error.message}
        </div>
      )}

      {/* Results */}
      {Object.entries(results).length > 0 && (
        <div className="space-y-4 mb-6">
          {Object.entries(results).map(([key, success]) => (
            <div
              key={key}
              className={`p-4 rounded-lg border ${
                success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium capitalize">
                    {key} {success ? 'OK' : 'Failed'}
                  </span>
                </div>
                <span className={success ? 'text-green-600' : 'text-red-600'}>
                  {success ? 'Passed' : 'Failed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logs and Metrics */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="text-sm text-teal-600 hover:text-teal-700"
          >
            {showLogs ? 'Hide' : 'Show'} Details
          </button>
          <select
            value={selectedComponent || ''}
            onChange={(e) => setSelectedComponent(e.target.value || undefined)}
            className="text-sm border rounded-md"
          >
            <option value="">All Components</option>
            <option value="Supabase">Supabase</option>
            <option value="Storage">Storage</option>
            <option value="Processing">Processing</option>
          </select>
        </div>

        {showLogs && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
              <div className="space-y-2">
                {metrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {metric.component} - {metric.operation}
                    </span>
                    <span className="font-medium">
                      {metric.duration.toFixed(2)}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Debug Logs */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Debug Logs</h4>
              <div className="space-y-2 max-h-60 overflow-auto">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${
                      log.level === 'error' ? 'bg-red-50 text-red-700' :
                      log.level === 'warn' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{log.component}</span>
                      <span className="text-xs">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1">{log.message}</p>
                    {log.details && (
                      <pre className="mt-1 text-xs overflow-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
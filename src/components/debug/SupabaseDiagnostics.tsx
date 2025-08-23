import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '@/utils/supabase/client';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export const SupabaseDiagnostics: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics: DiagnosticResult[] = [];

    // Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || supabaseUrl === 'https://nexxulmmmcmekbzftvvq.supabase.co') {
      diagnostics.push({
        name: 'Environment Variables',
        status: 'error',
        message: 'VITE_SUPABASE_URL is not configured',
        details: 'Please set VITE_SUPABASE_URL in your .env file'
      });
    } else {
      diagnostics.push({
        name: 'Environment Variables',
        status: 'success',
        message: 'VITE_SUPABASE_URL is configured',
        details: supabaseUrl
      });
    }

    if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
      diagnostics.push({
        name: 'API Key',
        status: 'error',
        message: 'VITE_SUPABASE_ANON_KEY is not configured',
        details: 'Please set VITE_SUPABASE_ANON_KEY in your .env file'
      });
    } else {
      diagnostics.push({
        name: 'API Key',
        status: 'success',
        message: 'VITE_SUPABASE_ANON_KEY is configured',
        details: `${supabaseAnonKey.substring(0, 20)}...`
      });
    }

    // Check Supabase configuration
    if (isSupabaseConfigured()) {
      diagnostics.push({
        name: 'Supabase Configuration',
        status: 'success',
        message: 'Supabase is properly configured'
      });

      // Test connection
      try {
        const connectionTest = await testSupabaseConnection();
        if (connectionTest.success) {
          diagnostics.push({
            name: 'Connection Test',
            status: 'success',
            message: 'Successfully connected to Supabase'
          });
        } else {
          diagnostics.push({
            name: 'Connection Test',
            status: 'error',
            message: 'Failed to connect to Supabase',
            details: connectionTest.error
          });
        }
      } catch (error) {
        diagnostics.push({
          name: 'Connection Test',
          status: 'error',
          message: 'Connection test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      diagnostics.push({
        name: 'Supabase Configuration',
        status: 'error',
        message: 'Supabase is not properly configured'
      });
    }

    // Check OAuth providers - test with a simple auth call
    try {
      const { error } = await supabase.auth.getSession();
      if (error) {
        diagnostics.push({
          name: 'OAuth Providers',
          status: 'warning',
          message: 'Could not check OAuth providers',
          details: error.message
        });
      } else {
        diagnostics.push({
          name: 'OAuth Providers',
          status: 'success',
          message: 'OAuth providers check completed'
        });
      }
    } catch (error) {
      diagnostics.push({
        name: 'OAuth Providers',
        status: 'warning',
        message: 'OAuth providers check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setResults(diagnostics);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Supabase Diagnostics</h3>
      
      <button
        onClick={runDiagnostics}
        disabled={isRunning}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isRunning ? 'Running...' : 'Run Diagnostics'}
      </button>

      <div className="space-y-3">
        {results.map((result, index) => (
          <div key={index} className="border rounded p-3">
            <div className="flex items-center gap-2">
              <span>{getStatusIcon(result.status)}</span>
              <span className={`font-medium ${getStatusColor(result.status)}`}>
                {result.name}
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-1">{result.message}</p>
            {result.details && (
              <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 p-2 rounded">
                {result.details}
              </p>
            )}
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">Next Steps:</h4>
          <ul className="text-sm space-y-1">
            <li>• Create a <code>.env</code> file in your project root</li>
            <li>• Add your Supabase URL and API key</li>
            <li>• Configure Google OAuth in your Supabase dashboard</li>
            <li>• Restart your development server</li>
          </ul>
        </div>
      )}
    </div>
  );
}; 
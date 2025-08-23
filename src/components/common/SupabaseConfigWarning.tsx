import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from '@/utils/supabase/client';

interface SupabaseConfigWarningProps {
  children: React.ReactNode;
}

export const SupabaseConfigWarning: React.FC<SupabaseConfigWarningProps> = ({ children }) => {
  const isConfigured = isSupabaseConfigured();

  if (isConfigured) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Supabase Configuration Required
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Storage features are disabled because Supabase is not properly configured. 
                To enable file storage and dataset management:
              </p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Create a <code className="bg-yellow-100 px-1 rounded">.env</code> file in your project root</li>
                <li>Add your Supabase credentials:
                  <pre className="bg-yellow-100 p-2 rounded mt-1 text-xs">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
                  </pre>
                </li>
                <li>Restart your development server</li>
              </ol>
              <p className="mt-2">
                See <code className="bg-yellow-100 px-1 rounded">SUPABASE_SETUP.md</code> for detailed instructions.
              </p>
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}; 
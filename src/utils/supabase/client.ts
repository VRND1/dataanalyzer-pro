import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Secure, recommended approach for frontend: use Vite environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export isSupabaseConfigured for diagnostics and other checks
export const isSupabaseConfigured = (): boolean => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Export testSupabaseConnection for diagnostics
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string; details?: any }> => {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase credentials not configured',
        details: {
          hasUrl: !!SUPABASE_URL,
          hasKey: !!SUPABASE_ANON_KEY,
          isConfigured: isSupabaseConfigured()
        }
      };
    }

    // Test basic connection with a simple auth call instead of database query
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        error: error.message,
        details: {
          errorCode: error.status,
          errorMessage: error.message
        }
      };
    }

    return { 
      success: true,
      details: {
        session: data.session ? 'Active session' : 'No active session',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString()
      }
    };
  }
};
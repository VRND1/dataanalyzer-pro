import { supabase } from '@/utils/supabase/client';
import { DebugLogger } from './DebugLogger';

export class ConnectionValidator {
  private static instance: ConnectionValidator;
  private logger = DebugLogger.getInstance();

  static getInstance(): ConnectionValidator {
    if (!ConnectionValidator.instance) {
      ConnectionValidator.instance = new ConnectionValidator();
    }
    return ConnectionValidator.instance;
  }

  async validateSupabaseConnection(): Promise<boolean> {
    try {
      const start = performance.now();
      const { error } = await supabase.from('profiles').select('count').single();
      const duration = performance.now() - start;

      if (error) {
        this.logger.log('error', 'Supabase', 'Connection failed', {
          error: error.message,
          duration
        });
        return false;
      }

      this.logger.log('info', 'Supabase', 'Connection successful', {
        duration,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      this.logger.log('error', 'Supabase', 'Connection error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  async validateFileUpload(): Promise<boolean> {
    try {
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const { data, error } = await supabase.storage
        .from('test-bucket')
        .upload(`test-${Date.now()}.txt`, testFile);

      if (error) {
        this.logger.log('error', 'Storage', 'Upload test failed', {
          error: error.message
        });
        return false;
      }

      // Clean up test file
      if (data?.path) {
        await supabase.storage
          .from('test-bucket')
          .remove([data.path]);
      }

      this.logger.log('info', 'Storage', 'Upload test successful');
      return true;
    } catch (error) {
      this.logger.log('error', 'Storage', 'Upload test error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  async validateDataProcessing(sampleData: any[]): Promise<boolean> {
    try {
      const start = performance.now();
      const processed = await this.processSampleData(sampleData);
      const duration = performance.now() - start;

      this.logger.log('info', 'Processing', 'Data processing test successful', {
        duration,
        sampleSize: sampleData.length,
        processedSize: processed.length
      });
      return true;
    } catch (error) {
      this.logger.log('error', 'Processing', 'Data processing test failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  private async processSampleData(data: any[]): Promise<any[]> {
    // Implement sample data processing logic
    return data.map(item => ({ ...item, processed: true }));
  }
}
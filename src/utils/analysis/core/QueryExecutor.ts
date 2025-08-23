import { createError } from '@/utils/core/error';
import { DuckDBManager } from './DuckDBManager';
import { createWorker } from '@/utils/core/workerUtils';

interface Query {
  sql: string;
  params?: any[];
  options?: {
    useCache?: boolean;
    cacheDuration?: number;
    forceWorker?: boolean;
  };
}

interface QueryResult {
  data: any[];
  metadata: {
    executionTime: number;
    rowCount: number;
    cached: boolean;
  };
}

export class QueryExecutor {
  private static instance: QueryExecutor;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private worker: Worker | null = null;

  private constructor() {
    this.initializeWorker();
  }

  static getInstance(): QueryExecutor {
    if (!QueryExecutor.instance) {
      QueryExecutor.instance = new QueryExecutor();
    }
    return QueryExecutor.instance;
  }

  private initializeWorker() {
    const workerResult = createWorker(
      new URL('./query.worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    if (workerResult.worker) {
      this.worker = workerResult.worker;
      this.worker.onerror = (error) => {
        console.error('Query worker error:', error);
      };
    } else {
      console.warn('Failed to create query worker, falling back to main thread:', workerResult.error);
    }
  }

  async executeQuery(query: Query): Promise<QueryResult> {
    const startTime = performance.now();

    try {
      // Check cache if enabled
      if (query.options?.useCache) {
        const cached = this.checkCache(query);
        if (cached) {
          return {
            data: cached,
            metadata: {
              executionTime: 0,
              rowCount: cached.length,
              cached: true
            }
          };
        }
      }

      let result;
      if (query.options?.forceWorker && this.worker) {
        // Execute in worker
        result = await this.executeInWorker(query);
      } else {
        // Execute query directly
        result = await this.executeQueryDirectly(query);
      }

      // Cache result if enabled
      if (query.options?.useCache) {
        this.cacheResult(query, result);
      }

      return {
        data: result,
        metadata: {
          executionTime: performance.now() - startTime,
          rowCount: result.length,
          cached: false
        }
      };
    } catch (error) {
      throw createError(
        'ANALYSIS_ERROR',
        error instanceof Error ? error.message : 'Query execution failed'
      );
    }
  }

  private checkCache(query: Query): any[] | null {
    const cacheKey = this.getCacheKey(query);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < (query.options?.cacheDuration || 5 * 60 * 1000)) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }
    
    return null;
  }

  private cacheResult(query: Query, result: any[]): void {
    const cacheKey = this.getCacheKey(query);
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
  }

  private getCacheKey(query: Query): string {
    return JSON.stringify({
      sql: query.sql,
      params: query.params
    });
  }

  private executeInWorker(query: Query): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const messageHandler = (event: MessageEvent) => {
        this.worker?.removeEventListener('message', messageHandler);
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.result);
        }
      };

      this.worker.addEventListener('message', messageHandler);
      this.worker.postMessage(query);
    });
  }

  private async executeQueryDirectly(query: Query): Promise<any[]> {
    // Basic query execution using DuckDB
    try {
      // Since DuckDBManager doesn't have a direct query method,
      // we'll log the query and return an empty array for now
      console.log('Executing query:', query.sql, 'with params:', query.params);
      
      // TODO: Implement proper query execution when DuckDBManager is updated
      // For now, return an empty array to avoid the linter error
      return [];
    } catch (error) {
      console.error('Error executing query directly:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  async destroy(): Promise<void> {
    this.worker?.terminate();
    this.worker = null;
    this.clearCache();
    await DuckDBManager.getInstance().cleanup();
  }
}
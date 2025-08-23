/// <reference lib="webworker" />

import { DataField } from '@/types/data';
import { calculateFieldStats } from '../statistics/calculations';
import { determineTrend } from '../statistics/trends';
import { calculateCorrelation } from '../statistics/correlation';

const CHUNK_SIZE = 50000;

interface AnalysisResult {
  statistics: Record<string, any>;
  trends: Array<{ field: string; trend: any }>;
  correlations: Array<{ fields: string[]; correlation: number }>;
  aggregates: any[];
}

class AnalysisWorker {
  async analyze(fields: DataField[]) {
    try {
      const results: AnalysisResult = {
        statistics: {},
        trends: [],
        correlations: [],
        aggregates: []
      };

      // Process fields in chunks
      for (let i = 0; i < fields.length; i += CHUNK_SIZE) {
        const chunk = fields.slice(i, Math.min(i + CHUNK_SIZE, fields.length));
        
        // Calculate statistics
        chunk.forEach(field => {
          if (field.type === 'number') {
            results.statistics[field.name] = calculateFieldStats(field);
            results.trends.push({
              field: field.name,
              trend: determineTrend(field.value as number[])
            });
          }
        });

        // Calculate correlations
        for (let j = 0; j < chunk.length; j++) {
          for (let k = j + 1; k < chunk.length; k++) {
            if (chunk[j].type === 'number' && chunk[k].type === 'number') {
              results.correlations.push({
                fields: [chunk[j].name, chunk[k].name],
                correlation: calculateCorrelation(
                  chunk[j].value as number[],
                  chunk[k].value as number[]
                )
              });
            }
          }
        }

        // Report progress
        self.postMessage({ 
          type: 'progress', 
          payload: Math.round((i / fields.length) * 100) 
        });
      }

      self.postMessage({ 
        type: 'complete', 
        payload: results 
      });
    } catch (error) {
      self.postMessage({ 
        type: 'error',
        payload: error instanceof Error ? error.message : 'Analysis failed'
      });
    }
  }
}

// Initialize worker
const worker = new AnalysisWorker();

// Handle messages
self.onmessage = async (e: MessageEvent) => {
  try {
    const { fields } = e.data;
    if (!fields?.length) {
      throw new Error('No fields provided for analysis');
    }

    await worker.analyze(fields);
  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: error instanceof Error ? error.message : 'Analysis failed',
      details: error
    });
  }
};
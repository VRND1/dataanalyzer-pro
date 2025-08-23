import { DataField } from '@/types/data';
import { AISimulationEngine, SimulationResult } from './ai/simulation';
import { createError } from '../core/error';

interface AISimulationEngineWithCleanup extends AISimulationEngine {
  cleanup?: () => Promise<void>;
}

export async function runSimulation({ fields }: { fields: DataField[] }): Promise<SimulationResult[]> {
  // Input validation
  if (!Array.isArray(fields)) {
    throw createError('ANALYSIS_ERROR', 'Fields must be an array');
  }

  if (!fields?.length) {
    throw createError('ANALYSIS_ERROR', 'No data available for simulation');
  }

  // Validate field structure
  fields.forEach(field => {
    if (!field.name || !field.type || !Array.isArray(field.value)) {
      throw createError('ANALYSIS_ERROR', 'Invalid field structure');
    }
  });

  // Validate numeric fields
  const numericFields = fields.filter(f => f.type === 'number');
  if (numericFields.length === 0) {
    throw createError('ANALYSIS_ERROR', 'Simulation requires numeric fields');
  }

  // Validate data points
  const minDataPoints = 10;
  const insufficientFields = numericFields.filter(f => f.value.length < minDataPoints);
  if (insufficientFields.length > 0) {
    throw createError(
      'ANALYSIS_ERROR',
      `Insufficient data points for simulation. The following fields need at least ${minDataPoints} points: ${
        insufficientFields.map(f => f.name).join(', ')
      }`
    );
  }

  let engine: AISimulationEngineWithCleanup | null = null;
  try {
    // Create and run AI simulation engine
    engine = new AISimulationEngine(fields) as AISimulationEngineWithCleanup;
    const results = await engine.runSimulation();
    
    // Validate simulation results
    if (!results || !Array.isArray(results)) {
      throw createError('ANALYSIS_ERROR', 'Simulation returned invalid results');
    }

    // Validate each result matches the SimulationResult type
    results.forEach(result => {
      if (!result.field || 
          !Array.isArray(result.predictions) || 
          !result.confidence || 
          !result.metrics || 
          !Array.isArray(result.insights)) {
        throw createError('ANALYSIS_ERROR', 'Invalid simulation result structure');
      }
    });
    
    return results;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Simulation error:', error.message);
      throw createError('ANALYSIS_ERROR', `Simulation failed: ${error.message}`);
    }
    throw createError('ANALYSIS_ERROR', 'Unknown simulation error occurred');
  } finally {
    if (engine?.cleanup) {
      try {
        await engine.cleanup();
      } catch (cleanupError) {
        console.error('Error during engine cleanup:', cleanupError);
      }
    }
  }
}
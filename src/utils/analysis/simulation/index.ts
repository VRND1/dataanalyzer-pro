import { DataField } from '@/types/data';
import { SimulationEngine } from './engine';
import { createError } from '@/utils/core/error';
import type { SimulationResult } from './types';
import { ErrorCode } from '@/types/error';

export async function runSimulation({ fields }: { fields: DataField[] }): Promise<SimulationResult[]> {
  try {
    const engine = new SimulationEngine(fields);
    return engine.runSimulation();
  } 
  catch (error) {
    console.error('Simulation error:', error);
    throw error instanceof Error ? error : createError(ErrorCode.SIMULATION_ERROR as any, 'Failed to run simulation');
  }
}
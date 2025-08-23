import { DataField } from '@/types/data';
import { calculateFieldStats } from '../statistics/calculations';
import { determineTrend } from '../statistics/trends';
import { createError } from '@/utils/core/error';
import { ErrorCode } from '@/types/error';
import { SimulationResult, SensitivityAnalysis } from './types';

export class SimulationEngine {
  private fields: DataField[];
  private readonly SENSITIVITY_VARIATIONS = [10, 20, 30];
  private readonly MIN_DATA_POINTS = 10;

  constructor(fields: DataField[]) {
    this.fields = fields;
    this.validateFields();
  }

  private validateFields() {
    if (!this.fields?.length) {
      throw createError(ErrorCode.SIMULATION_ERROR as any, 'No data available for simulation');
    }

    const numericFields = this.fields.filter(f => f.type === 'number');
    if (numericFields.length === 0) {
      throw createError(ErrorCode.SIMULATION_ERROR as any, 'Simulation requires numeric fields');
    }

    // Check for minimum data points
    const insufficientFields = numericFields.filter(f => f.value.length < this.MIN_DATA_POINTS);
    if (insufficientFields.length > 0) {
      throw createError(
        ErrorCode.SIMULATION_ERROR as any,
        `Insufficient data points for simulation. The following fields need at least ${this.MIN_DATA_POINTS} points: ${
          insufficientFields.map(f => f.name).join(', ')
        }`
      );
    }

    // Validate numeric values
    for (const field of numericFields) {
      const values = field.value as number[];
      if (values.some(v => !isFinite(v))) {
        throw createError(ErrorCode.SIMULATION_ERROR as any, `Field "${field.name}" contains invalid numeric values`);
      }
    }
  }

  async runSimulation(): Promise<SimulationResult[]> {
    try {
      const numericFields = this.fields.filter(f => f.type === 'number');
      
      return await Promise.all(numericFields.map(async field => {
        const scenarios = await this.generateScenarios(field);
        const sensitivity = this.performSensitivityAnalysis(field);
        const summary = this.generateSummary(field);

        return {
          field: field.name,
          scenarios,
          sensitivity,
          summary
        };
      }));
    } catch (error) {
      console.error('Simulation error:', error);
      throw createError(
        ErrorCode.SIMULATION_ERROR as any,
        error instanceof Error ? error.message : 'Failed to run simulation'
      );
    }
  }

  private async generateScenarios(field: DataField) {
    const values = field.value as number[];
    const trend = determineTrend(values);
    
    // Calculate trend factor
    const trendFactor = trend === 'up' ? 1.1 : trend === 'down' ? 0.9 : 1.0;
    
    // Generate scenarios
    return [
      {
        name: 'Best Case',
        description: 'Optimistic scenario with favorable conditions',
        adjustments: { [field.name]: 15 },
        probability: 0.25,
        results: await this.simulateScenario(values, trendFactor * 1.15)
      },
      {
        name: 'Base Case',
        description: 'Most likely scenario based on current trends',
        adjustments: { [field.name]: 0 },
        probability: 0.5,
        results: await this.simulateScenario(values, trendFactor)
      },
      {
        name: 'Worst Case',
        description: 'Conservative scenario with adverse conditions',
        adjustments: { [field.name]: -15 },
        probability: 0.25,
        results: await this.simulateScenario(values, trendFactor * 0.85)
      }
    ];
  }

  private async simulateScenario(values: number[], factor: number) {
    try {
      // Initialize TypedArrays for better performance
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error('Invalid input data for simulation');
      }

      const valuesArray = new Float64Array(values.filter(v => isFinite(v)));
      if (valuesArray.length === 0) {
        throw new Error('No valid numeric values for simulation');
      }

      const result = new Float64Array(5); // 5 future points
      
      const volatility = this.calculateVolatility(valuesArray);
      const lastValue = valuesArray[valuesArray.length - 1];
      const trend = this.calculateTrend(valuesArray);
      
      for (let i = 0; i < result.length; i++) {
        // Monte Carlo simulation with error handling
        try {
          const randomWalk = volatility * Math.sqrt(1/12) * (Math.random() * 2 - 1);
          const trendFactor = 1 + (trend * factor);
          result[i] = lastValue * Math.max(0, trendFactor * (1 + randomWalk));
        } catch (error) {
          console.error('Error in simulation step:', error);
          result[i] = lastValue; // Fallback to last known value
        }
      }
      
      return { values: Array.from(result) };
    } catch (error) {
      throw createError(ErrorCode.SIMULATION_ERROR as any, 'Failed to simulate scenario');
    }
  }

  private calculateVolatility(values: Float64Array): number {
    if (values.length < 2) return 0;
    
    try {
      const returns = new Float64Array(values.length - 1);
      for (let i = 1; i < values.length; i++) {
        if (values[i] <= 0 || values[i-1] <= 0) {
          throw new Error('Invalid values for log calculation');
        }
        returns[i-1] = Math.log(values[i] / values[i-1]);
      }
      
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / returns.length;
      
      return Math.sqrt(variance);
    } catch (error) {
      console.warn('Volatility calculation warning:', error);
      return 0.15; // Default volatility if calculation fails
    }
  }

  private calculateTrend(values: Float64Array): number {
    const n = values.length;
    if (n < 2) return 0;

    try {
      const returns = new Float64Array(n - 1);
      for (let i = 1; i < n; i++) {
        if (values[i] <= 0 || values[i-1] <= 0) {
          throw new Error('Invalid values for trend calculation');
        }
        returns[i-1] = Math.log(values[i] / values[i-1]);
      }
      return returns.reduce((a, b) => a + b, 0) / (n - 1);
    } catch (error) {
      console.warn('Trend calculation warning:', error);
      return 0; // Default to no trend if calculation fails
    }
  }

  private performSensitivityAnalysis(field: DataField): SensitivityAnalysis[] {
    const values = field.value as number[];
    const baseValue = values[values.length - 1];
    
    return [{
      variable: field.name,
      variations: this.SENSITIVITY_VARIATIONS.map(percentage => {
        const impact = this.calculateImpact(baseValue, percentage);
        return {
          percentage,
          impact,
          direction: (percentage > 0 ? 'positive' : 'negative') as 'positive' | 'negative'
        };
      }),
      elasticity: this.calculateElasticity(values)
    }];
  }

  private calculateImpact(baseValue: number, percentage: number): number {
    try {
      const change = baseValue * (percentage / 100);
      return Math.abs((baseValue + change - baseValue) / baseValue);
    } catch (error) {
      console.warn('Impact calculation warning:', error);
      return 0;
    }
  }

  private calculateElasticity(values: number[]): number {
    try {
      if (values.length < 2) return 0;
      const percentageChange = ((values[values.length - 1] - values[0]) / values[0]) * 100;
      const timeChange = values.length - 1;
      return Math.abs(percentageChange / timeChange);
    } catch (error) {
      console.warn('Elasticity calculation warning:', error);
      return 0;
    }
  }

  private generateSummary(field: DataField) {
    try {
      const values = field.value as number[];
      const stats = calculateFieldStats(field);
      const lastValue = values[values.length - 1];
      
      const bestCase = lastValue * 1.15;
      const baseCase = lastValue;
      const worstCase = lastValue * 0.85;
      
      return {
        bestCase,
        baseCase,
        worstCase,
        range: bestCase - worstCase,
        confidence: Math.max(0, Math.min(1, 1 - (stats.standardDeviation / stats.mean)))
      };
    } catch (error) {
      console.error('Summary generation error:', error);
      throw createError(ErrorCode.SIMULATION_ERROR as any, 'Failed to generate simulation summary');
    }
  }
}
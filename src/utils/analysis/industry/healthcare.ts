import { DataField } from '@/types/data';

interface PatientOutcomeMetrics {
  successRate: number;
  readmissionRate: number;
  avgRecoveryTime: number;
  riskFactors: string[];
}

export interface PatientMetrics {
  avgLengthOfStay: number;
  readmissionRate: number;
  satisfactionScore: number;
  lengthOfStayTrend: number;
  readmissionTrend: number;
  satisfactionTrend: number;
  flowData: {
    date: string;
    volume: number;
  }[];
  totalPatients: number;
  averageAge: number;
  readmissionCount: number;
  averageWaitTime: number;
}

export class HealthcareAnalyzer {
  static analyzePatientOutcomes(fields: DataField[]): PatientOutcomeMetrics {
    const outcomes = fields.find(f => f.name.toLowerCase().includes('outcome'))?.value as string[];
    const readmissions = fields.find(f => f.name.toLowerCase().includes('readmission'))?.value as number[];
    const recoveryTimes = fields.find(f => f.name.toLowerCase().includes('recovery'))?.value as number[];

    const successRate = outcomes ? 
      outcomes.filter(o => o.toLowerCase().includes('success')).length / outcomes.length : 0;

    const readmissionRate = readmissions ?
      readmissions.filter(r => r === 1).length / readmissions.length : 0;

    const avgRecoveryTime = recoveryTimes ?
      recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length : 0;

    return {
      successRate,
      readmissionRate,
      avgRecoveryTime,
      riskFactors: this.identifyRiskFactors(fields)
    };
  }

  static analyzeTreatmentEffectiveness(fields: DataField[]) {
    // Find the treatment and outcome fields
    const treatmentField = fields.find(f => f.name.toLowerCase() === 'treatment');
    const outcomeField = fields.find(f => f.name.toLowerCase() === 'outcome');
    
    if (!treatmentField || !outcomeField) {
      throw new Error('Missing required fields for treatment effectiveness analysis');
    }

    const treatments = treatmentField.value as string[];
    const outcomes = outcomeField.value as string[];

    // Group outcomes by treatment
    const treatmentGroups: Record<string, { positive: number; total: number }> = {};

    treatments.forEach((treatment, index) => {
      if (!treatmentGroups[treatment]) {
        treatmentGroups[treatment] = { positive: 0, total: 0 };
      }
      
      treatmentGroups[treatment].total++;
      if (outcomes[index].toLowerCase().includes('success') || 
          outcomes[index].toLowerCase().includes('improved')) {
        treatmentGroups[treatment].positive++;
      }
    });

    // Calculate effectiveness rates
    const effectivenessRates: Record<string, number> = {};
    for (const [treatment, stats] of Object.entries(treatmentGroups)) {
      effectivenessRates[treatment] = stats.positive / stats.total;
    }

    return {
      byTreatment: effectivenessRates,
      overall: Object.values(treatmentGroups).reduce(
        (sum, stats) => sum + stats.positive, 0
      ) / treatments.length
    };
  }

  private static _generateRecommendations(data: { success: number; total: number; effects: Set<string> }): string[] {
    const recommendations: string[] = [];
    const successRate = data.success / data.total;

    if (successRate < 0.7) {
      recommendations.push('Review and update treatment protocols');
      recommendations.push('Consider additional patient monitoring');
    }
    if (data.effects.size > 2) {
      recommendations.push('Evaluate side effect management strategies');
    }
    if (recommendations.length === 0) {
      recommendations.push('Maintain current treatment protocols');
    }

    return recommendations;
  }

  static generateRecommendations(fields: DataField[]): string[] {
    const treatmentField = fields.find(f => f.name.toLowerCase() === 'treatment');
    const outcomeField = fields.find(f => f.name.toLowerCase() === 'outcome');
    
    if (!treatmentField || !outcomeField) {
      throw new Error('Missing required fields for recommendations');
    }

    const treatments = treatmentField.value as string[];
    const outcomes = outcomeField.value as string[];
    
    const successCount = outcomes.filter(o => 
      o.toLowerCase().includes('success') || 
      o.toLowerCase().includes('improved')
    ).length;

    const effects = new Set<string>();
    fields.forEach(field => {
      if (field.name.toLowerCase().includes('effect') || 
          field.name.toLowerCase().includes('side_effect')) {
        (field.value as string[]).forEach(effect => effects.add(effect));
      }
    });

    return this._generateRecommendations({
      success: successCount,
      total: treatments.length,
      effects
    });
  }

  private static identifyRiskFactors(fields: DataField[]): string[] {
    const riskFactors: string[] = [];
    const outcomes = fields.find(f => f.name.toLowerCase().includes('outcome'))?.value as string[];
    
    fields.forEach(field => {
      if (field.type === 'number' && outcomes) {
        const values = field.value as number[];
        const correlation = this.calculateRiskCorrelation(values, outcomes);
        if (Math.abs(correlation) > 0.3) {
          riskFactors.push(
            `${field.name} (${correlation > 0 ? 'Positive' : 'Negative'} correlation: ${Math.abs(correlation).toFixed(2)})`
          );
        }
      }
    });

    return riskFactors;
  }

  private static calculateRiskCorrelation(values: number[], outcomes: string[]): number {
    const successValues = outcomes.map(o => o.toLowerCase().includes('success') ? 1 : 0);
    const meanX = values.reduce((a, b) => a + b, 0) / values.length;
    const meanY = successValues.reduce((a: number, b) => a + b, 0) / successValues.length;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < values.length; i++) {
      const diffX = values[i] - meanX;
      const diffY = successValues[i] - meanY;
      numerator += diffX * diffY;
      denomX += diffX * diffX;
      denomY += diffY * diffY;
    }
    
    return numerator / Math.sqrt(denomX * denomY);
  }

  static analyzePatientMetrics(fields: DataField[], timeRange?: string): PatientMetrics {
    const lengthOfStay = fields.find(f => f.name.toLowerCase().includes('length_of_stay'))?.value as number[] || [];
    const readmissions = fields.find(f => f.name.toLowerCase().includes('readmission'))?.value as number[] || [];
    const satisfaction = fields.find(f => f.name.toLowerCase().includes('satisfaction'))?.value as number[] || [];
    const dates = fields.find(f => f.name.toLowerCase().includes('date'))?.value as string[] || [];

    const filterByTimeRange = (values: any[]) => {
      if (!timeRange || !dates.length) return values;
      const [start, end] = timeRange.split(' to ').map(d => new Date(d));
      return values.filter((_, i) => {
        const date = new Date(dates[i]);
        return date >= start && date <= end;
      });
    };

    const filteredLengthOfStay = filterByTimeRange(lengthOfStay);
    const filteredReadmissions = filterByTimeRange(readmissions);
    const filteredSatisfaction = filterByTimeRange(satisfaction);
    const filteredDates = filterByTimeRange(dates);

    const avgLengthOfStay = filteredLengthOfStay.length > 0 ? 
      filteredLengthOfStay.reduce((a, b) => a + b, 0) / filteredLengthOfStay.length : 0;

    const readmissionRate = filteredReadmissions.length > 0 ? 
      filteredReadmissions.filter(r => r === 1).length / filteredReadmissions.length : 0;

    const satisfactionScore = filteredSatisfaction.length > 0 ? 
      filteredSatisfaction.reduce((a, b) => a + b, 0) / filteredSatisfaction.length : 0;

    const calculateTrend = (values: number[]) => {
      if (values.length < 2) return 0;
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      return (secondAvg - firstAvg) / firstAvg;
    };

    const flowData = filteredDates.map((date, i) => ({
      date,
      volume: filteredLengthOfStay[i] || 0
    }));

    return {
      avgLengthOfStay,
      readmissionRate,
      satisfactionScore,
      lengthOfStayTrend: calculateTrend(filteredLengthOfStay),
      readmissionTrend: calculateTrend(filteredReadmissions),
      satisfactionTrend: calculateTrend(filteredSatisfaction),
      flowData,
      totalPatients: filteredLengthOfStay.length,
      averageAge: 0, // Assuming default age
      readmissionCount: filteredReadmissions.filter(r => r === 1).length,
      averageWaitTime: 0 // Assuming default wait time
    };
  }

  static analyzeTrends(fields: DataField[]) {
    const dateField = fields.find(f => f.type === 'date');
    const numericFields = fields.filter(f => f.type === 'number');
    
    if (!dateField || numericFields.length === 0) {
      throw new Error('Missing required fields for trend analysis');
    }

    const trends: Record<string, { trend: number; seasonality: boolean }> = {};

    numericFields.forEach(field => {
      const values = field.value as number[];
      const trend = this.calculateTrend(values);
      const seasonality = this.detectSeasonality(values);
      trends[field.name] = { trend, seasonality };
    });

    return trends;
  }

  static buildPredictiveModels(fields: DataField[]) {
    const numericFields = fields.filter(f => f.type === 'number');
    const outcomeField = fields.find(f => f.name.toLowerCase().includes('outcome'));
    
    if (numericFields.length === 0 || !outcomeField) {
      throw new Error('Missing required fields for predictive modeling');
    }

    const models: Record<string, { accuracy: number; factors: string[] }> = {};
    
    numericFields.forEach(field => {
      const values = field.value as number[];
      const outcomes = outcomeField.value as string[];
      const correlation = this.calculateRiskCorrelation(values, outcomes);
      
      if (Math.abs(correlation) > 0.3) {
        models[field.name] = {
          accuracy: Math.abs(correlation),
          factors: this.identifyRiskFactors([field, outcomeField])
        };
      }
    });

    return models;
  }

  private static calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    return (secondAvg - firstAvg) / firstAvg;
  }

  private static detectSeasonality(values: number[]): boolean {
    if (values.length < 12) return false;
    
    // Simple seasonality detection using autocorrelation
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const normalized = values.map(v => v - mean);
    
    let maxCorrelation = 0;
    for (let lag = 1; lag <= Math.min(12, Math.floor(values.length / 2)); lag++) {
      let correlation = 0;
      for (let i = 0; i < values.length - lag; i++) {
        correlation += normalized[i] * normalized[i + lag];
      }
      correlation /= (values.length - lag);
      maxCorrelation = Math.max(maxCorrelation, Math.abs(correlation));
    }
    
    return maxCorrelation > 0.5; // Threshold for seasonality
  }
}
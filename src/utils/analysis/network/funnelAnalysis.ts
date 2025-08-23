import { DataField } from '@/types/data';

export interface FunnelStage {
  name: string;
  value: number;
  conversionRate: number;
  dropoffRate: number;
  color: string;
  insights: string[];
  metrics: {
    totalUsers: number;
    convertedUsers: number;
    lostUsers: number;
    averageTime: number;
  };
}

export interface FunnelMetrics {
  totalStages: number;
  overallConversionRate: number;
  totalDropoff: number;
  bestPerformingStage: string;
  worstPerformingStage: string;
  recommendations: string[];
  performanceScore: number;
  optimizationOpportunities: string[];
}

export interface FunnelAnalysisResult {
  stages: FunnelStage[];
  metrics: FunnelMetrics;
  trends: {
    conversionTrend: 'improving' | 'declining' | 'stable';
    dropoffTrend: 'improving' | 'declining' | 'stable';
    trendStrength: number;
  };
  insights: string[];
}

/**
 * Analyzes numeric fields to create a funnel analysis
 * @param fields Array of data fields
 * @returns Funnel analysis result or null if insufficient data
 */
export function analyzeFunnel(fields: DataField[]): FunnelAnalysisResult | null {
  if (!fields || fields.length < 2) {
    return null;
  }

  const numericFields = fields.filter(field => field.type === 'number');
  if (numericFields.length < 2) {
    return null;
  }

  // Sort fields by their average values to create a funnel effect
  const sortedFields = numericFields
    .map(field => {
      const values = field.value as number[];
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const totalUsers = values.length;
      const convertedUsers = values.filter(v => v > 0).length;
      const lostUsers = totalUsers - convertedUsers;
      const averageTime = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      
      return { 
        ...field, 
        average: avg,
        totalUsers,
        convertedUsers,
        lostUsers,
        averageTime
      };
    })
    .sort((a, b) => b.average - a.average);

  // Create funnel stages
  const stages: FunnelStage[] = sortedFields.map((field, index) => {
    const currentValue = field.average;
    const previousValue = index > 0 ? sortedFields[index - 1].average : currentValue;
    const conversionRate = previousValue > 0 ? (currentValue / previousValue) * 100 : 100;
    const dropoffRate = 100 - conversionRate;

    // Generate insights based on conversion rate
    const insights: string[] = [];
    if (conversionRate < 50) {
      insights.push('Significant dropoff detected - consider optimizing this stage');
      insights.push('Review user experience and remove friction points');
    } else if (conversionRate < 80) {
      insights.push('Moderate dropoff - review user experience');
      insights.push('Consider A/B testing to improve conversion');
    } else {
      insights.push('Good conversion rate - maintain current approach');
    }

    if (dropoffRate > 30) {
      insights.push('High dropoff rate - investigate user friction points');
    }

    if (field.averageTime > 100) {
      insights.push('Long processing time detected - optimize performance');
    }

    return {
      name: field.name,
      value: currentValue,
      conversionRate,
      dropoffRate,
      color: `hsl(${240 - index * 30}, 70%, 50%)`,
      insights,
      metrics: {
        totalUsers: field.totalUsers,
        convertedUsers: field.convertedUsers,
        lostUsers: field.lostUsers,
        averageTime: field.averageTime
      }
    };
  });

  // Calculate overall metrics
  const totalStages = stages.length;
  const overallConversionRate = stages.length > 1 
    ? (stages[stages.length - 1].value / stages[0].value) * 100 
    : 100;
  const totalDropoff = 100 - overallConversionRate;

  const bestPerformingStage = stages.reduce((best, current) => 
    current.conversionRate > best.conversionRate ? current : best
  ).name;

  const worstPerformingStage = stages.reduce((worst, current) => 
    current.conversionRate < worst.conversionRate ? current : worst
  ).name;

  // Calculate performance score (0-100)
  const performanceScore = Math.max(0, Math.min(100, 
    (overallConversionRate * 0.6) + 
    ((100 - totalDropoff) * 0.4)
  ));

  // Generate recommendations
  const recommendations: string[] = [];
  if (overallConversionRate < 20) {
    recommendations.push('Overall conversion rate is very low - consider major UX improvements');
  }
  if (totalDropoff > 80) {
    recommendations.push('High total dropoff - focus on reducing friction across all stages');
  }
  if (stages.some(stage => stage.dropoffRate > 50)) {
    recommendations.push('Critical dropoff points detected - prioritize optimization of problematic stages');
  }
  if (performanceScore < 50) {
    recommendations.push('Low performance score - implement comprehensive funnel optimization strategy');
  }

  // Identify optimization opportunities
  const optimizationOpportunities: string[] = [];
  stages.forEach((stage) => {
    if (stage.conversionRate < 60) {
      optimizationOpportunities.push(`Optimize ${stage.name} stage (${stage.conversionRate.toFixed(1)}% conversion)`);
    }
    if (stage.dropoffRate > 40) {
      optimizationOpportunities.push(`Reduce dropoff in ${stage.name} stage (${stage.dropoffRate.toFixed(1)}% dropoff)`);
    }
  });

  // Calculate trends (simplified - in real implementation, you'd compare with historical data)
  const conversionTrend = overallConversionRate > 70 ? 'improving' : 
                         overallConversionRate < 30 ? 'declining' : 'stable';
  const dropoffTrend = totalDropoff < 30 ? 'improving' : 
                      totalDropoff > 70 ? 'declining' : 'stable';
  const trendStrength = Math.abs(overallConversionRate - 50) / 50; // 0-1 scale

  const metrics: FunnelMetrics = {
    totalStages,
    overallConversionRate,
    totalDropoff,
    bestPerformingStage,
    worstPerformingStage,
    recommendations,
    performanceScore,
    optimizationOpportunities
  };

  // Generate overall insights
  const insights: string[] = [];
  if (overallConversionRate > 80) {
    insights.push('Excellent overall conversion rate - maintain current strategy');
  } else if (overallConversionRate > 60) {
    insights.push('Good conversion rate with room for improvement');
  } else {
    insights.push('Conversion rate needs significant improvement');
  }

  if (stages.length >= 5) {
    insights.push('Complex funnel detected - consider simplifying user journey');
  }

  const criticalStages = stages.filter(stage => stage.dropoffRate > 50);
  if (criticalStages.length > 0) {
    insights.push(`${criticalStages.length} critical stages identified for immediate attention`);
  }

  return {
    stages,
    metrics,
    trends: {
      conversionTrend,
      dropoffTrend,
      trendStrength
    },
    insights
  };
}

/**
 * Calculates funnel efficiency score
 * @param stages Array of funnel stages
 * @returns Efficiency score (0-100)
 */
export function calculateFunnelEfficiency(stages: FunnelStage[]): number {
  if (stages.length === 0) return 0;

  const conversionRates = stages.map(stage => stage.conversionRate);
  const avgConversionRate = conversionRates.reduce((sum, rate) => sum + rate, 0) / conversionRates.length;
  
  // Penalize for high dropoff rates
  const dropoffPenalty = stages.reduce((penalty, stage) => {
    if (stage.dropoffRate > 50) penalty += 20;
    else if (stage.dropoffRate > 30) penalty += 10;
    return penalty;
  }, 0);

  return Math.max(0, Math.min(100, avgConversionRate - dropoffPenalty));
}

/**
 * Identifies bottlenecks in the funnel
 * @param stages Array of funnel stages
 * @returns Array of bottleneck stages
 */
export function identifyBottlenecks(stages: FunnelStage[]): FunnelStage[] {
  return stages.filter(stage => 
    stage.conversionRate < 60 || stage.dropoffRate > 40
  );
}

/**
 * Suggests optimizations for funnel stages
 * @param stage Funnel stage to optimize
 * @returns Array of optimization suggestions
 */
export function suggestOptimizations(stage: FunnelStage): string[] {
  const suggestions: string[] = [];

  if (stage.conversionRate < 50) {
    suggestions.push('Implement A/B testing to identify optimal user experience');
    suggestions.push('Simplify the user journey for this stage');
    suggestions.push('Add clear call-to-action buttons');
  }

  if (stage.dropoffRate > 30) {
    suggestions.push('Investigate and fix technical issues');
    suggestions.push('Improve page load times');
    suggestions.push('Add progress indicators');
  }

  if (stage.metrics.averageTime > 100) {
    suggestions.push('Optimize performance and reduce processing time');
    suggestions.push('Implement loading states and feedback');
  }

  return suggestions;
} 
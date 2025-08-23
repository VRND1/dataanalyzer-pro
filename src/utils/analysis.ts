import type { MarketData } from '@/types/market';
import type { AnalyzedData as Analysis } from '@/types/analysis';
import type { DataField } from '@/types/analysis';

export function analyzeDataset(data: MarketData): Analysis {
  const insights = generateInsights(data);
  // Remove unused variables
  const recommendations = generateRecommendations(data);
  // const { pros, cons } = evaluatePerformance(data);
  // const score = calculateScore(data);

  // Create a fields array from the MarketData
  const fields: DataField[] = [
    { name: 'revenue', type: 'number', value: [data.revenue] },
    { name: 'customers', type: 'number', value: [data.customers] },
    { name: 'satisfaction', type: 'number', value: [data.satisfaction] },
    { name: 'marketShare', type: 'number', value: [data.marketShare] },
    { name: 'growthRate', type: 'number', value: [data.growthRate] }
  ];

  // Calculate statistics
  const statistics = {
    mean: {
      revenue: data.revenue,
      customers: data.customers,
      satisfaction: data.satisfaction,
      marketShare: data.marketShare,
      growthRate: data.growthRate
    },
    median: {
      revenue: data.revenue,
      customers: data.customers,
      satisfaction: data.satisfaction,
      marketShare: data.marketShare,
      growthRate: data.growthRate
    },
    standardDeviation: {
      revenue: 0,
      customers: 0,
      satisfaction: 0,
      marketShare: 0,
      growthRate: 0
    },
    correlations: {}
  };

  return {
    fields,
    statistics,
    insights,
    hasNumericData: true,
    hasTextData: false,
    dataQuality: {
      completeness: 1,
      validity: 1
    },
    originalData: data,
    trends: [],
    correlations: [],
    recommendations,
    pros: [],
    cons: [],
    analysis: {
      trends: []
    }
  };
}

function generateInsights(data: MarketData): string[] {
  const insights = [];
  
  if (data.growthRate > 10) {
    insights.push("Exceptional growth rate indicates strong market position");
  } else if (data.growthRate < 0) {
    insights.push("Negative growth rate requires immediate attention");
  }

  if (data.satisfaction > 80) {
    insights.push("High customer satisfaction suggests strong product-market fit");
  } else if (data.satisfaction < 60) {
    insights.push("Low satisfaction scores indicate need for product improvements");
  }
  if (data.marketShare > 20) {
    insights.push("Significant market share demonstrates competitive advantage");
  }

  return insights;
}

function generateRecommendations(data: MarketData): string[] {
  const recommendations = [];

  if (data.satisfaction < 70) {
    recommendations.push("Implement customer feedback program");
    recommendations.push("Enhance customer support services");
  }

  if (data.growthRate < 5) {
    recommendations.push("Explore new market segments");
    recommendations.push("Invest in marketing campaigns");
  }

  if (data.marketShare < 15) {
    recommendations.push("Develop competitive pricing strategy");
    recommendations.push("Focus on product differentiation");
  }

  return recommendations;
}

export function calculateScore(data: MarketData): number {
  const weights = {
    revenue: 0.25,
    customers: 0.2,
    satisfaction: 0.2,
    marketShare: 0.2,
    growthRate: 0.15,
  };

  const normalizedData = {
    revenue: Math.min(data.revenue / 1000000, 1),
    customers: Math.min(data.customers / 1000, 1),
    satisfaction: data.satisfaction / 100,
    marketShare: data.marketShare / 100,
    growthRate: (data.growthRate + 100) / 200,
  };

  return Object.entries(weights).reduce((score, [key, weight]) => {
    return score + normalizedData[key as keyof typeof normalizedData] * weight;
  }, 0) * 100;
}
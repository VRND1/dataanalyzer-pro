import { SWOTAnalysis, SWOTItem } from './types';
import { DataField } from '@/types/data';

export function generateSWOTAnalysis(data: { fields: DataField[] }): SWOTAnalysis {
  const { fields } = data;
  
  // Analyze data to identify patterns and generate SWOT insights
  const numericFields = fields.filter(f => f.type === 'number');
  const textFields = fields.filter(f => f.type === 'string');
  const dateFields = fields.filter(f => f.type === 'date');
  
  // Calculate data quality metrics
  const hasTimeSeries = dateFields.length > 0;
  const hasQuantitative = numericFields.length > 0;
  
  // Generate strengths based on positive metrics
  const strengths: SWOTItem[] = [];
  
  if (numericFields.length > 0) {
    strengths.push({
      description: `Strong quantitative foundation with ${numericFields.length} numeric metrics for statistical analysis`,
      impact: 'high',
      priority: 9,
      category: 'Data Structure',
      confidence: 0.9
    });
  }
  
  if (textFields.length > 0) {
    strengths.push({
      description: `Rich qualitative insights with ${textFields.length} text fields for contextual analysis`,
      impact: 'medium',
      priority: 7,
      category: 'Data Quality',
      confidence: 0.8
    });
  }
  
  if (fields.length >= 10) {
    strengths.push({
      description: 'Comprehensive dataset with diverse metrics enabling thorough multi-dimensional analysis',
      impact: 'high',
      priority: 8,
      category: 'Data Completeness',
      confidence: 0.85
    });
  }
  
  if (hasTimeSeries) {
    strengths.push({
      description: 'Temporal data available for trend analysis and forecasting capabilities',
      impact: 'high',
      priority: 9,
      category: 'Analytics Capability',
      confidence: 0.9
    });
  }
  
  // Generate weaknesses based on data limitations
  const weaknesses: SWOTItem[] = [];
  
  if (numericFields.length < 3) {
    weaknesses.push({
      description: 'Limited quantitative metrics may restrict advanced statistical analysis and modeling',
      impact: 'medium',
      priority: 7,
      category: 'Analytics Limitation',
      confidence: 0.8
    });
  }
  
  if (fields.length < 5) {
    weaknesses.push({
      description: 'Small dataset may not provide sufficient statistical power for reliable insights',
      impact: 'high',
      priority: 8,
      category: 'Data Volume',
      confidence: 0.85
    });
  }
  
  if (!hasTimeSeries && hasQuantitative) {
    weaknesses.push({
      description: 'Lack of temporal data limits trend analysis and predictive modeling capabilities',
      impact: 'medium',
      priority: 6,
      category: 'Analytics Limitation',
      confidence: 0.7
    });
  }
  
  // Generate opportunities based on data potential
  const opportunities: SWOTItem[] = [];
  
  if (numericFields.length > 0) {
    opportunities.push({
      description: 'Potential for advanced statistical analysis, correlation studies, and predictive modeling',
      impact: 'high',
      priority: 9,
      category: 'Analytics Opportunity',
      confidence: 0.9
    });
  }
  
  if (textFields.length > 0) {
    opportunities.push({
      description: 'Text analysis capabilities for sentiment analysis, pattern recognition, and NLP insights',
      impact: 'medium',
      priority: 7,
      category: 'AI/ML Opportunity',
      confidence: 0.8
    });
  }
  
  if (hasTimeSeries) {
    opportunities.push({
      description: 'Time series analysis potential for forecasting, seasonality detection, and trend prediction',
      impact: 'high',
      priority: 9,
      category: 'Predictive Analytics',
      confidence: 0.9
    });
  }
  
  opportunities.push({
    description: 'Data can be enriched with external sources for enhanced contextual insights',
    impact: 'medium',
    priority: 6,
    category: 'Data Enhancement',
    confidence: 0.7
  });
  
  // Generate threats based on data risks
  const threats: SWOTItem[] = [];
  
  if (fields.length === 0) {
    threats.push({
      description: 'No data available for analysis - critical limitation for decision making',
      impact: 'high',
      priority: 10,
      category: 'Data Availability',
      confidence: 1.0
    });
  } else {
    threats.push({
      description: 'Data quality issues may affect analysis accuracy and lead to incorrect insights',
      impact: 'medium',
      priority: 7,
      category: 'Data Quality',
      confidence: 0.8
    });
    
    if (!hasTimeSeries) {
      threats.push({
        description: 'Limited historical data may impact trend analysis reliability and forecasting accuracy',
        impact: 'medium',
        priority: 6,
        category: 'Analytics Risk',
        confidence: 0.7
      });
    }
    
    if (numericFields.length === 0) {
      threats.push({
        description: 'Lack of quantitative data limits statistical analysis and objective measurement',
        impact: 'high',
        priority: 8,
        category: 'Analytics Limitation',
        confidence: 0.85
      });
    }
  }
  
  // Calculate enhanced scores based on data characteristics
  const internalScore = calculateInternalScore(strengths, weaknesses);
  const externalScore = calculateExternalScore(opportunities, threats);
  const overallScore = (internalScore + externalScore) / 2;
  const confidence = calculateConfidence(fields, strengths, weaknesses, opportunities, threats);
  
  // Generate metadata
  const allItems = [...strengths, ...weaknesses, ...opportunities, ...threats];
  const metadata = {
    totalItems: allItems.length,
    highImpactCount: allItems.filter(item => item.impact === 'high').length,
    mediumImpactCount: allItems.filter(item => item.impact === 'medium').length,
    lowImpactCount: allItems.filter(item => item.impact === 'low').length,
    analysisDate: new Date().toISOString(),
    dataSource: 'Dynamic Analysis'
  };
  
  return {
    strengths,
    weaknesses,
    opportunities,
    threats,
    score: {
      internal: Math.max(0, Math.min(1, internalScore)),
      external: Math.max(0, Math.min(1, externalScore)),
      overall: Math.max(0, Math.min(1, overallScore)),
      confidence: Math.max(0, Math.min(1, confidence))
    },
    metadata
  };
}

function calculateInternalScore(strengths: SWOTItem[], weaknesses: SWOTItem[]): number {
  const strengthScore = strengths.reduce((sum, item) => {
    const impactWeight = item.impact === 'high' ? 1 : item.impact === 'medium' ? 0.6 : 0.3;
    const priorityWeight = (item.priority || 5) / 10;
    return sum + (impactWeight * priorityWeight);
  }, 0);
  
  const weaknessScore = weaknesses.reduce((sum, item) => {
    const impactWeight = item.impact === 'high' ? 1 : item.impact === 'medium' ? 0.6 : 0.3;
    const priorityWeight = (item.priority || 5) / 10;
    return sum + (impactWeight * priorityWeight);
  }, 0);
  
  const netScore = strengthScore - weaknessScore;
  return Math.min(1, (netScore + 3) / 6);
}

function calculateExternalScore(opportunities: SWOTItem[], threats: SWOTItem[]): number {
  const opportunityScore = opportunities.reduce((sum, item) => {
    const impactWeight = item.impact === 'high' ? 1 : item.impact === 'medium' ? 0.6 : 0.3;
    const priorityWeight = (item.priority || 5) / 10;
    return sum + (impactWeight * priorityWeight);
  }, 0);
  
  const threatScore = threats.reduce((sum, item) => {
    const impactWeight = item.impact === 'high' ? 1 : item.impact === 'medium' ? 0.6 : 0.3;
    const priorityWeight = (item.priority || 5) / 10;
    return sum + (impactWeight * priorityWeight);
  }, 0);
  
  const netScore = opportunityScore - threatScore;
  return Math.min(1, (netScore + 3) / 6);
}

function calculateConfidence(fields: DataField[], strengths: SWOTItem[], weaknesses: SWOTItem[], opportunities: SWOTItem[], threats: SWOTItem[]): number {
  const totalItems = strengths.length + weaknesses.length + opportunities.length + threats.length;
  const avgConfidence = [...strengths, ...weaknesses, ...opportunities, ...threats]
    .reduce((sum, item) => sum + (item.confidence || 0.7), 0) / totalItems;
  
  const dataQualityFactor = Math.min(1, fields.length / 10);
  const diversityFactor = Math.min(1, (fields.filter(f => f.type === 'number').length + fields.filter(f => f.type === 'string').length) / 5);
  
  return (avgConfidence * 0.6 + dataQualityFactor * 0.2 + diversityFactor * 0.2);
}

export function generateBusinessSWOTAnalysis(metrics: any[], data?: { fields: DataField[] }): SWOTAnalysis {
  // Generate SWOT analysis based on business metrics
  const strengths: SWOTItem[] = [];
  const weaknesses: SWOTItem[] = [];
  const opportunities: SWOTItem[] = [];
  const threats: SWOTItem[] = [];
  
  // Analyze metrics for SWOT insights
  metrics.forEach(metric => {
    const value = typeof metric.value === 'string' ? parseFloat(metric.value) : metric.value;
    const name = metric.name.toLowerCase();
    
    if (name.includes('revenue') || name.includes('profit') || name.includes('growth')) {
      if (value > 10) {
        strengths.push({
          description: `Strong ${metric.name} performance at ${metric.value} indicates healthy business growth`,
          impact: 'high',
          priority: 9,
          category: 'Financial Performance',
          confidence: 0.9
        });
      } else if (value < 5) {
        weaknesses.push({
          description: `Low ${metric.name} at ${metric.value} requires immediate strategic attention`,
          impact: 'high',
          priority: 9,
          category: 'Financial Risk',
          confidence: 0.85
        });
      }
    }
    
    if (name.includes('efficiency') || name.includes('productivity')) {
      if (value > 80) {
        strengths.push({
          description: `High ${metric.name} (${metric.value}) indicates operational excellence and resource optimization`,
          impact: 'medium',
          priority: 7,
          category: 'Operational Excellence',
          confidence: 0.8
        });
      } else if (value < 60) {
        weaknesses.push({
          description: `Low ${metric.name} (${metric.value}) suggests operational inefficiencies requiring process improvement`,
          impact: 'medium',
          priority: 7,
          category: 'Operational Risk',
          confidence: 0.8
        });
      }
    }
    
    if (name.includes('customer') || name.includes('satisfaction')) {
      if (value > 80) {
        strengths.push({
          description: `High ${metric.name} (${metric.value}) indicates strong customer relationships and market position`,
          impact: 'high',
          priority: 8,
          category: 'Customer Success',
          confidence: 0.85
        });
      } else if (value < 60) {
        weaknesses.push({
          description: `Low ${metric.name} (${metric.value}) indicates customer satisfaction issues requiring immediate attention`,
          impact: 'high',
          priority: 8,
          category: 'Customer Risk',
          confidence: 0.85
        });
      }
    }
  });
  
  // Add general business opportunities and threats
  opportunities.push({
    description: 'Market expansion potential based on current performance metrics and market conditions',
    impact: 'high',
    priority: 8,
    category: 'Market Opportunity',
    confidence: 0.7
  });
  
  opportunities.push({
    description: 'Technology adoption and digital transformation can significantly improve operational efficiency',
    impact: 'medium',
    priority: 6,
    category: 'Technology Opportunity',
    confidence: 0.6
  });
  
  opportunities.push({
    description: 'Strategic partnerships and collaborations can accelerate growth and market penetration',
    impact: 'medium',
    priority: 7,
    category: 'Partnership Opportunity',
    confidence: 0.65
  });
  
  threats.push({
    description: 'Intense market competition may impact growth rates and market share',
    impact: 'medium',
    priority: 7,
    category: 'Competitive Risk',
    confidence: 0.7
  });
  
  threats.push({
    description: 'Economic fluctuations and market volatility could significantly affect business performance',
    impact: 'high',
    priority: 8,
    category: 'Economic Risk',
    confidence: 0.75
  });
  
  threats.push({
    description: 'Rapid technological changes may require significant investment to maintain competitive position',
    impact: 'medium',
    priority: 6,
    category: 'Technology Risk',
    confidence: 0.65
  });
  
  // Calculate enhanced scores
  const internalScore = calculateInternalScore(strengths, weaknesses);
  const externalScore = calculateExternalScore(opportunities, threats);
  const overallScore = (internalScore + externalScore) / 2;
  const confidence = calculateConfidence(data?.fields || [], strengths, weaknesses, opportunities, threats);
  
  // Generate metadata
  const allItems = [...strengths, ...weaknesses, ...opportunities, ...threats];
  const metadata = {
    totalItems: allItems.length,
    highImpactCount: allItems.filter(item => item.impact === 'high').length,
    mediumImpactCount: allItems.filter(item => item.impact === 'medium').length,
    lowImpactCount: allItems.filter(item => item.impact === 'low').length,
    analysisDate: new Date().toISOString(),
    dataSource: 'Business Metrics Analysis'
  };
  
  return {
    strengths,
    weaknesses,
    opportunities,
    threats,
    score: {
      internal: Math.max(0, Math.min(1, internalScore)),
      external: Math.max(0, Math.min(1, externalScore)),
      overall: Math.max(0, Math.min(1, overallScore)),
      confidence: Math.max(0, Math.min(1, confidence))
    },
    metadata
  };
} 
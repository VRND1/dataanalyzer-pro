import { Card } from '../../../ui/card';
import type { DataField } from '../../../../types/data';
import { Label } from '../../../ui/label';
import { Input } from '../../../ui/input';
import { Button } from '../../../ui/button';
import { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface BreakEvenProps {
  data: {
    fields: DataField[];
  };
  onClose?: () => void;
}

interface BreakEvenData {
  fixedCosts: number;
  variableCostsPerUnit: number;
  pricePerUnit: number;
  expectedUnits: number;
  salesTaxRate: number;
  discountRate: number;
  inflationRate: number;
  seasonalityFactor: number;
}

interface ScenarioData {
  scenario: string;
  units: number;
  revenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  contributionMargin: number;
  contributionMarginRatio: number;
  breakEvenUnits: number;
  marginOfSafety: number;
}

// Analyze data patterns to understand the business context
const analyzeDataPatterns = (numericFields: DataField[]) => {
  const patterns = {
    hasCostData: false,
    hasPriceData: false,
    hasQuantityData: false,
    hasRevenueData: false,
    hasSalesData: false,
    dataType: 'unknown' as 'retail' | 'manufacturing' | 'service' | 'ecommerce' | 'unknown',
    valueRanges: {} as Record<string, { min: number; max: number; avg: number }>,
    fieldCorrelations: {} as Record<string, string[]>,
    confidenceScores: {} as Record<string, number>,
    dataQuality: {
      completeness: 0,
      consistency: 0,
      accuracy: 0
    }
  };

  // Analyze each field for business patterns with enhanced logic
  numericFields.forEach(field => {
    const fieldName = field.name.toLowerCase();
    const stats = field.stats;
    
    if (!stats) return;

    // Enhanced field detection with confidence scoring
    let confidence = 0;
    
    if (fieldName.includes('cost') || fieldName.includes('expense') || fieldName.includes('fixed') || fieldName.includes('variable')) {
      patterns.hasCostData = true;
      confidence += 0.8;
    }
    if (fieldName.includes('price') || fieldName.includes('amount') || fieldName.includes('value')) {
      patterns.hasPriceData = true;
      confidence += 0.7;
    }
    if (fieldName.includes('quantity') || fieldName.includes('units') || fieldName.includes('volume') || fieldName.includes('count') || fieldName.includes('number')) {
      patterns.hasQuantityData = true;
      confidence += 0.9;
    }
    if (fieldName.includes('revenue') || fieldName.includes('income')) {
      patterns.hasRevenueData = true;
      confidence += 0.9;
    }
    if (fieldName.includes('sales') || fieldName.includes('orders')) {
      patterns.hasSalesData = true;
      confidence += 0.8;
    }

    // Store value ranges for analysis
    patterns.valueRanges[field.name] = {
      min: stats.min || 0,
      max: stats.max || 0,
      avg: stats.mean || 0
    };

    // Calculate confidence based on data quality
    const dataCompleteness = field.value?.filter(v => v !== null && v !== undefined).length / (field.value?.length || 1);
    const dataConsistency = stats.standardDeviation && stats.mean ? Math.min(1, stats.mean / stats.standardDeviation) : 0.5;
    
    patterns.confidenceScores[field.name] = Math.min(1, confidence * dataCompleteness * dataConsistency);
  });

  // Enhanced business type detection
  if (patterns.hasPriceData && patterns.hasQuantityData && patterns.hasRevenueData) {
    patterns.dataType = 'retail';
  } else if (patterns.hasCostData && patterns.hasQuantityData && !patterns.hasRevenueData) {
    patterns.dataType = 'manufacturing';
  } else if (patterns.hasRevenueData && !patterns.hasQuantityData && patterns.hasPriceData) {
    patterns.dataType = 'service';
  } else if (patterns.hasSalesData && patterns.hasPriceData && patterns.hasQuantityData) {
    patterns.dataType = 'ecommerce';
  }

  // Calculate overall data quality metrics
  const confidenceScores = Object.values(patterns.confidenceScores);
  patterns.dataQuality.completeness = confidenceScores.length > 0 ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length : 0;
  patterns.dataQuality.consistency = Math.min(1, patterns.dataQuality.completeness * 0.8);
  patterns.dataQuality.accuracy = Math.min(1, patterns.dataQuality.completeness * patterns.dataQuality.consistency);

  return patterns;
};

// Function to analyze data and extract business parameters
const analyzeDataForBreakEven = (fields: DataField[]): BreakEvenData => {
  // Get all numeric fields with their statistics
  const numericFields = fields.filter(field => field.type === 'number');
  
  if (numericFields.length === 0) {
    // No numeric data - use industry-specific defaults
    return {
      fixedCosts: 50000,
      variableCostsPerUnit: 12,
      pricePerUnit: 25,
      expectedUnits: 5000,
      salesTaxRate: 8.5,
      discountRate: 10,
      inflationRate: 2.5,
      seasonalityFactor: 1.0
    };
  }

  // Analyze data patterns to determine business type
  const dataPatterns = analyzeDataPatterns(numericFields);
  
  // Extract parameters based on detected patterns
  const params = extractParametersFromPatterns(numericFields, dataPatterns);
  
  return params;
};

// Extract business parameters based on detected patterns
const extractParametersFromPatterns = (numericFields: DataField[], patterns: any): BreakEvenData => {
  // Strategy 1: Direct field matching
  const directParams = extractDirectParameters(numericFields);
  if (directParams.isComplete) {
    return directParams.params;
  }

  // Strategy 2: Pattern-based extraction
  const patternParams = extractPatternBasedParameters(numericFields, patterns);
  if (patternParams.isComplete) {
    return patternParams.params;
  }

  // Strategy 3: Statistical inference
  const inferredParams = extractInferredParameters(numericFields, patterns);
  
  return inferredParams;
};

// Extract parameters by directly matching field names
const extractDirectParameters = (numericFields: DataField[]) => {
  let fixedCosts = 0;
  let variableCostsPerUnit = 0;
  let pricePerUnit = 0;
  let expectedUnits = 0;
  let foundCount = 0;
  let totalConfidence = 0;

  numericFields.forEach(field => {
    const fieldName = field.name.toLowerCase();
    const stats = field.stats;
    
    if (!stats?.mean) return;

    // Enhanced field matching with confidence scoring
    let confidence = 0;
    let matched = false;

    if (fieldName.includes('fixed') && fieldName.includes('cost')) {
      fixedCosts = stats.mean;
      confidence = 0.9;
      matched = true;
    } else if (fieldName.includes('variable') && fieldName.includes('cost')) {
      variableCostsPerUnit = stats.mean;
      confidence = 0.9;
      matched = true;
    } else if (fieldName.includes('price') || fieldName.includes('unit_price')) {
      pricePerUnit = stats.mean;
      confidence = 0.8;
      matched = true;
    } else if (fieldName.includes('quantity') || fieldName.includes('units') || fieldName.includes('volume')) {
      expectedUnits = stats.mean;
      confidence = 0.9;
      matched = true;
    }

    if (matched) {
      foundCount++;
      totalConfidence += confidence;
    }
  });

  return {
    isComplete: foundCount >= 3,
    confidence: foundCount > 0 ? totalConfidence / foundCount : 0,
    params: {
      fixedCosts: fixedCosts || 50000,
      variableCostsPerUnit: variableCostsPerUnit || 12,
      pricePerUnit: pricePerUnit || 25,
      expectedUnits: expectedUnits || 5000,
      salesTaxRate: 8.5,
      discountRate: 10,
      inflationRate: 2.5,
      seasonalityFactor: 1.0
    }
  };
};

// Extract parameters based on data patterns and business logic
const extractPatternBasedParameters = (numericFields: DataField[], patterns: any) => {
  let fixedCosts = 0;
  let variableCostsPerUnit = 0;
  let pricePerUnit = 0;
  let expectedUnits = 0;
  let foundCount = 0;

  // Enhanced field selection with better logic
  const sortedFields = numericFields
    .filter(field => field.stats?.mean && field.stats.mean > 0)
    .sort((a, b) => (b.stats?.mean || 0) - (a.stats?.mean || 0));

  if (sortedFields.length === 0) {
    return {
      isComplete: false,
      confidence: 0,
      params: getDefaultParameters()
    };
  }

  // Better parameter extraction logic
  const largestField = sortedFields[0];
  const smallestField = sortedFields[sortedFields.length - 1];
  const medianField = sortedFields[Math.floor(sortedFields.length / 2)];

  // Extract parameters based on business type and field characteristics
  if (patterns.dataType === 'retail' || patterns.dataType === 'ecommerce') {
    if (largestField.stats?.mean && largestField.stats.mean > 1000) {
      // Likely total revenue
      pricePerUnit = largestField.stats.mean / 100; // Assume average order size
      foundCount++;
    }
    if (smallestField.stats?.mean && smallestField.stats.mean < 100) {
      // Likely unit price
      pricePerUnit = smallestField.stats.mean;
      foundCount++;
    }
  } else if (patterns.dataType === 'manufacturing') {
    if (medianField.stats?.mean && medianField.stats.mean < 100) {
      // Likely variable cost per unit
      variableCostsPerUnit = medianField.stats.mean;
      foundCount++;
    }
  } else if (patterns.dataType === 'service') {
    if (largestField.stats?.mean && largestField.stats.mean > 50) {
      // Likely service price
      pricePerUnit = largestField.stats.mean;
      foundCount++;
    }
  }

  // Enhanced fallback logic with better business intelligence
  if (!fixedCosts) {
    fixedCosts = pricePerUnit * expectedUnits * getFixedCostRatio(patterns.dataType);
  }
  if (!variableCostsPerUnit) {
    variableCostsPerUnit = pricePerUnit * getVariableCostRatio(patterns.dataType);
  }
  if (!pricePerUnit) {
    pricePerUnit = getDefaultPrice(patterns.dataType);
  }
  if (!expectedUnits) {
    expectedUnits = getDefaultUnits(patterns.dataType);
  }

  return {
    isComplete: foundCount >= 2,
    confidence: Math.min(1, foundCount / 4),
    params: {
      fixedCosts: Math.round(fixedCosts),
      variableCostsPerUnit: Math.round(variableCostsPerUnit * 100) / 100,
      pricePerUnit: Math.round(pricePerUnit * 100) / 100,
      expectedUnits: Math.round(expectedUnits),
      salesTaxRate: 8.5,
      discountRate: 10,
      inflationRate: 2.5,
      seasonalityFactor: 1.0
    }
  };
};

// Helper functions for better parameter estimation
const getFixedCostRatio = (dataType: string): number => {
  switch (dataType) {
    case 'retail': return 0.25;
    case 'manufacturing': return 0.35;
    case 'service': return 0.45;
    case 'ecommerce': return 0.20;
    default: return 0.30;
  }
};

const getVariableCostRatio = (dataType: string): number => {
  switch (dataType) {
    case 'retail': return 0.65;
    case 'manufacturing': return 0.55;
    case 'service': return 0.25;
    case 'ecommerce': return 0.70;
    default: return 0.60;
  }
};

const getDefaultPrice = (dataType: string): number => {
  switch (dataType) {
    case 'retail': return 25;
    case 'manufacturing': return 50;
    case 'service': return 100;
    case 'ecommerce': return 30;
    default: return 25;
  }
};

const getDefaultUnits = (dataType: string): number => {
  switch (dataType) {
    case 'retail': return 5000;
    case 'manufacturing': return 2000;
    case 'service': return 1000;
    case 'ecommerce': return 8000;
    default: return 5000;
  }
};

const getDefaultParameters = () => ({
  fixedCosts: 50000,
  variableCostsPerUnit: 12,
  pricePerUnit: 25,
  expectedUnits: 5000,
  salesTaxRate: 8.5,
  discountRate: 10,
  inflationRate: 2.5,
  seasonalityFactor: 1.0
});

// Extract parameters using statistical inference
const extractInferredParameters = (numericFields: DataField[], patterns: any) => {
  // Calculate statistics across all numeric fields
  const allValues = numericFields.flatMap(field => 
    field.value?.filter(v => typeof v === 'number' && v > 0) || []
  );

  if (allValues.length === 0) {
    return getDefaultParameters();
  }

  // FIXED: Enhanced statistical analysis
  const sortedValues = allValues.sort((a, b) => a - b);
  const totalSum = sortedValues.reduce((sum, val) => sum + val, 0);
  const avgValue = totalSum / sortedValues.length;
  
  // FIXED: Enhanced parameter inference with better business logic
  let fixedCosts, variableCostsPerUnit, pricePerUnit, expectedUnits;

  if (patterns.dataType === 'retail' || patterns.dataType === 'ecommerce') {
    pricePerUnit = Math.min(avgValue, 100);
    expectedUnits = Math.max(100, Math.round(totalSum / pricePerUnit / 10));
    fixedCosts = Math.max(10000, totalSum * 0.2);
    variableCostsPerUnit = pricePerUnit * 0.6;
  } else if (patterns.dataType === 'manufacturing') {
    variableCostsPerUnit = Math.min(avgValue, 50);
    pricePerUnit = variableCostsPerUnit * 2.5;
    expectedUnits = Math.max(100, Math.round(totalSum / pricePerUnit));
    fixedCosts = Math.max(20000, totalSum * 0.3);
  } else if (patterns.dataType === 'service') {
    pricePerUnit = Math.max(50, avgValue);
    expectedUnits = Math.max(100, Math.round(totalSum / pricePerUnit));
    fixedCosts = Math.max(15000, totalSum * 0.4);
    variableCostsPerUnit = pricePerUnit * 0.3;
  } else {
    // Enhanced generic pattern with better statistical inference
    pricePerUnit = Math.min(avgValue, 50);
    expectedUnits = Math.max(100, Math.round(totalSum / pricePerUnit / 5));
    fixedCosts = Math.max(10000, totalSum * 0.25);
    variableCostsPerUnit = pricePerUnit * 0.5;
  }

  // Enhanced validation with reasonable bounds
  fixedCosts = Math.max(fixedCosts, 1000);
  pricePerUnit = Math.max(pricePerUnit, 1);
  expectedUnits = Math.max(expectedUnits, 100);
  variableCostsPerUnit = Math.min(variableCostsPerUnit, pricePerUnit * 0.8);

  return {
    fixedCosts: Math.round(fixedCosts),
    variableCostsPerUnit: Math.round(variableCostsPerUnit * 100) / 100,
    pricePerUnit: Math.round(pricePerUnit * 100) / 100,
    expectedUnits: Math.round(expectedUnits),
    salesTaxRate: 8.5,
    discountRate: 10,
    inflationRate: 2.5,
    seasonalityFactor: 1.0
  };
};

// FIXED: Monte Carlo simulation for uncertainty analysis
const runMonteCarloSimulation = (inputData: BreakEvenData, iterations: number = 1000) => {
  const results: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    // Add random variation to key inputs
    const variation = 0.15; // 15% variation
    const testInputs = {
      ...inputData,
      fixedCosts: inputData.fixedCosts * (1 + (Math.random() - 0.5) * variation),
      variableCostsPerUnit: inputData.variableCostsPerUnit * (1 + (Math.random() - 0.5) * variation),
      pricePerUnit: inputData.pricePerUnit * (1 + (Math.random() - 0.5) * variation * 0.5), // Less variation for price
      expectedUnits: inputData.expectedUnits * (1 + (Math.random() - 0.5) * variation),
    };
    
    // Calculate break-even point for this scenario
    const bep = testInputs.fixedCosts / (testInputs.pricePerUnit - testInputs.variableCostsPerUnit);
    results.push(bep);
  }
  
  // Calculate statistics
  const sortedResults = results.sort((a, b) => a - b);
  const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
  const median = sortedResults[Math.floor(results.length / 2)];
  const stdDev = Math.sqrt(results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length);
  const percentile95 = sortedResults[Math.floor(results.length * 0.95)];
  const percentile5 = sortedResults[Math.floor(results.length * 0.05)];
  
  return {
    mean,
    median,
    stdDev,
    percentile5,
    percentile95,
    coefficientOfVariation: stdDev / mean,
    results
  };
};

export function BreakEven({ data, onClose }: BreakEvenProps) {
  // Initialize inputs by analyzing the actual data
  const [inputs, setInputs] = useState<BreakEvenData>(() => 
    analyzeDataForBreakEven(data.fields)
  );

  const [activeTab, setActiveTab] = useState('analysis');
  const [animationKey, setAnimationKey] = useState(0);
  const [breakEvenPoint, setBreakEvenPoint] = useState<number>(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [scenarioData, setScenarioData] = useState<ScenarioData[]>([]);
  const [profitAtExpected, setProfitAtExpected] = useState<number>(0);
  const [marginOfSafety, setMarginOfSafety] = useState<number>(0);
  const [contributionMargin, setContributionMargin] = useState<number>(0);
  const [contributionMarginRatio, setContributionMarginRatio] = useState<number>(0);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [dataAnalysis, setDataAnalysis] = useState<string>('');
  const [monteCarloResults, setMonteCarloResults] = useState<any>(null);
  const [dataQualityScore, setDataQualityScore] = useState<number>(0);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Analyze data and provide insights
  useEffect(() => {
    const analysis = generateDataAnalysis(data.fields);
    setDataAnalysis(analysis);
  }, [data.fields]);

  // Auto-calculate on input change
  useEffect(() => {
    calculateBreakEven();
  }, [inputs]);

  const generateDataAnalysis = (fields: DataField[]): string => {
    const numericFields = fields.filter(field => field.type === 'number');
    const totalRecords = fields.length > 0 ? fields[0].value?.length || 0 : 0;
    
    let analysis = `Analyzed ${totalRecords} records with ${numericFields.length} numeric fields. `;
    
    if (numericFields.length > 0) {
      const fieldNames = numericFields.map(f => f.name).join(', ');
      analysis += `Found numeric fields: ${fieldNames}. `;
      
      // Analyze data patterns
      const patterns = analyzeDataPatterns(numericFields);
      
      // Check for business-relevant patterns
      const hasCostData = patterns.hasCostData;
      const hasPriceData = patterns.hasPriceData;
      const hasQuantityData = patterns.hasQuantityData;
      const hasRevenueData = patterns.hasRevenueData;
      const hasSalesData = patterns.hasSalesData;
      
      if (hasCostData) analysis += 'Cost data detected. ';
      if (hasPriceData) analysis += 'Price data detected. ';
      if (hasQuantityData) analysis += 'Quantity data detected. ';
      if (hasRevenueData) analysis += 'Revenue data detected. ';
      if (hasSalesData) analysis += 'Sales data detected. ';
      
      // Add business type inference
      if (patterns.dataType !== 'unknown') {
        analysis += `Inferred business type: ${patterns.dataType}. `;
      }
      
      if (!hasCostData && !hasPriceData && !hasQuantityData && !hasRevenueData && !hasSalesData) {
        analysis += 'Using statistical inference to estimate business parameters.';
      }
    }
    
    return analysis;
  };

  const validateInputs = (inputData: BreakEvenData): string[] => {
    const errors: string[] = [];
    
    if (inputData.fixedCosts <= 0) {
      errors.push('Fixed costs must be greater than 0');
    }
    if (inputData.variableCostsPerUnit < 0) {
      errors.push('Variable costs per unit cannot be negative');
    }
    if (inputData.pricePerUnit <= 0) {
      errors.push('Price per unit must be greater than 0');
    }
    if (inputData.expectedUnits <= 0) {
      errors.push('Expected units must be greater than 0');
    }
    if (inputData.pricePerUnit <= inputData.variableCostsPerUnit) {
      errors.push('Price per unit must be greater than variable cost per unit');
    }
    if (inputData.salesTaxRate < 0 || inputData.salesTaxRate > 50) {
      errors.push('Sales tax rate must be between 0% and 50%');
    }
    if (inputData.discountRate < 0 || inputData.discountRate > 100) {
      errors.push('Discount rate must be between 0% and 100%');
    }
    if (inputData.inflationRate < -10 || inputData.inflationRate > 50) {
      errors.push('Inflation rate must be between -10% and 50%');
    }
    
    return errors;
  };

  const calculateBreakEven = () => {
    const errors = validateInputs(inputs);
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      setIsValid(false);
      return;
    }

    const { fixedCosts, variableCostsPerUnit, pricePerUnit, expectedUnits, salesTaxRate, inflationRate } = inputs;
    
    setIsValid(true);
    
    // Enhanced break-even calculation with tax and inflation considerations
    const contributionMargin = pricePerUnit - variableCostsPerUnit;
    const afterTaxContributionMargin = contributionMargin * (1 - salesTaxRate / 100);
    const realContributionMargin = afterTaxContributionMargin / Math.pow(1 + inflationRate / 100, 1);
    
    const bep = fixedCosts / realContributionMargin;
    setBreakEvenPoint(bep);

    // Enhanced contribution metrics
    setContributionMargin(contributionMargin);
    setContributionMarginRatio(contributionMargin / pricePerUnit);

    // Enhanced profit calculation with time value of money
    const totalRevenue = pricePerUnit * expectedUnits;
    const totalVariableCosts = variableCostsPerUnit * expectedUnits;
    const grossProfit = totalRevenue - totalVariableCosts;
    const netProfit = grossProfit - fixedCosts;
    const afterTaxProfit = netProfit * (1 - salesTaxRate / 100);
    const realProfit = afterTaxProfit / Math.pow(1 + inflationRate / 100, 1);
    
    setProfitAtExpected(realProfit);
    
    // Enhanced margin of safety calculation
    const marginOfSafety = expectedUnits > bep ? ((expectedUnits - bep) / expectedUnits) * 100 : ((bep - expectedUnits) / expectedUnits) * -100;
    setMarginOfSafety(marginOfSafety);

    // Run Monte Carlo simulation
    const mcResults = runMonteCarloSimulation(inputs, 1000);
    setMonteCarloResults(mcResults);

    // Calculate data quality and confidence scores
    const patterns = analyzeDataPatterns(data.fields.filter((f: DataField) => f.type === 'number'));
    setDataQualityScore(patterns.dataQuality.accuracy);
    setConfidenceLevel(patterns.dataQuality.completeness);

    // Generate main chart data with enhanced accuracy
    const maxUnits = Math.max(bep * 2.5, expectedUnits * 1.5, 1000);
    const step = Math.ceil(maxUnits / 50);
    const chartDataArray = [];
    
    for (let units = 0; units <= maxUnits; units += step) {
      const totalCost = fixedCosts + (variableCostsPerUnit * units);
      const totalRevenue = pricePerUnit * units;
      const profitValue = totalRevenue - totalCost;
      
      chartDataArray.push({
        units,
        totalCost,
        totalRevenue,
        profit: profitValue,
        fixedCosts,
        variableCosts: variableCostsPerUnit * units,
        breakEvenReached: units >= bep
      });
    }

    setChartData(chartDataArray);

    // Enhanced scenario analysis with more detailed metrics
    const scenarios: ScenarioData[] = [];
    const baseUnits = Math.max(bep, expectedUnits);
    const scenarioRanges = [0.5, 0.75, 1, 1.25, 1.5, 2];
    
    scenarioRanges.forEach(multiplier => {
      const units = Math.round(baseUnits * multiplier);
      const revenue = pricePerUnit * units;
      const totalCost = fixedCosts + (variableCostsPerUnit * units);
      const scenarioProfit = revenue - totalCost;
      const scenarioContributionMargin = pricePerUnit - variableCostsPerUnit;
      const scenarioContributionMarginRatio = scenarioContributionMargin / pricePerUnit;
      const scenarioBreakEvenUnits = fixedCosts / scenarioContributionMargin;
      const scenarioMarginOfSafety = units > scenarioBreakEvenUnits ? 
        ((units - scenarioBreakEvenUnits) / units) * 100 : 
        ((scenarioBreakEvenUnits - units) / units) * -100;
      
      scenarios.push({
        scenario: `${Math.round(multiplier * 100)}%`,
        units,
        revenue,
        totalCost,
        profit: scenarioProfit,
        profitMargin: revenue > 0 ? (scenarioProfit / revenue) * 100 : 0,
        contributionMargin: scenarioContributionMargin,
        contributionMarginRatio: scenarioContributionMarginRatio,
        breakEvenUnits: scenarioBreakEvenUnits,
        marginOfSafety: scenarioMarginOfSafety
      });
    });

    setScenarioData(scenarios);
    setAnimationKey(prev => prev + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  };

  const costBreakdownData = [
    { name: 'Fixed Costs', value: inputs.fixedCosts, color: '#ff7c7c' },
    { name: 'Variable Costs', value: inputs.variableCostsPerUnit * inputs.expectedUnits, color: '#ffc658' }
  ];

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Break-Even Analysis Dashboard
        </h3>
        <p className="text-gray-600">Dynamic financial planning and profitability analysis</p>
      </div>
      
      {/* Input Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
        <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm mr-3">📊</span>
          Business Parameters
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: 'fixedCosts', label: 'Fixed Costs', desc: 'Monthly/Annual fixed expenses', icon: '🏢' },
            { key: 'variableCostsPerUnit', label: 'Variable Cost/Unit', desc: 'Cost per unit produced', icon: '⚙️' },
            { key: 'pricePerUnit', label: 'Price/Unit', desc: 'Selling price per unit', icon: '💰' },
            { key: 'expectedUnits', label: 'Expected Sales', desc: 'Projected units to sell', icon: '📈' }
          ].map(field => (
            <div key={field.key} className="relative">
              <Label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <span className="mr-2">{field.icon}</span>
                {field.label}
              </Label>
              <Input
                name={field.key}
                type="number"
                min="0"
                step={field.key.includes('Cost') || field.key.includes('Price') ? "0.01" : "1"}
                value={inputs[field.key as keyof BreakEvenData]}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{field.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl mb-6 border border-white/20">
        <div className="flex flex-wrap border-b border-gray-200">
          {[
            { id: 'analysis', label: 'Break-Even Analysis', icon: '📊' },
            { id: 'scenarios', label: 'Scenario Planning', icon: '🎯' },
            { id: 'breakdown', label: 'Cost Breakdown', icon: '🔍' },
            { id: 'insights', label: 'Business Insights', icon: '💡' },
            { id: 'data', label: 'Data Analysis', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {!isValid ? (
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold mb-2">Validation Errors</h3>
              <div className="text-left bg-white/10 rounded-lg p-4 mt-4">
                <ul className="list-disc list-inside space-y-2">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <>
              {/* FIXED: Data Quality and Confidence Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-700 font-medium">Data Quality</span>
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-800">{(dataQualityScore * 100).toFixed(0)}%</div>
                  <div className="text-xs text-blue-600">Accuracy Score</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-700 font-medium">Confidence Level</span>
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="text-2xl font-bold text-green-800">{(confidenceLevel * 100).toFixed(0)}%</div>
                  <div className="text-xs text-green-600">Analysis Confidence</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-700 font-medium">Uncertainty</span>
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-800">
                    {monteCarloResults ? `${(monteCarloResults.coefficientOfVariation * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-xs text-purple-600">Coefficient of Variation</div>
                </div>
              </div>

              {/* FIXED: Monte Carlo Simulation Results */}
              {monteCarloResults && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200 mb-6">
                  <h4 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
                    <span className="mr-2">🎲</span>
                    Monte Carlo Simulation (1,000 iterations)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="text-indigo-700 font-medium">Mean BEP:</span>
                      <br />
                      <span className="font-bold text-indigo-800">{formatNumber(monteCarloResults.mean)} units</span>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="text-indigo-700 font-medium">Median BEP:</span>
                      <br />
                      <span className="font-bold text-indigo-800">{formatNumber(monteCarloResults.median)} units</span>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="text-indigo-700 font-medium">95% Confidence:</span>
                      <br />
                      <span className="font-bold text-indigo-800">{formatNumber(monteCarloResults.percentile5)} - {formatNumber(monteCarloResults.percentile95)}</span>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="text-indigo-700 font-medium">Variability:</span>
                      <br />
                      <span className="font-bold text-indigo-800">{(monteCarloResults.coefficientOfVariation * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-100">Break-Even Point</span>
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="text-3xl font-bold break-words leading-tight">{formatNumber(breakEvenPoint)}</div>
                  <div className="text-blue-100 text-sm">units needed</div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-100">Revenue at BEP</span>
                    <span className="text-2xl">💚</span>
                  </div>
                  <div className="text-3xl font-bold break-words leading-tight">{formatCurrency(breakEvenPoint * inputs.pricePerUnit)}</div>
                  <div className="text-green-100 text-sm">total revenue</div>
                </div>

                <div className={`bg-gradient-to-br ${profitAtExpected >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} text-white rounded-2xl p-6 transform hover:scale-105 transition-all duration-200`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={profitAtExpected >= 0 ? 'text-emerald-100' : 'text-red-100'}>Projected P&L</span>
                    <span className="text-2xl">{profitAtExpected >= 0 ? '📈' : '📉'}</span>
                  </div>
                  <div className="text-3xl font-bold break-words leading-tight">{profitAtExpected >= 0 ? '+' : '-'}{formatCurrency(profitAtExpected)}</div>
                  <div className={`${profitAtExpected >= 0 ? 'text-emerald-100' : 'text-red-100'} text-sm`}>
                    at {formatNumber(inputs.expectedUnits)} units
                  </div>
                </div>

                <div className={`bg-gradient-to-br ${marginOfSafety >= 0 ? 'from-purple-500 to-purple-600' : 'from-orange-500 to-orange-600'} text-white rounded-2xl p-6 transform hover:scale-105 transition-all duration-200`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={marginOfSafety >= 0 ? 'text-purple-100' : 'text-orange-100'}>Safety Margin</span>
                    <span className="text-2xl">{marginOfSafety >= 0 ? '🛡️' : '⚡'}</span>
                  </div>
                  <div className="text-3xl font-bold break-words leading-tight">{marginOfSafety.toFixed(1)}%</div>
                  <div className={`${marginOfSafety >= 0 ? 'text-purple-100' : 'text-orange-100'} text-sm`}>
                    {marginOfSafety >= 0 ? 'buffer zone' : 'needs improvement'}
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  <div className="bg-white/50 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <span className="mr-2">📊</span>
                      Break-Even Visualization
                    </h3>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} key={animationKey}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="units" 
                            label={{ value: 'Units Sold', position: 'insideBottom', offset: -5 }}
                            stroke="#6b7280"
                          />
                          <YAxis 
                            label={{ value: 'Values ($)', angle: -90, position: 'insideLeft' }}
                            stroke="#6b7280"
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => [formatCurrency(value), name]}
                            labelFormatter={(label) => `Units: ${formatNumber(label)}`}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: '12px',
                              border: 'none',
                              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="totalRevenue"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            name="Revenue"
                            strokeWidth={3}
                          />
                          <Area
                            type="monotone"
                            dataKey="totalCost"
                            stroke="#ef4444"
                            fillOpacity={1}
                            fill="url(#colorCost)"
                            name="Total Cost"
                            strokeWidth={3}
                          />
                          <ReferenceLine 
                            x={breakEvenPoint} 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            label={{
                              position: 'top',
                              value: `Break-Even: ${formatNumber(breakEvenPoint)} units`,
                              fill: '#8b5cf6',
                              fontSize: 12,
                              fontWeight: 'bold'
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'scenarios' && (
                <div className="space-y-6">
                  <div className="bg-white/50 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <span className="mr-2">🎯</span>
                      Scenario Analysis
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scenarioData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="scenario" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              name === 'Profit Margin' ? `${value.toFixed(1)}%` : formatCurrency(value), 
                              name
                            ]}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: '12px',
                              border: 'none',
                              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Bar dataKey="profit" fill="#8884d8" name="Profit" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="profitMargin" fill="#82ca9d" name="Profit Margin" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'breakdown' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/50 rounded-2xl p-6">
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <span className="mr-2">🔍</span>
                        Cost Structure
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={costBreakdownData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {costBreakdownData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white/50 rounded-2xl p-6">
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <span className="mr-2">📊</span>
                        Unit Economics
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium">Price per Unit</span>
                          <span className="font-bold text-blue-600">{formatCurrency(inputs.pricePerUnit)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                          <span className="font-medium">Variable Cost per Unit</span>
                          <span className="font-bold text-red-600">-{formatCurrency(inputs.variableCostsPerUnit)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <span className="font-medium">Contribution Margin</span>
                          <span className="font-bold text-green-600">{formatCurrency(contributionMargin)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <span className="font-medium">Contribution Margin %</span>
                          <span className="font-bold text-purple-600">{(contributionMarginRatio * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                      <h3 className="text-xl font-semibold mb-4 flex items-center text-blue-800">
                        <span className="mr-2">💡</span>
                        Key Insights
                      </h3>
                      <div className="space-y-3 text-blue-700">
                        <p className="flex items-start">
                          <span className="mr-2 mt-1">•</span>
                          You need to sell <strong>{formatNumber(breakEvenPoint)}</strong> units to break even
                        </p>
                        <p className="flex items-start">
                          <span className="mr-2 mt-1">•</span>
                          Each unit contributes <strong>{formatCurrency(contributionMargin)}</strong> toward fixed costs
                        </p>
                        <p className="flex items-start">
                          <span className="mr-2 mt-1">•</span>
                          Your contribution margin ratio is <strong>{(contributionMarginRatio * 100).toFixed(1)}%</strong>
                        </p>
                        {marginOfSafety >= 0 ? (
                          <p className="flex items-start">
                            <span className="mr-2 mt-1">•</span>
                            Sales can drop <strong>{marginOfSafety.toFixed(1)}%</strong> before losses occur
                          </p>
                        ) : (
                          <p className="flex items-start">
                            <span className="mr-2 mt-1">•</span>
                            Sales need to increase <strong>{Math.abs(marginOfSafety).toFixed(1)}%</strong> to reach break-even
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                      <h3 className="text-xl font-semibold mb-4 flex items-center text-green-800">
                        <span className="mr-2">🚀</span>
                        Recommendations
                      </h3>
                      <div className="space-y-3 text-green-700">
                        {profitAtExpected < 0 && (
                          <p className="flex items-start">
                            <span className="mr-2 mt-1">•</span>
                            Consider increasing prices or reducing variable costs
                          </p>
                        )}
                        {contributionMarginRatio < 0.3 && (
                          <p className="flex items-start">
                            <span className="mr-2 mt-1">•</span>
                            Low contribution margin - focus on cost optimization
                          </p>
                        )}
                        {marginOfSafety < 20 && marginOfSafety >= 0 && (
                          <p className="flex items-start">
                            <span className="mr-2 mt-1">•</span>
                            Narrow safety margin - consider diversifying revenue streams
                          </p>
                        )}
                        <p className="flex items-start">
                          <span className="mr-2 mt-1">•</span>
                          Monitor unit economics closely as you scale
                        </p>
                        <p className="flex items-start">
                          <span className="mr-2 mt-1">•</span>
                          Consider volume discounts to increase sales beyond break-even
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
                    <h3 className="text-xl font-semibold mb-4 flex items-center text-indigo-800">
                      <span className="mr-2">📈</span>
                      Data Analysis Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-white/60 rounded-xl p-4">
                          <h4 className="font-semibold text-indigo-700 mb-2">Dataset Overview</h4>
                          <div className="space-y-2 text-sm text-indigo-600">
                            <p><strong>Total Fields:</strong> {data.fields.length}</p>
                            <p><strong>Numeric Fields:</strong> {data.fields.filter(f => f.type === 'number').length}</p>
                            <p><strong>Text Fields:</strong> {data.fields.filter(f => f.type === 'string').length}</p>
                            <p><strong>Records:</strong> {data.fields.length > 0 ? data.fields[0].value?.length || 0 : 0}</p>
                          </div>
                        </div>

                        <div className="bg-white/60 rounded-xl p-4">
                          <h4 className="font-semibold text-indigo-700 mb-2">Field Detection</h4>
                          <div className="space-y-2 text-sm text-indigo-600">
                            {(() => {
                              const costFields = data.fields.filter(f => 
                                f.name.toLowerCase().includes('cost') || 
                                f.name.toLowerCase().includes('expense') ||
                                f.name.toLowerCase().includes('fixed') ||
                                f.name.toLowerCase().includes('variable')
                              );
                              const priceFields = data.fields.filter(f => 
                                f.name.toLowerCase().includes('price') || 
                                f.name.toLowerCase().includes('revenue') ||
                                f.name.toLowerCase().includes('sales') ||
                                f.name.toLowerCase().includes('amount')
                              );
                              const quantityFields = data.fields.filter(f => 
                                f.name.toLowerCase().includes('quantity') || 
                                f.name.toLowerCase().includes('units') ||
                                f.name.toLowerCase().includes('volume') ||
                                f.name.toLowerCase().includes('count') ||
                                f.name.toLowerCase().includes('number')
                              );
                              
                              return (
                                <>
                                  <p><strong>Cost Fields:</strong> {costFields.length > 0 ? costFields.map(f => f.name).join(', ') : 'None detected'}</p>
                                  <p><strong>Price Fields:</strong> {priceFields.length > 0 ? priceFields.map(f => f.name).join(', ') : 'None detected'}</p>
                                  <p><strong>Quantity Fields:</strong> {quantityFields.length > 0 ? quantityFields.map(f => f.name).join(', ') : 'None detected'}</p>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white/60 rounded-xl p-4">
                          <h4 className="font-semibold text-indigo-700 mb-2">Extracted Parameters</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                              <span className="text-indigo-700">Fixed Costs</span>
                              <span className="font-bold text-blue-600">{formatCurrency(inputs.fixedCosts)}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                              <span className="text-indigo-700">Price per Unit</span>
                              <span className="font-bold text-green-600">{formatCurrency(inputs.pricePerUnit)}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
                              <span className="text-indigo-700">Variable Cost/Unit</span>
                              <span className="font-bold text-orange-600">{formatCurrency(inputs.variableCostsPerUnit)}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                              <span className="text-indigo-700">Expected Units</span>
                              <span className="font-bold text-purple-600">{formatNumber(inputs.expectedUnits)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/60 rounded-xl p-4">
                          <h4 className="font-semibold text-indigo-700 mb-2">Analysis Method</h4>
                          <div className="space-y-2 text-sm text-indigo-600">
                            <p>• <strong>Smart Detection:</strong> Automatically identifies business-relevant fields</p>
                            <p>• <strong>Statistical Extraction:</strong> Uses mean values from detected fields</p>
                            <p>• <strong>Intelligent Fallbacks:</strong> Applies business logic when data is missing</p>
                            <p>• <strong>Validation:</strong> Ensures realistic business parameters</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {onClose && (
        <Button 
          onClick={onClose} 
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Close Analysis
        </Button>
      )}

      {/* Data Analysis Summary */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
          <span className="mr-2">📊</span>
          Data Analysis Summary
        </h4>
        <p className="text-sm text-blue-700 leading-relaxed">
          {dataAnalysis || `Analyzed ${data.fields.length} data fields. Break-even analysis helps determine when your business will become profitable.`}
        </p>
        <div className="mt-3 text-xs text-blue-600">
          <p><strong>Data-Driven Parameters:</strong> Values are automatically extracted from your dataset where possible, with intelligent fallbacks for missing business data.</p>
        </div>
      </div>
    </Card>
  );
} 
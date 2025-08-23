import React from 'react';
import { 
  Brain, TrendingUp, BarChart2, FileText, PlayCircle, Save, AlertCircle, Clock, Lightbulb, AlertTriangle, Database, List
} from 'lucide-react';
import type { DataField } from '@/types/data';
import type { AnalyzedData } from '@/types/analysis';
// import { useNavigate } from 'react-router-dom';
import { AnalysisCategories } from './AnalysisCategories';
import { QuickActionCard } from './QuickActionCard';
import { AnalysisErrorBoundary } from './AnalysisErrorBoundary';
import { AlertSystem } from '../monitoring/AlertSystem';
import { StatisticalSummary } from './StatisticalSummary/components/StatisticalSummary';
import { ChartView } from '@/components/visualization';
import { CorrelationMatrix } from './CorrelationMatrix';
import { generateReport, downloadReport } from '@/utils/analysis/reports';
// import { generatePredictions } from '@/utils/analysis/predictions';
// import { generateAutoInsights } from '@/utils/analysis/insights';
import { useAnalysis } from '@/hooks/analysis';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import type { FileData } from '@/types/file';
import { AnalysisOverview } from './AnalysisOverview';
import { studentT, normalCDF, chiSquareCDF, fDistribution } from '../../utils/statistics/distributions';
import { TextAnalysisContainer } from './categories/text/TextAnalysisContainer';
import { SpatialAnalysis } from './categories/spatial/SpatialAnalysis';
import { NetworkAnalysisContainer } from './categories/network/NetworkAnalysisContainer';
import { PredictiveAnalysisContainer } from './categories/predictive/PredictiveAnalysisContainer';
import { TimeSeriesAnalysisContainer } from './categories/time';
import { MLAnalysisView } from './categories/ml/MLAnalysisView';
import MLInsights from './categories/ml/MLInsights';
import { BusinessMetrics } from './categories/business/BusinessMetrics';
import { RegressionAnalysisContainer } from './categories/regression/RegressionAnalysisContainer';
import { HypothesisAnalysis } from './categories/hypothesis';
import type { HypothesisTestType } from './categories/hypothesis/HypothesisAnalysis';
import UniversalMLAnalysisView from './categories/ml/UniversalMLAnalysisView';
import { getValidNumericFields, safeFilter } from '@/utils/validation/dataValidation';
import isEqual from 'lodash/isEqual';
// Vite worker import
// @ts-ignore
import AnalysisWorker from '../../workers/analysisWorker?worker&inline';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

interface AnalysisSectionProps {
  data: {
    fields: DataField[];
  };
  fileData?: FileData; // Add fileData prop
  category: string | null;
  results: (AnalyzedData & {
    analysis: {
      trends: Array<{
        field: string;
        direction: 'up' | 'down' | 'stable';
        confidence: number;
      }>;
    };
    mlAnalysis?: {
      predictions: number[];
      evaluation: {
        accuracy: number;
        loss: number;
      };
      training: {
        duration: number;
        history: {
          loss: number[];
          val_loss?: number[];
        };
      };
    };
    mlPredictions?: Record<string, number[]>;
    mlConfidence?: number;
    mlFeatures?: string[];
  }) | null;
  onResultsChange?: (results: AnalyzedData) => void;
}

interface TestResult {
  fieldName: string;
  pValue: number;
  statistic: number;
}

// Add type for analysis object
interface FieldAnalysis {
  min: number;
  max: number;
  avg: number;
  trend: 'up' | 'down' | 'stable';
  trendStrength: number;
  growthRate: number;
  volatility: number;
  outliers: number[];
  seasonalityScore: number;
  seasonalityNotes: string;
  lastValue: number;
  value: number[];
  uniqueValueCount?: number;
  nullCount?: number;
  topValues?: Array<{ value: string; count: number }>;
}

function analyzeField(field: DataField): FieldAnalysis {
  // Early validation - check if field.value exists and is an array
  if (!field.value || !Array.isArray(field.value)) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      trend: 'stable',
      trendStrength: 0,
      growthRate: 0,
      volatility: 0,
      outliers: [],
      seasonalityScore: 0,
      seasonalityNotes: 'No data available',
      lastValue: 0,
      value: [],
      uniqueValueCount: 0,
      nullCount: 0,
      topValues: []
    };
  }

  const values = field.value as number[];
  
  // Handle non-numeric data
  if (field.type !== 'number') {
    const uniqueValues = new Set(values);
    const valueCounts = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topValues = Object.entries(valueCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([value, count]) => ({ value, count: count as number }));
      
    return {
      uniqueValueCount: uniqueValues.size,
      nullCount: safeFilter(field.value, v => v == null || v === '').length,
      topValues,
      value: field.value,
      min: 0,
      max: 0,
      avg: 0,
      trend: 'stable',
      trendStrength: 0,
      growthRate: 0,
      volatility: 0,
      outliers: [],
      seasonalityScore: 0,
      seasonalityNotes: 'No seasonality for non-numerical data',
      lastValue: 0
    };
  }
  
  // Additional check for numerical values
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      trend: 'stable',
      trendStrength: 0,
      growthRate: 0,
      volatility: 0,
      outliers: [],
      seasonalityScore: 0,
      seasonalityNotes: 'No numerical data available',
      lastValue: 0,
      value: values
    };
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sortedValues = [...values].sort((a, b) => a - b);
  const min = sortedValues[0];
  const max = sortedValues[values.length - 1];
  
  // Calculate trend
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstHalfMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondHalfMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const trend = secondHalfMean > firstHalfMean ? 'up' : secondHalfMean < firstHalfMean ? 'down' : 'stable';
  const trendStrength = Math.abs(secondHalfMean - firstHalfMean) / firstHalfMean;
  
  // Calculate growth rate
  const growthRate = ((secondHalfMean - firstHalfMean) / firstHalfMean) * 100;
  
  // Calculate volatility
  const volatility = (Math.max(...values) - Math.min(...values)) / mean * 100;
  
  // Detect outliers using IQR method
  const q1 = sortedValues[Math.floor(values.length * 0.25)];
  const q3 = sortedValues[Math.floor(values.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = values.filter(v => v < lowerBound || v > upperBound);
  
  // Detect seasonality (simple approach)
  const seasonalityScore = values.length > 12 ? 
    Math.abs(values.reduce((acc, val, i) => acc + (val - mean) * Math.sin(2 * Math.PI * i / 12), 0)) / values.length : 0;
  const seasonalityNotes = seasonalityScore > 0.5 ? 
    'Shows strong seasonal patterns' : 
    seasonalityScore > 0.3 ? 
    'Shows moderate seasonal patterns' : 
    'No significant seasonality detected';
  
  return {
    min,
    max,
    avg: mean,
    trend,
    trendStrength,
    growthRate,
    volatility,
    outliers,
    seasonalityScore,
    seasonalityNotes,
    lastValue: values[values.length - 1],
    value: values
  };
}

// Add AnalysisHeader component
function AnalysisHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {icon}
      <h4 className="text-lg font-semibold text-black">{title}</h4>
    </div>
  );
}

// Simple Sparkline component
function Sparkline({ data, color = '#3b82f6' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / (max - min || 1)) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="80" height="24" viewBox="0 0 100 100" className="inline-block align-middle">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        points={points}
        style={{ opacity: 0.7 }}
      />
    </svg>
  );
}

export function AnalysisSection({ data, fileData, category, results, onResultsChange }: AnalysisSectionProps) {
  // All hooks at the very top, before ANY return or if statement!
  const [showOnboarding, setShowOnboarding] = React.useState(true);
  const { analyze, results: analysisResults } = useAnalysis();
  const [regressionType] = React.useState('linear');
  const [regressionFilters, setRegressionFilters] = React.useState({
    selectedFeatures: [] as string[],
    modelParams: {} as Record<string, number>,
    modelType: regressionType
  });
  const { createVersion } = useWorkspace();
  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
  const [hypothesisTestType, setHypothesisTestType] = React.useState<HypothesisTestType>('t-test');
  const [timeSeriesModel, setTimeSeriesModel] = React.useState('arima');
  const [testResults, setTestResults] = React.useState<TestResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const aggregatedData = React.useMemo(() => ({
    ...data,
    fields: data.fields.map(field => ({
      ...field,
      value: field.type === 'number'
        ? Array.from(new Float64Array((field.value as number[] || []).slice(0, Math.min((field.value as number[] || []).length, 1000))))
        : (field.value || []).slice(0, Math.min((field.value || []).length, 1000))
    }))
  }), [data]) as { fields: DataField[] };
  
  // All useCallback, useEffect, etc. hooks here
  const performHypothesisTests = React.useCallback(() => {
    const numericFields = getValidNumericFields(data.fields);
    if (numericFields.length < 2) return;

    const results: TestResult[] = [];
    
    switch (hypothesisTestType) {
      case 't-test':
        // Perform t-test between pairs of numeric fields
        for (let i = 0; i < numericFields.length - 1; i++) {
          for (let j = i + 1; j < numericFields.length; j++) {
            const field1 = numericFields[i];
            const field2 = numericFields[j];
            const values1 = field1.value as number[];
            const values2 = field2.value as number[];
            
            // Additional safety checks
            if (!values1 || !values2 || values1.length === 0 || values2.length === 0) {
              continue;
            }
            
            // Calculate t-statistic and p-value
            const mean1 = values1.reduce((a, b) => a + b) / values1.length;
            const mean2 = values2.reduce((a, b) => a + b) / values2.length;
            const var1 = values1.reduce((acc, val) => acc + Math.pow(val - mean1, 2), 0) / (values1.length - 1);
            const var2 = values2.reduce((acc, val) => acc + Math.pow(val - mean2, 2), 0) / (values2.length - 1);
            const pooledVar = ((values1.length - 1) * var1 + (values2.length - 1) * var2) / (values1.length + values2.length - 2);
            const standardError = Math.sqrt(pooledVar * (1/values1.length + 1/values2.length));
            const tStatistic = (mean1 - mean2) / standardError;
            const pValue = 2 * (1 - studentT(Math.abs(tStatistic), values1.length + values2.length - 2));
            
            results.push({
              fieldName: `${field1.name} vs ${field2.name}`,
              pValue,
              statistic: tStatistic
            });
          }
        }
        break;
        
      case 'z-test':
        // Perform z-test for each numeric field against population mean
        numericFields.forEach(field => {
          const values = field.value as number[];
          if (!values || values.length === 0) return;
          
          const mean = values.reduce((a, b) => a + b) / values.length;
          const stdDev = Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (values.length - 1));
          const zStatistic = (mean - 0) / (stdDev / Math.sqrt(values.length));
          const pValue = 2 * (1 - normalCDF(Math.abs(zStatistic)));
          
          results.push({
            fieldName: field.name,
            pValue,
            statistic: zStatistic
          });
        });
        break;
        
      case 'chi-square':
        // Perform chi-square test for each numeric field
        numericFields.forEach(field => {
          const values = field.value as number[];
          if (!values || values.length === 0) return;
          
          const observed = values.reduce((acc, val) => {
            acc[Math.floor(val)] = (acc[Math.floor(val)] || 0) + 1;
            return acc;
          }, {} as Record<number, number>);
          
          const expected = Object.keys(observed).length;
          const chiSquare = Object.values(observed).reduce((acc, val) => 
            acc + Math.pow(val - expected, 2) / expected, 0);
          const pValue = 1 - chiSquareCDF(chiSquare, Object.keys(observed).length - 1);
          
          results.push({
            fieldName: field.name,
            pValue,
            statistic: chiSquare
          });
        });
        break;
        
      case 'anova':
        // Perform ANOVA if we have at least 3 numeric fields
        if (numericFields.length >= 3) {
          const groups = numericFields.map(field => field.value as number[]).filter(values => values && values.length > 0);
          if (groups.length < 3) return;
          
          const overallMean = groups.flat().reduce((a, b) => a + b) / groups.flat().length;
          
          const betweenGroupSS = groups.reduce((acc, group) => {
            const groupMean = group.reduce((a, b) => a + b) / group.length;
            return acc + group.length * Math.pow(groupMean - overallMean, 2);
          }, 0);
          
          const withinGroupSS = groups.reduce((acc, group) => {
            const groupMean = group.reduce((a, b) => a + b) / group.length;
            return acc + group.reduce((sum, val) => sum + Math.pow(val - groupMean, 2), 0);
          }, 0);
          
          const fStatistic = (betweenGroupSS / (groups.length - 1)) / (withinGroupSS / (groups.flat().length - groups.length));
          const pValue = 1 - fDistribution(fStatistic, groups.length - 1, groups.flat().length - groups.length);
          
          results.push({
            fieldName: 'ANOVA Test',
            pValue,
            statistic: fStatistic
          });
        }
        break;
    }
    
    setTestResults(results);
  }, [data.fields, hypothesisTestType]);

  React.useEffect(() => {
    performHypothesisTests();
  }, [performHypothesisTests]);

  React.useEffect(() => {
    const worker = new AnalysisWorker();
    const initAnalysis = async () => {
      try {
        setIsAnalyzing(true);
        // Filter out non-numeric fields before analysis using validation utility
        const numericFields = getValidNumericFields(data.fields);
        if (numericFields.length === 0) {
          setIsAnalyzing(false);
          return;
        }
        // Use Web Worker for heavy analysis
        worker.postMessage({ fields: numericFields, category });
        worker.onmessage = (event: MessageEvent) => {
          const { success } = event.data;
          if (success) {
            analyze(numericFields); // Optionally merge with worker result
            setIsAnalyzing(false);
          } else {
            setIsAnalyzing(false);
          }
        };
      } catch (error) {
        console.error('Analysis error:', error);
        setIsAnalyzing(false);
      }
    };
    initAnalysis();
    return () => {
      worker.terminate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.fields, category, analyze]);

  React.useEffect(() => {
    setRegressionFilters(prev => ({
      ...prev,
      modelType: regressionType
    }));
  }, [regressionType]);

  React.useEffect(() => {
    if (category === 'regression' && results?.models) {
      try {
        // Apply filters to regression results
        const filteredResults = {
          ...results,
          models: results.models
            .filter((model:any) => 
              regressionFilters.selectedFeatures.length === 0 || 
              regressionFilters.selectedFeatures.includes(model.field)
            )
            .map((model:any) => ({
              ...model,
              type: regressionFilters.modelType,
              metrics: calculateMetrics(model, regressionFilters.modelParams)
            }))
        };
        // Only update if filteredResults are different
        if (!isEqual(filteredResults, results)) {
          onResultsChange?.(filteredResults);
        }
      } catch (err) {
        console.error('Error updating regression results:', err);
      }
    }
  }, [category, regressionFilters, results, onResultsChange]);

  // Helper function to recalculate metrics with new parameters
  const calculateMetrics = (model: any, params: Record<string, number>) => {
    const baseMetrics = { ...model.metrics };
    
    if (params.alpha) {
      // Adjust metrics for regularization strength
      const regularizationFactor = 1 / (1 + params.alpha);
      baseMetrics.rSquared *= regularizationFactor;
      baseMetrics.rmse /= regularizationFactor;
    }
    
    if (params.degree) {
      // Adjust metrics for polynomial degree
      baseMetrics.aic += 2 * params.degree;
      baseMetrics.bic += Math.log(model.actualValues.length) * params.degree;
    }
    
    return baseMetrics;
  };

  const handleSaveToWorkspace = async () => {
    try {
      if (!data?.fields?.length) {
        throw new Error('No data available to save');
      }

      // Format the data for saving
      const fileData: FileData = {
        type: 'csv',
        content: {
          fields: data.fields
        },
        name: `Analysis_${new Date().toISOString()}`
      };

      // Create a new workspace version with the current analysis data
      await createVersion(fileData, 'Analysis saved from dashboard');
      
      // Show success message
      alert('Analysis saved to workspace successfully!');
    } catch (error) {
      console.error('Failed to save to workspace:', error);
      alert('Failed to save analysis to workspace. Please try again.');
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      if (!data?.fields?.length) {
        throw new Error('No data available for report generation');
      }
      const report = await generateReport(data);
      downloadReport(report);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Add logging for ML analysis
  React.useEffect(() => {
    if (category === 'ml') {
      console.log('ML Analysis Section - Data:', data);
      console.log('ML Analysis Section - Results:', results);
    }
  }, [category, data, results]);

  // Early validation (AFTER all hooks)
  if (!data?.fields?.length) {
    console.warn('AnalysisSection: No data fields available');
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        {showOnboarding && (
          <Card className="max-w-md w-full text-center p-6">
            <CardHeader>
              <CardTitle>Welcome to Data Analyzer Pro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Get started by uploading your data file or connecting a data source.</p>
              <p className="text-sm text-gray-500 mb-4">You'll see insights, trends, and recommendations here once your data is loaded.</p>
              <Button variant="accent" size="sm" onClick={() => setShowOnboarding(false)}>Dismiss</Button>
            </CardContent>
          </Card>
        )}
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-600">No data available for analysis</p>
        </div>
      </div>
    );
  }

  // Log data validation for debugging
  console.log('AnalysisSection: Data validation', {
    totalFields: data.fields.length,
    validFields: getValidNumericFields(data.fields).length,
    fieldTypes: data.fields.map(f => ({ name: f.name, type: f.type, hasValue: !!f.value, valueLength: f.value?.length }))
  });

  if (isAnalyzing) {
    // Animated skeleton loader for insights and recommendations
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((col) => (
          <Card key={col} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full" />
              ))}
              <div className="h-4 bg-gray-100 rounded w-2/3 mt-4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  console.log('Category:', category);
  console.log('Numeric fields:', data?.fields?.filter(f => f.type === 'number')?.length || 0);

  return (
    <AnalysisErrorBoundary>
      <div className="space-y-8">
        {/* System Monitoring */}
        <div className="flex justify-end mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSaveToWorkspace}
              variant="accent"
              size="sm"
              disabled={isGeneratingReport}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isGeneratingReport ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </span>
              ) : (
                'Save to Workspace'
              )}
            </Button>
          </div>
          <AlertSystem data={data} />
        </div>

        <div className="opacity-0 animate-fade-in">
          <AnalysisOverview data={aggregatedData} />
        </div>

        {/* Quick Actions */}
        <div className="opacity-0 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={handleGenerateReport}
              variant="accent"
              size="sm"
              disabled={isGeneratingReport}
              leftIcon={<FileText className="w-5 h-5" />}
              className="w-full h-auto p-4 shadow-sm bg-white rounded-lg text-left flex flex-col gap-1"
            >
              <span className="font-medium text-gray-900">Download Report</span>
              <span className="text-sm text-gray-500 break-words whitespace-normal">
                Generate and download comprehensive analysis report
              </span>
              {isGeneratingReport && (
                <span className="mt-2 animate-spin rounded-full h-4 w-4 border-2 border-teal-600 border-t-transparent" />
              )}
            </Button>
            <QuickActionCard
              title="Run Simulation"
              description="Test different scenarios and predict outcomes"
              onClick={() => {}}
              isLoading={true}
              icon={PlayCircle}
            />
            <QuickActionCard
              title="View Predictions"
              description="See AI-powered predictions and forecasts"
              onClick={() => {}}
              isLoading={true}
              icon={TrendingUp}
            />
            <QuickActionCard
              title="Auto Insights"
              description="Get automated insights and recommendations"
              onClick={() => {}}
              isLoading={true}
              icon={Brain}
            />
          </div>
        </div>

        {/* Insights and Analysis Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Comprehensive Insights */}
          <Card>
            <CardHeader className="flex items-center gap-2 mb-6 text-black">
              <Brain className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg font-semibold text-gray-800">Comprehensive Data Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.fields?.length > 0 ? (
                <div className="space-y-4">
                  {data.fields.map((field, index) => {
                    const analysis = analyzeField(field);
                    const isNumerical = field.type === 'number';
                    const hasOutliers = isNumerical && analysis.outliers.length > 0;
                    const hasSeasonality = isNumerical && analysis.seasonalityScore > 0.5;
                    return (
                      <Card key={index} className="p-3 border">
                        <div className="flex justify-between items-start">
                          <CardTitle className="font-medium text-gray-800 text-base flex items-center gap-2">
                            {field.name}
                            {isNumerical && (
                              <span className="ml-2"><Sparkline data={analysis.value} /></span>
                            )}
                          </CardTitle>
                          {isNumerical && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className={`text-xs px-2 py-1 rounded-full cursor-help ${
                                    analysis.trend === 'up' ? 'bg-green-100 text-green-800' :
                                    analysis.trend === 'down' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {analysis.trend === 'up' ? '↑ Upward' : 
                                     analysis.trend === 'down' ? '↓ Downward' : '→ Stable'}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {analysis.trend === 'up' && 'This metric is trending upward.'}
                                  {analysis.trend === 'down' && 'This metric is trending downward.'}
                                  {analysis.trend === 'stable' && 'This metric is stable.'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <CardContent className="mt-2 space-y-2 text-black p-0">
                          {isNumerical ? (
                            <>
                              <div className="flex justify-between text-sm text-black">
                                <span>Range: {analysis.min.toLocaleString()} - {analysis.max.toLocaleString()}</span>
                                <span>Avg: {analysis.avg.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 text-black">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full text-black" 
                                  style={{ width: `${Math.min(100, Math.max(5, (analysis.avg - analysis.min) / (analysis.max - analysis.min) * 100))}%` }}
                                />
                              </div>
                              {analysis.trendStrength > 0.3 && (
                                <p className="text-sm">
                                  {analysis.trend === 'up' ? (
                                    <span className="text-green-600">
                                      Growing at ~{analysis.growthRate.toFixed(1)}% per period
                                    </span>
                                  ) : (
                                    <span className="text-red-600">
                                      Declining at ~{Math.abs(analysis.growthRate).toFixed(1)}% per period
                                    </span>
                                  )}
                                </p>
                              )}
                              {hasOutliers && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="mt-1 text-sm text-yellow-700 bg-yellow-50 p-2 rounded cursor-help">
                                        <span className="font-medium text-black">⚠️ Anomalies detected:</span> {analysis.outliers.length} 
                                        unusual value{analysis.outliers.length > 1 ? 's' : ''} (e.g., {analysis.outliers.slice(0, 2).join(', ')})
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Outliers are values that deviate significantly from the rest of the data.
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {hasSeasonality && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="mt-1 text-sm text-purple-700 bg-purple-50 p-2 rounded cursor-help">
                                        <span className="font-medium text-black ">🔄 Seasonal pattern:</span> {analysis.seasonalityNotes}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      This metric shows a repeating seasonal pattern over time.
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </>
                          ) : (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                {field.value.length} distinct {field.value.length === 1 ? 'value' : 'values'}
                              </p>
                              {field.value.length <= 10 ? (
                                <p className="text-sm mt-1">
                                  Values: {field.value.join(', ')}
                                </p>
                              ) : (
                                <div className="text-sm mt-1">
                                  <p>Most frequent: {analysis.topValues?.map(v => `${v.value} (${v.count}x)`).join(', ') || 'N/A'}</p>
                                  <p className="text-gray-500 mt-1">
                                    {analysis.uniqueValueCount || 0} unique values with {analysis.nullCount ? `${analysis.nullCount} missing` : 'no missing'} data
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No data fields available for analysis</p>
                  <p className="text-sm mt-1">Upload or connect your data to get insights</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Actionable Insights */}
          <Card>
            <CardHeader className="flex items-center gap-2 mb-6">
              <Lightbulb className="w-5 h-5 text-purple-500" />
              <CardTitle className="text-lg font-semibold text-gray-800">Actionable Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-6">
              {/* Performance Highlights */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Performance Highlights
                </h4>
                
                {data?.fields?.filter(f => f.type === 'number' && analyzeField(f).trend === 'up' && analyzeField(f).trendStrength > 0.5)?.length > 0 ? (
                  <ul className="space-y-3">
                    {data.fields
                      ?.filter(f => f.type === 'number')
                      ?.filter(f => {
                        const analysis = analyzeField(f);
                        return analysis.trend === 'up' && analysis.trendStrength > 0.5;
                      })
                      ?.map((field, index) => {
                        const analysis = analyzeField(field);
                        return (
                          <li key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{field.name}</p>
                              <p className="text-sm text-gray-600">
                                Strong positive trend ({analysis.trendStrength.toFixed(1)}x) with {analysis.growthRate > 0 ? 
                                `${analysis.growthRate.toFixed(1)}% growth` : 'consistent improvement'} over time
                              </p>
                              {analysis.lastValue > analysis.avg * 1.2 && (
                                <p className="text-sm text-green-700 mt-1">
                                  Latest value ({analysis.lastValue.toLocaleString()}) is {((analysis.lastValue/analysis.avg-1)*100).toFixed(0)}% above average
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <div className="text-gray-500 bg-gray-50 p-3 rounded">
                    No metrics showing strong positive trends (growth &gt; 50% or consistent upward movement)
                  </div>
                )}
              </div>

              {/* Improvement Opportunities */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2 text-black">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Improvement Opportunities
                </h4>
                
                {data?.fields?.filter(f => {
                  const analysis = analyzeField(f);
                  return f.type === 'number' && (
                    analysis.trend === 'down' || 
                    analysis.volatility > 30 || 
                    analysis.outliers.length > 0
                  );
                })?.length > 0 ? (
                  <ul className="space-y-3">
                    {data.fields
                      ?.filter(f => f.type === 'number')
                      ?.filter(f => {
                        const analysis = analyzeField(f);
                        return analysis.trend === 'down' || analysis.volatility > 30 || analysis.outliers.length > 0;
                      })
                      ?.map((field, index) => {
                        const analysis = analyzeField(field);
                        return (
                          <li key={index} className="flex items-start gap-3 text-black">
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{field.name}</p>
                              
                              {analysis.trend === 'down' && (
                                <p className="text-sm text-gray-600">
                                  <span className="text-red-600">Declining trend ({Math.abs(analysis.trendStrength).toFixed(1)}x)</span> - 
                                  last period was {analysis.lastValue < analysis.avg ? 'below' : 'above'} average
                                </p>
                              )}
                              
                              {analysis.volatility > 30 && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <span className="text-yellow-600">High volatility ({analysis.volatility.toFixed(0)}%)</span> - 
                                  values fluctuate significantly
                                </p>
                              )}
                              
                              {analysis.outliers.length > 0 && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <span className="text-red-600">Contains {analysis.outliers.length} outlier{analysis.outliers.length > 1 ? 's' : ''}</span> - 
                                  investigate potential data issues or special causes
                                </p>
                              )}
                              
                              <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-black">
                                <p className="font-medium text-gray-700">Suggested actions:</p>
                                <ul className="list-disc pl-5 space-y-1 mt-1">
                                  {analysis.trend === 'down' && (
                                    <li>Analyze recent changes affecting this metric</li>
                                  )}
                                  {analysis.volatility > 30 && (
                                    <li>Implement control measures to reduce variation</li>
                                  )}
                                  {analysis.outliers.length > 0 && (
                                    <li>Validate outlier data points for accuracy</li>
                                  )}
                                  {analysis.seasonalityScore > 0.5 && (
                                    <li>Consider seasonal adjustments in analysis</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <div className="text-gray-500 bg-gray-50 p-3 rounded">
                    No significant issues detected in the metrics
                  </div>
                )}
              </div>

              {/* Data Quality Assessment */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  Data Quality Assessment
                </h4>
                
                <div className="space-y-2">
                  {data?.fields?.some(f => {
                    const analysis = analyzeField(f);
                    return analysis.nullCount && analysis.nullCount > 0;
                  }) && (
                    <div className="flex items-start gap-3">
                      <Database className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-800">Missing Values Detected</p>
                        <p className="text-sm text-gray-600">
                          {data.fields?.filter(f => {
                            const analysis = analyzeField(f);
                            return analysis.nullCount && analysis.nullCount > 0;
                          })?.length || 0} fields contain missing data
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {data?.fields?.some(f => {
                    const analysis = analyzeField(f);
                    return f.type !== 'number' && analysis.uniqueValueCount && analysis.uniqueValueCount > 20;
                  }) && (
                    <div className="flex items-start gap-3">
                      <List className="w-5 h-5 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-800">High Cardinality Fields</p>
                        <p className="text-sm text-gray-600">
                          {data.fields?.filter(f => {
                            const analysis = analyzeField(f);
                            return f.type !== 'number' && analysis.uniqueValueCount && analysis.uniqueValueCount > 20;
                          })?.length || 0} text fields with many unique values
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Categories */}
        <AnalysisCategories data={aggregatedData} fileData={fileData} />
        
        {/* Category-specific Analysis */}
        {category && results && (
          <div className="glass-card">
            {results.error ? (
              <div className="text-red-400 p-4 bg-red-900/50 rounded-lg border border-red-500/20">
                {results.error}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <Brain className="w-5 h-5 text-black-500" />
                  <h3 className="text-lg font-semibold text-black-500">
                    {category.charAt(0).toUpperCase() + category.slice(1)} Analysis
                  </h3>
                </div>
                
                {category === 'descriptive' && results.statistics && (
                  <StatisticalSummary data={data} />
                )}
                
                {category === 'correlation' && (
                  <div className="space-y-8">
                    <div
                      className="bg-white p-6 rounded-lg shadow-sm transition-all duration-500 transform opacity-0 animate-fade-in"
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <BarChart2 className="w-5 h-5 text-black-500" />
                        <h4 className="text-lg font-semibold text-black">Correlation Analysis</h4>
                      </div>
                      <CorrelationMatrix data={data} />
                    </div>
                  </div>
                )}

                {category === 'visualization' && (
                  <div className="space-y-8">
                    <div
                      className="bg-white p-6 rounded-lg shadow-sm transition-all duration-500 transform opacity-0 animate-fade-in"
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <BarChart2 className="w-5 h-5 text-black-500" />
                        <h4 className="text-lg font-semibold text-black">Data Visualization</h4>
                      </div>
                      <div 
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                      >
                        <ChartView 
                          data={data.fields}
                          type="bar"
                          title="Distribution Chart"
                        />
                        <ChartView 
                          data={data.fields}                                      
                          type="line"
                          title="Trend Chart"
                        />
                        <ChartView 
                          data={data.fields}
                          type="pie"
                          title="Distribution Pie Chart"
                        />
                        <ChartView 
                          data={data.fields}
                          type="radar"
                          title="Multi-dimensional Radar Chart"
                        />
                      </div>
                    </div>
                    
                    <div
                      className="opacity-0 animate-fade-in"
                      style={{ animationDelay: '600ms' }}
                    >
                      
                    </div>
                  </div>
                )}

                {category === 'business' && (
                  <div className="space-y-8">
                    <BusinessMetrics data={data} />
                  </div>
                )}

                {category === 'regression' && (
                  <div className="space-y-8">
                    <RegressionAnalysisContainer data={data} />
                  </div>
                )}

                {category === 'hypothesis' && (
                  <div className="space-y-8">
                    <HypothesisAnalysis 
                      testResults={testResults}
                      hypothesisTestType={hypothesisTestType}
                      onTestTypeChange={setHypothesisTestType}
                    />
                  </div>
                )}

                {category === 'time-series' && (
                  <div className="space-y-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 mb-6">
                        <Clock className="w-5 h-5 text-black-500" />
                        <h4 className="text-lg font-semibold text-black">Time Series Analysis</h4>
                      </div>
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-black mb-2">Model Type</label>
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-md"
                          value={timeSeriesModel}
                          onChange={(e) => setTimeSeriesModel(e.target.value)}
                        >
                          <option value="arima" className="text-black">ARIMA</option>
                          <option value="exponential" className="text-black">Exponential Smoothing</option>
                          <option value="prophet" className="text-black">Prophet</option>
                          <option value="lstm" className="text-black">LSTM</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                        {data?.fields
                          ?.filter(f => f.type === 'number')
                          ?.slice(0, 2)
                          ?.map((field, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                              <h5 className="font-medium text-black mb-2">{field.name} Time Series</h5>
                              <div className="h-64 bg-white rounded-md p-2">
                                {/* Placeholder for time series chart */}
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  Time Series Chart
                                </div>
                              </div>
                              <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-md">
                                  <p className="text-sm text-black">Forecast (Next 5 periods)</p>
                                  <p className="text-lg font-semibold text-black-500">[Forecast values]</p>
                                </div>
                                <div className="bg-white p-3 rounded-md">
                                  <p className="text-sm text-black">Model Performance</p>
                                  <p className="text-lg font-semibold text-black-500">RMSE: 0.023</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {category === 'text' && (
                  <div className="space-y-8">
                    <TextAnalysisContainer fields={data?.fields || []} />
                  </div>
                )}

                {category === 'spatial' && (
                  <div className="space-y-8">
                    <SpatialAnalysis.render data={{ ...data, rows: data?.fields?.map(field => ({ [field.name]: field.value })) || [] }} />
                  </div>
                )}

                {category === 'network' && (
                  <div className="space-y-8">
                    <NetworkAnalysisContainer data={data} />
                  </div>
                )}

                {category === 'predictive' && (
                  <div className="space-y-8">
                    <PredictiveAnalysisContainer data={data} />
                  </div>
                )}

                {category === 'time' && (
                  <div className="space-y-8">
                    <TimeSeriesAnalysisContainer data={data} />
                  </div>
                )}

                {analysisResults && (
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-black">Analysis Insights</h3>
                    </div>
                    <div className="space-y-4">
                      {(analysisResults as unknown as { analysis: { trends: Array<{ field: string; direction: 'up' | 'down' | 'stable'; confidence: number }> } })?.analysis?.trends?.map((trend, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-black">{trend.field}</h4>
                          <p className="text-black mt-1">
                            Shows {trend.direction} trend with {(trend.confidence * 100).toFixed(1)}% confidence
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                
                {category === 'ml' && (
                  <div className="space-y-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <AnalysisHeader 
                        title="Machine Learning Analysis" 
                        icon={<Brain className="w-5 h-5 text-indigo-600" />} 
                      />
                      
                      {/* Main ML Analysis Flow */}
                      {data?.fields?.filter(f => f.type === 'number')?.length >= 2 ? (
                        <div className="space-y-8">
                          {/* Universal ML Analysis - Core processing */}
                          <UniversalMLAnalysisView 
                            data={data} 
                            onAnalysisComplete={(results) => {
                              if (onResultsChange) {
                                const updatedResults: AnalyzedData = {
                                  fields: data.fields,
                                  statistics: {},
                                  trends: [],
                                  correlations: [],
                                  insights: [],
                                  recommendations: [],
                                  pros: [],
                                  cons: [],
                                  analysis: {
                                    trends: []
                                  },
                                  hasNumericData: data?.fields?.some(f => f.type === 'number') || false,
                                  hasTextData: data?.fields?.some(f => f.type === 'string') || false,
                                  dataQuality: {
                                    completeness: 1,
                                    validity: 1
                                  },
                                  mlAnalysis: {
                                    predictions: results.predictions,
                                    evaluation: results.evaluation,
                                    training: results.training
                                  },
                                  mlPredictions: { predictions: results.predictions },
                                  mlConfidence: results.evaluation.accuracy,
                                  mlFeatures: data?.fields?.filter(f => f.type === 'number')?.map(f => f.name) || []
                                };
                                onResultsChange(updatedResults);
                              }
                            }}
                          />
                          
                          {/* Detailed Analysis View */}
                          {results?.mlAnalysis && (
                            <>
                              <MLAnalysisView 
                                analysis={results.mlAnalysis} 
                                isRegression={true}
                              />
                              
                              {/* Insights Visualization */}
                              <MLInsights 
                                predictions={results.mlPredictions || {}}
                                actuals={[]}
                                confidence={results.mlConfidence || 0}
                                features={results.mlFeatures || []}
                              />
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <AlertCircle className="w-5 h-5" />
                            <p>
                              {data?.fields?.length === 0 
                                ? "Please upload data first" 
                                : "ML analysis requires at least 2 numeric fields"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AnalysisErrorBoundary>
  );
}
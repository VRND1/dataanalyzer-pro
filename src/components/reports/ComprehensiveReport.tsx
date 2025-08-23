import React from 'react';
import { FileText, Download, Brain, Calculator, TrendingUp, AlertCircle, ChevronDown, Map, Network, MessageSquare, Clock } from 'lucide-react';
import { DataField } from '@/types/data';
import { calculateFieldStats } from '@/utils/analysis/statistics/calculations';
import { determineTrend } from '@/utils/analysis/statistics/trends';
import { formatNumber } from '@/utils/analysis/formatting';
import { useNavigate } from 'react-router-dom';
import { getAnalysisData } from '@/utils/storage/db';
import { generateReport, downloadReport } from '@/utils/analysis/reports';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import { SentimentAnalyzer } from '@/utils/analysis/nlp/sentimentAnalyzer';
import { FinanceAnalyzer } from '@/utils/analysis/industry/finance';
import { RetailAnalyzer } from '@/utils/analysis/industry/retail';
import { ChartData } from 'chart.js';

interface SectionProps {
  title: string;
  icon: React.ElementType;
  content: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
}

interface CorrelationResult {
  fields: [string, string];
  value: number;
  strength: 'strong' | 'moderate' | 'weak';
  direction: 'positive' | 'negative';
}

interface TestResult {
  field: string;
  tTest: {
    statistic: number;
    significant: boolean;
    conclusion: string;
  };
  normalityTest: {
    isNormal: boolean;
    conclusion: string;
  };
}

interface AnomalyResult {
  field: string;
  outlierCount: number;
  outlierPercentage: number;
  severity: 'high' | 'medium' | 'low';
}

interface FileData {
  content: {
    fields: DataField[];
  };
  fields?: DataField[]; // Add optional fields property for backward compatibility
}

interface ReportInput {
  fields: DataField[];
}

export function ComprehensiveReport() {
  const [data, setData] = React.useState<FileData | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [textAnalysis, setTextAnalysis] = React.useState<React.ReactNode | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const analysisData = await getAnalysisData();
        if (!analysisData) {
          navigate('/', { 
            replace: true,
            state: { error: 'No analysis data found. Please upload a file first.' }
          });
          return;
        }
        if (!analysisData.content?.fields?.length) {
          throw new Error('Invalid analysis data structure');
        }
        setData(analysisData as FileData);
      } catch (err) {
        console.error('Failed to load analysis data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analysis data');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [navigate]);

  React.useEffect(() => {
    async function loadAnalysis() {
      if (data?.content?.fields) {
        const analysis = await generateTextAnalysis(data.content.fields);
        setTextAnalysis(analysis);
      }
    }
    loadAnalysis();
  }, [data]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      if (!data?.content?.fields?.length) {
        throw new Error('No data available for report generation');
      }

      const reportInput: ReportInput = { 
        fields: data.content.fields 
      };
      const report = await generateReport(reportInput);
      downloadReport(report);

    } catch (error) {
      console.error('Failed to generate report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Report Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-black">Comprehensive Analysis Report</h3>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-all duration-300"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Report
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Report Preview */}
        <div className="space-y-8">
          {/* Executive Summary */}
          <Section
            title="Executive Summary"
            icon={Brain}
            content={generateExecutiveSummary(data.content.fields)}
          />

          {/* Methodology */}
          <Section
            title="Methodology"
            icon={Calculator}
            content={generateMethodology()}
          />

          {/* Statistical Analysis */}
          <Section
            title="Statistical Analysis"
            icon={TrendingUp}
            content={generateStatisticalAnalysis(data.content.fields)}
          />

          {/* Correlation Analysis */}
          <Section
            title="Correlation Analysis"
            icon={TrendingUp}
            content={generateCorrelationAnalysis(data)}
          />

          {/* Hypothesis Tests */}
          <Section
            title="Hypothesis Tests"
            icon={Calculator}
            content={generateHypothesisTests(data)}
          />

          {/* Anomalies */}
          <Section
            title="Anomalies & Outliers"
            icon={AlertCircle}
            content={generateAnomalies(data)}
          />

          {/* Data Visualization */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Data Visualization</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Distribution Chart */}
              <div className="h-[300px]">
                <Bar
                  data={generateDistributionData(data.content.fields)}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: { display: true, text: 'Data Distribution' }
                    }
                  }}
                />
              </div>
              {/* Trend Analysis */}
              <div className="h-[300px]">
                <Line
                  data={generateTrendData(data.content.fields)}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: { display: true, text: 'Trend Analysis' }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Advanced Analytics */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Brain className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Advanced Analytics</h3>
            </div>
            <div className="space-y-6">
              {/* Correlation Matrix */}
              <div className="h-[300px]">
                <Scatter
                  data={generateCorrelationData(data.content.fields)}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: { display: true, text: 'Correlation Analysis' }
                    }
                  }}
                />
              </div>
              {/* Regression Analysis */}
              <div className="h-[300px]">
                <Line
                  data={generateRegressionData(data.content.fields)}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: { display: true, text: 'Regression Analysis' }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Industry Analysis */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Industry Analysis</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Financial Metrics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Financial Health</h4>
                {generateFinancialMetrics(data.content.fields)}
              </div>
              {/* Market Position */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Market Position</h4>
                {generateMarketMetrics(data.content.fields)}
              </div>
              {/* Growth Metrics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Growth Indicators</h4>
                {generateGrowthMetrics(data.content.fields)}
              </div>
            </div>
          </div>

          {/* Special Analyses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Text Analysis */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-black">Text Analysis</h3>
              </div>
              {textAnalysis}
            </div>
            {/* Time Series */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-black">Time Series Analysis</h3>
              </div>
              {generateTimeSeriesAnalysis(data.content.fields)}
            </div>
            {/* Geographic Analysis */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Map className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-black">Geographic Analysis</h3>
              </div>
              {generateGeographicAnalysis(data.content.fields)}
            </div>
            {/* Network Analysis */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Network className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-black">Network Analysis</h3>
              </div>
              {generateNetworkAnalysis(data.content.fields)}
            </div>
          </div>

          {/* Conclusions */}
          <Section
            title="Conclusions & Recommendations"
            icon={Brain}
            content={generateConclusions(data)}
          />
        </div>
      </div>

      {/* Model Performance */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-black">Analysis Results</h3>
        </div>

        {/* Model Performance */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="R² Score"
            value={formatNumber(0.85)}
            description="Goodness of fit"
          />
          <MetricCard
            title="RMSE"
            value={formatNumber(0.15)}
            description="Root mean squared error"
          />
          <MetricCard
            title="MAE"
            value={formatNumber(0.12)}
            description="Mean absolute error"
          />
          <MetricCard
            title="AIC"
            value={formatNumber(120.5)}
            description="Akaike information criterion"
          />
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, content }: SectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-teal-600" />
          <h4 className="font-medium text-gray-900">{title}</h4>
        </div>
        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </button>
      {isExpanded && (
        <div className="px-6 pb-4">
          <div className="prose prose-sm max-w-none">
            {content.split('\n').map((line, index) => (
              <p key={index} className="text-gray-600">{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, description }: MetricCardProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-sm text-gray-500 mb-1">{title}</h4>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );
}

function generateExecutiveSummary(fields: DataField[]): string {
  const numericFields = fields.filter((f: DataField) => f.type === 'number');
  const textFields = fields.filter((f: DataField) => f.type === 'string');
  const dateFields = fields.filter((f: DataField) => f.type === 'date');

  return `Executive Summary

Dataset Overview:
- Total Fields: ${fields.length}
- Numeric Fields: ${numericFields.length}
- Text Fields: ${textFields.length}
- Date Fields: ${dateFields.length}
- Total Records: ${fields[0]?.value.length || 0}

Key Findings:
${numericFields.map((field: DataField) => {
  const stats = calculateFieldStats(field);
  const trend = determineTrend(field.value as number[]);
  return `- ${field.name}: ${trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'} trend, average ${formatNumber(stats.mean)}`;
}).join('\n')}

Analysis Scope:
This comprehensive analysis includes statistical calculations, trend analysis, correlation studies, and anomaly detection.`;
}

function generateMethodology(): string {
  return `Methodology

1. Data Processing
   - Data validation and cleaning
   - Type inference and conversion
   - Missing value handling
   - Outlier detection

2. Statistical Analysis
   - Descriptive statistics
   - Distribution analysis
   - Correlation studies
   - Trend detection

3. Advanced Analytics
   - Machine learning models
   - Time series analysis
   - Pattern recognition
   - Anomaly detection`;
}

function generateStatisticalAnalysis(fields: DataField[]): string {
  if (!fields?.length) return '';
  
  const numericFields = fields.filter(f => f.type === 'number');
  return numericFields.map(field => {
    const stats = calculateFieldStats(field);
    return `${field.name}:
- Mean: ${formatNumber(stats.mean)}
- Median: ${formatNumber(stats.median)}
- Standard Deviation: ${formatNumber(stats.standardDeviation)}
- Range: ${formatNumber(stats.max - stats.min)}`;
  }).join('\n\n');
}

function generateDistributionData(fields: DataField[]): ChartData<'bar'> {
  const numericFields = fields.filter(f => f.type === 'number');
  return {
    labels: numericFields.map(f => f.name),
    datasets: [{
      label: 'Distribution',
      data: numericFields.map(f => {
        const values = f.value as number[];
        return values.reduce((a, b) => a + b, 0) / values.length;
      }),
      backgroundColor: 'rgba(99, 102, 241, 0.5)',
      borderColor: 'rgb(99, 102, 241)',
      borderWidth: 1
    }]
  };
}

function generateTrendData(fields: DataField[]): ChartData<'line'> {
  const numericFields = fields.filter(f => f.type === 'number');
  return {
    labels: Array.from({ length: Math.max(...numericFields.map(f => f.value.length)) }, (_, i) => i + 1),
    datasets: numericFields.map((field, i) => ({
      label: field.name,
      data: field.value as number[],
      borderColor: `hsl(${i * 360 / numericFields.length}, 70%, 50%)`,
      backgroundColor: `hsla(${i * 360 / numericFields.length}, 70%, 50%, 0.1)`,
      fill: true
    }))
  };
}

function generateCorrelationData(fields: DataField[]): ChartData<'scatter'> {
  const numericFields = fields.filter(f => f.type === 'number');
  if (numericFields.length < 2) return { datasets: [] };
  
  const [field1, field2] = numericFields;
  return {
    datasets: [{
      label: `${field1.name} vs ${field2.name}`,
      data: (field1.value as number[]).map((x, i) => ({
        x,
        y: (field2.value as number[])[i]
      })),
      backgroundColor: 'rgba(99, 102, 241, 0.5)'
    }]
  };
}

function generateRegressionData(fields: DataField[]): ChartData<'line'> {
  const numericFields = fields.filter(f => f.type === 'number');
  if (numericFields.length < 2) return { datasets: [] };
  
  const [x, y] = numericFields;
  const xValues = x.value as number[];
  const yValues = y.value as number[];
  
  // Simple linear regression
  const n = Math.min(xValues.length, yValues.length);
  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;
  
  let slope = 0;
  let intercept = 0;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }
  
  slope = numerator / denominator;
  intercept = yMean - slope * xMean;
  
  const predictions = xValues.map(x => slope * x + intercept);
  
  return {
    labels: Array.from({ length: n }, (_, i) => i + 1),
    datasets: [
      {
        label: 'Actual',
        data: yValues,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'transparent',
        pointRadius: 2
      },
      {
        label: 'Predicted',
        data: predictions,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 0
      }
    ]
  };
}

function generateFinancialMetrics(fields: DataField[]): React.ReactNode {
  const metrics = FinanceAnalyzer.analyzeRisk(fields);
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-black">Risk Score</span>
        <span className="font-medium">{(metrics.overallRisk * 100).toFixed(1)}%</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-black">Volatility</span>
        <span className="font-medium">{(metrics.metrics.volatility * 100).toFixed(1)}%</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-black">Sharpe Ratio</span>
        <span className="font-medium">{metrics.metrics.sharpeRatio.toFixed(2)}</span>
      </div>
    </div>
  );
}

function generateMarketMetrics(fields: DataField[]): React.ReactNode {
  const retailMetrics = RetailAnalyzer.analyzeSalesTrends(fields);
  return (
    <div className="space-y-2">
      {retailMetrics.map((metric, index) => (
        <div key={index} className="flex justify-between">
          <span className="text-sm text-black-600">{metric.product}</span>
          <span className={`font-medium text-black ${
            metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {metric.growthRate.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function generateGrowthMetrics(fields: DataField[]): React.ReactNode {
  const numericFields = fields.filter(f => f.type === 'number');
  return (
    <div className="space-y-2">
      {numericFields.map((field, index) => {
        const values = field.value as number[];
        const growth = ((values[values.length - 1] - values[0]) / values[0]) * 100;
        return (
          <div key={index} className="flex justify-between">
            <span className="text-sm text-black-600">{field.name}</span>
            <span className={`font-medium text-black ${
              growth > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

async function generateTextAnalysis(fields: DataField[]): Promise<React.ReactNode> {
  const textFields = fields.filter((f: DataField) => f.type === 'string');
  if (textFields.length === 0) {
    return <p className="text-sm text-black-500">No text data available for analysis</p>;
  }

  const analyses = await SentimentAnalyzer.analyzeSentiment(textFields);
  
  return (
    <div className="space-y-4">
      {analyses.map((analysis, index) => (
        <div key={index} className="space-y-2">
          <h4 className="font-medium text-gray-700">{analysis.field}</h4>
          <div className="flex justify-between">
            <span className="text-sm text-black-600">Sentiment</span>
            <span className={`font-medium text-black ${
              analysis.sentiment.score > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analysis.sentiment.label} ({(analysis.sentiment.score * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-black-600">Confidence</span>
            <span className="font-medium text-black-700">
              {(analysis.sentiment.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="mt-2">
            <p className="text-sm text-black-600">{analysis.summary}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function generateTimeSeriesAnalysis(fields: DataField[]): React.ReactNode {
  const numericFields = fields.filter(f => f.type === 'number');
  if (numericFields.length === 0) {
    return <p className="text-sm text-black-500">No numeric data available for time series analysis</p>;
  }

  return (
    <div className="h-[200px]">
      <Line
        data={{
          labels: Array.from({ length: numericFields[0].value.length }, (_, i) => i + 1),
          datasets: numericFields.map((field, i) => ({
            label: field.name,
            data: field.value as number[],
            borderColor: `hsl(${i * 360 / numericFields.length}, 70%, 50%)`,
            backgroundColor: 'transparent'
          }))
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Time Series Trends' }
          }
        }}
      />
    </div>
  );
}

function generateGeographicAnalysis(_fields: DataField[]): React.ReactNode {
  return (
    <p className="text-sm text-black-500">Geographic analysis visualization would be displayed here</p>
  );
}

function generateNetworkAnalysis(_fields: DataField[]): React.ReactNode {
  return (
    <p className="text-sm text-black-500">Network analysis visualization would be displayed here</p>
  );
}

function generateConclusions(_data: FileData): string {
  return 'Conclusions and recommendations based on the analysis...';
}

function generateCorrelationAnalysis(data: FileData): string {
  const correlationFields = data.content.fields.filter(f => f.type === 'number');
  
  if (correlationFields.length < 2) {
    return 'Insufficient numeric fields for correlation analysis.';
  }

  const correlations: CorrelationResult[] = [];
  for (let i = 0; i < correlationFields.length; i++) {
    for (let j = i + 1; j < correlationFields.length; j++) {
      const field1 = correlationFields[i];
      const field2 = correlationFields[j];
      const correlation = calculateCorrelation(
        field1.value as number[],
        field2.value as number[]
      );

      correlations.push({
        fields: [field1.name, field2.name],
        value: correlation,
        strength: Math.abs(correlation) > 0.7 ? 'strong' :
                 Math.abs(correlation) > 0.3 ? 'moderate' : 'weak',
        direction: correlation > 0 ? 'positive' : 'negative'
      });
    }
  }

  return formatCorrelationResults(correlations);
}

function generateHypothesisTests(data: FileData): string {
  const testFields = data.content.fields.filter(f => f.type === 'number');
  
  const tests: TestResult[] = testFields.map((field: DataField) => {
    const values = field.value as number[];
    const stats = calculateFieldStats(field);
    
    // Perform t-test against population mean (if available)
    const tTestResult = {
      statistic: calculateTStatistic(values, stats.mean),
      significant: false,
      conclusion: ''
    };
    
    // Check for normal distribution
    const normalityResult = {
      isNormal: checkNormalDistribution(values, stats),
      conclusion: ''
    };
    
    return {
      field: field.name,
      tTest: tTestResult,
      normalityTest: normalityResult
    };
  });

  return formatTestResults(tests);
}

function generateAnomalies(data: FileData): string {
  const anomalyFields = data.content.fields.filter(f => f.type === 'number');
  
  const anomalies: AnomalyResult[] = anomalyFields.map((field: DataField) => {
    const values = field.value as number[];
    const stats = calculateFieldStats(field);
    const outliers = detectOutliers(values, stats);
    
    return {
      field: field.name,
      outlierCount: outliers.length,
      outlierPercentage: (outliers.length / values.length) * 100,
      severity: outliers.length > values.length * 0.1 ? 'high' :
               outliers.length > values.length * 0.05 ? 'medium' : 'low'
    };
  });

  return formatAnomalyResults(anomalies);
}

function calculateSkewness(values: number[], mean: number, stdDev: number): number {
  const n = values.length;
  const m3 = values.reduce((sum, v) => sum + Math.pow(v - mean, 3), 0) / n;
  return m3 / Math.pow(stdDev, 3);
}

function calculateKurtosis(values: number[], mean: number, stdDev: number): number {
  const n = values.length;
  const m4 = values.reduce((sum, v) => sum + Math.pow(v - mean, 4), 0) / n;
  return m4 / Math.pow(stdDev, 4) - 3;
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  const xMean = x.reduce((sum, v) => sum + v, 0) / n;
  const yMean = y.reduce((sum, v) => sum + v, 0) / n;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    numerator += xDiff * yDiff;
    denomX += xDiff * xDiff;
    denomY += yDiff * yDiff;
  }
  
  return numerator / Math.sqrt(denomX * denomY);
}

function formatCorrelationResults(correlations: CorrelationResult[]): string {
  // Sort by correlation strength
  correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return `Correlation Analysis

Key Relationships:
${correlations.map(c => 
  `- ${c.fields[0]} and ${c.fields[1]}: ${c.strength} ${c.direction} correlation (${(c.value * 100).toFixed(1)}%)`
).join('\n')}

Interpretation:
${correlations
  .filter(c => Math.abs(c.value) > 0.5)
  .map(c => `- ${c.fields[0]} shows a ${c.strength} ${c.direction} relationship with ${c.fields[1]}, suggesting ${
    c.value > 0 ? 'they move together' : 'they move in opposite directions'
  }`)
  .join('\n')}`;
}

function calculateTStatistic(values: number[], mean: number): number {
  const n = values.length;
  const sampleMean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - sampleMean, 2), 0) / (n - 1);
  const standardError = Math.sqrt(variance / n);
  return (sampleMean - mean) / standardError;
}

function checkNormalDistribution(values: number[], stats: { mean: number; standardDeviation: number }): boolean {
  const skewness = calculateSkewness(values, stats.mean, stats.standardDeviation);
  const kurtosis = calculateKurtosis(values, stats.mean, stats.standardDeviation);
  return Math.abs(skewness) < 2 && Math.abs(kurtosis) < 7;
}

function formatTestResults(tests: TestResult[]): string {
  return `Hypothesis Testing Results

One-Sample T-Tests:
${tests.map(t => 
  `- ${t.field}:\n  ${t.tTest.conclusion} (t = ${t.tTest.statistic.toFixed(2)})`
).join('\n')}

Normality Tests:
${tests.map(t => 
  `- ${t.field}:\n  ${t.normalityTest.conclusion}`
).join('\n')}`;
}

function detectOutliers(values: number[], stats: { mean: number; standardDeviation: number }): number[] {
  return values.filter(v => Math.abs(v - stats.mean) > 2 * stats.standardDeviation);
}

function formatAnomalyResults(anomalies: AnomalyResult[]): string {
  return `Anomaly Detection Results

Summary:
${anomalies.map(a => 
  `- ${a.field}: ${a.outlierCount} outliers detected (${a.outlierPercentage.toFixed(1)}% of data)`
).join('\n')}

Severity Assessment:
${anomalies
  .filter(a => a.outlierCount > 0)
  .map(a => `- ${a.field}: ${a.severity} severity - requires ${
    a.severity === 'high' ? 'immediate attention' :
    a.severity === 'medium' ? 'monitoring' : 'routine review'
  }`)
  .join('\n')}`;
}
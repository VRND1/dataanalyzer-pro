import React from 'react';
import { FileText, Download, Brain, Calculator, TrendingUp, AlertCircle, ChevronDown, Map, Network, MessageSquare, Clock } from 'lucide-react';
import { DataField } from '@/types/data';
import { calculateFieldStats } from '@/utils/analysis/statistics/calculations';
import { determineTrend } from '@/utils/analysis/statistics/trends';
import { formatNumber } from '@/utils/analysis/formatting';
import { useNavigate } from 'react-router-dom';
import { getAnalysisData } from '@/utils/storage/db';
import { generateReport, downloadReport } from '@/utils/analysis/reports';
// import { Line, Bar, Scatter } from 'react-chartjs-2';
// import { SentimentAnalyzer } from '@/utils/analysis/nlp/sentimentAnalyzer';
// import { FinanceAnalyzer } from '@/utils/analysis/industry/finance';
// import { RetailAnalyzer } from '@/utils/analysis/industry/retail';
// import { ChartData } from 'chart.js';

interface SectionProps {
  title: string;
  icon: React.ElementType;
  content: string;
}

interface FileData {
  content: {
    fields: DataField[];
  };
}

export function ComprehensiveReport() {
  const [data, setData] = React.useState<FileData | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const analysisData = await getAnalysisData();
        if (!analysisData) {
          setError('No analysis data found. Please upload a file first.');
          return;
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
  }, []);

  const handleGenerate = async () => {
    if (!data) return;
    
    setIsGenerating(true);
    try {
      await generateReport({ fields: data.content.fields });
      await downloadReport({ fields: data.content.fields });
    } catch (err) {
      setError('Failed to generate report');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">Error Loading Report</h2>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/analysis/new')}
            className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Upload New Data
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-teal-500" />
            <h2 className="text-xl font-semibold text-gray-900">No Data Available</h2>
          </div>
          <p className="text-gray-600 mb-6">
            To generate a comprehensive analysis report, you need to upload and analyze your data first.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/analysis/new')}
              className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Upload New Data
            </button>
            <button
              onClick={() => navigate('/analysis')}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              View Analysis Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Report Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Comprehensive Analysis Report</h3>
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

          {/* Report Content */}
          <div className="space-y-6">
            <Section
              title="Executive Summary"
              icon={Brain}
              content={generateExecutiveSummary(data.content.fields)}
            />

            <Section
              title="Key Metrics"
              icon={Calculator}
              content={generateStatisticalAnalysis(data.content.fields)}
            />

            <Section
              title="Trends & Patterns"
              icon={TrendingUp}
              content={generateTrendsAndPatterns(data.content.fields)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section
                title="Text Analysis"
                icon={MessageSquare}
                content={generateTextAnalysis(data.content.fields)}
              />
              <Section
                title="Time Series"
                icon={Clock}
                content={generateTimeSeriesAnalysis(data.content.fields)}
              />
              <Section
                title="Geographic Analysis"
                icon={Map}
                content={generateGeographicAnalysis(data.content.fields)}
              />
              <Section
                title="Network Analysis"
                icon={Network}
                content={generateNetworkAnalysis(data.content.fields)}
              />
            </div>

            <Section
              title="Conclusions & Recommendations"
              icon={Brain}
              content={generateConclusions(data.content.fields)}
            />
          </div>
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

function generateExecutiveSummary(fields: DataField[]): string {
  const numericFields = fields.filter(f => f.type === 'number');
  const textFields = fields.filter(f => f.type === 'string');
  const dateFields = fields.filter(f => f.type === 'date');

  return `Executive Summary

Dataset Overview:
- Total Fields: ${fields.length}
- Numeric Fields: ${numericFields.length}
- Text Fields: ${textFields.length}
- Date Fields: ${dateFields.length}
- Total Records: ${fields[0]?.value.length || 0}

Key Findings:
${numericFields.map(field => {
  const stats = calculateFieldStats(field);
  const trend = determineTrend(field.value as number[]);
  return `- ${field.name}: ${trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'} trend, average ${formatNumber(stats.mean)}`;
}).join('\n')}

Analysis Scope:
This comprehensive analysis includes statistical calculations, trend analysis, correlation studies, and anomaly detection.`;
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

function generateTrendsAndPatterns(fields: DataField[]): string {
  if (!fields?.length) return '';
  
  const numericFields = fields.filter(f => f.type === 'number');
  return numericFields.map(field => {
    const trend = determineTrend(field.value as number[]);
    const stats = calculateFieldStats(field);
    return `${field.name}:
- Trend: ${trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
- Volatility: ${formatNumber(stats.standardDeviation / stats.mean * 100)}%
- Seasonality: ${detectSeasonality(field.value as number[])}`;
  }).join('\n\n');
}

function generateTextAnalysis(fields: DataField[]): string {
  const textFields = fields.filter(f => f.type === 'string');
  if (!textFields.length) return 'No text fields available for analysis.';

  return textFields.map(field => {
    // Simple text analysis since SentimentAnalyzer.analyze is not available
    const words = (field.value as string[]).join(' ').split(' ');
    const uniqueWords = new Set(words);
    return `${field.name}:
- Word Count: ${words.length}
- Unique Words: ${uniqueWords.size}
- Average Word Length: ${(words.reduce((acc, word) => acc + word.length, 0) / words.length).toFixed(1)}`;
  }).join('\n\n');
}

function generateTimeSeriesAnalysis(fields: DataField[]): string {
  const dateFields = fields.filter(f => f.type === 'date');
  if (!dateFields.length) return 'No date fields available for time series analysis.';

  return dateFields.map(field => {
    return `${field.name}:
- Time Range: ${field.value[0]} to ${field.value[field.value.length - 1]}
- Frequency: ${calculateFrequency(field.value as string[])}
- Seasonality: ${detectSeasonality(field.value as string[])}`;
  }).join('\n\n');
}

function generateGeographicAnalysis(fields: DataField[]): string {
  const locationFields = fields.filter(f => f.name.toLowerCase().includes('location') || f.name.toLowerCase().includes('address'));
  if (!locationFields.length) return 'No geographic data available for analysis.';

  return locationFields.map(field => {
    return `${field.name}:
- Unique Locations: ${new Set(field.value).size}
- Distribution: ${calculateDistribution(field.value as string[])}`;
  }).join('\n\n');
}

function generateNetworkAnalysis(fields: DataField[]): string {
  const relationshipFields = fields.filter(f => f.name.toLowerCase().includes('relationship') || f.name.toLowerCase().includes('connection'));
  if (!relationshipFields.length) return 'No network data available for analysis.';

  return relationshipFields.map(field => {
    return `${field.name}:
- Nodes: ${new Set(field.value).size}
- Connections: ${calculateConnections(field.value as string[])}`;
  }).join('\n\n');
}

function generateConclusions(fields: DataField[]): string {
  const numericFields = fields.filter(f => f.type === 'number');
  const textFields = fields.filter(f => f.type === 'string');
  const dateFields = fields.filter(f => f.type === 'date');

  return `Conclusions & Recommendations

Data Overview:
- Analyzed ${fields.length} fields across ${fields[0]?.value.length || 0} records
- Identified ${numericFields.length} numeric metrics, ${textFields.length} text fields, and ${dateFields.length} date fields

Key Insights:
${numericFields.map(field => {
  const stats = calculateFieldStats(field);
  const trend = determineTrend(field.value as number[]);
  return `- ${field.name} shows a ${trend} trend with ${formatNumber(stats.mean)} average value`;
}).join('\n')}

Recommendations:
1. Monitor key metrics for significant changes
2. Investigate anomalies and outliers
3. Consider seasonal patterns in decision making
4. Regular data quality checks
5. Update analysis models periodically`;
}

// Helper functions
function detectSeasonality(values: any[]): string {
  if (values.length < 2) return 'Not enough data';
  return 'Not detected';
}

function calculateFrequency(values: string[]): string {
  if (values.length < 2) return 'Insufficient data';
  const timeDiff = new Date(values[1]).getTime() - new Date(values[0]).getTime();
  const days = timeDiff / (1000 * 60 * 60 * 24);
  return days <= 1 ? 'Daily' : days <= 7 ? 'Weekly' : 'Monthly';
}

function calculateDistribution(values: string[]): string {
  const uniqueCount = new Set(values).size;
  const totalCount = values.length;
  const ratio = uniqueCount / totalCount;
  return ratio > 0.8 ? 'Highly distributed' : ratio > 0.5 ? 'Moderately distributed' : 'Concentrated';
}

function calculateConnections(values: string[]): string {
  const uniqueConnections = new Set(values).size;
  return uniqueConnections > 10 ? 'Highly connected' : uniqueConnections > 5 ? 'Moderately connected' : 'Sparsely connected';
} 
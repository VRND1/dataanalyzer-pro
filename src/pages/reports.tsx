import React from "react";
//import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Download,
  Share2,
  Clock,
  Filter,
  Search,
  Plus,
  Brain,
  Calculator,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  Map,
  Network,
  MessageSquare,
} from "lucide-react";
import { FloatingNav } from "@/components/layout/FloatingNav";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { DataField } from '@/types/data';
import { calculateFieldStats } from '@/utils/analysis/statistics/calculations';
import { determineTrend } from '@/utils/analysis/statistics/trends';
import { formatNumber } from '@/utils/analysis/formatting';
import { getAnalysisData } from '@/utils/storage/db';
import { generateReport, downloadReport } from '@/utils/analysis/reports';

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

export function Reports() {
  const navigate = useNavigate();
  const [data, setData] = React.useState<FileData | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

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

  const reports = [
    {
      title: "Monthly Sales Analysis",
      description: "Comprehensive analysis of monthly sales performance",
      date: "2024-03-15",
      type: "Sales",
      icon: FileText,
      color: "blue",
    },
    {
      title: "Customer Behavior Report",
      description: "Detailed insights into customer purchasing patterns",
      date: "2024-03-14",
      type: "Customer",
      icon: FileText,
      color: "purple",
    },
    {
      title: "Inventory Status",
      description: "Current inventory levels and stock predictions",
      date: "2024-03-13",
      type: "Inventory",
      icon: FileText,
      color: "green",
    },
    {
      title: "Marketing Campaign Results",
      description: "Performance metrics of recent marketing campaigns",
      date: "2024-03-12",
      type: "Marketing",
      icon: FileText,
      color: "orange",
    },
  ];

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
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-white relative overflow-hidden">
      <DashboardHeader />
      <div className="flex-1 flex items-center justify-center pb-12">
        <FloatingNav />
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[1200px] h-[1200px] -top-[600px] -left-[600px] bg-gradient-to-r from-blue-500/50 to-indigo-500/50 rounded-full mix-blend-overlay animate-blob"></div>
          <div className="absolute w-[1000px] h-[1000px] top-[100px] right-[100px] bg-gradient-to-l from-purple-500/50 to-pink-500/50 rounded-full mix-blend-overlay animate-blob animation-delay-2000"></div>
          <div className="absolute w-[900px] h-[900px] bottom-[-300px] left-[20%] bg-gradient-to-t from-blue-500/50 to-green-500/50 rounded-full mix-blend-overlay animate-blob animation-delay-4000"></div>

          {/* Grid Background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDBNIDAgMjAgTCA0MCAyMCBNIDIwIDAgTCAyMCA0ME0gMCAzMCBMIDQwIDMwIE0gMzAgMCBMIDMwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxRTI5M0IiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-10"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4 animate-fade-in">
              Reports
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8 animate-fade-in animation-delay-300">
              Access and manage your analysis reports
            </p>

            {/* Search and Filter Bar */}
            <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 mb-8 flex items-center gap-4">
              <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  className="bg-transparent border-none outline-none text-white placeholder-gray-400 w-full"
                />
              </div>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Filter className="w-5 h-5 text-gray-400" />
              </button>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Plus className="w-5 h-5" />
                New Report
              </button>
            </div>

            {/* Reports Grid */}
            <div className="mt-8 w-full px-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5 w-full">
                {reports.map((report) => (
                  <button
                    key={report.title}
                    className="group bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10 transition-all text-left w-full h-full flex flex-col hover:bg-white/10 hover:border-blue-500/50"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r from-${report.color}-500/20 to-${report.color}-500/20 text-white flex-shrink-0`}>
                        <report.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-lg truncate">
                          {report.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {report.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{report.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <Share2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Comprehensive Report Section */}
            <div className="mt-12 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <h3 className="text-lg font-semibold text-white">Comprehensive Analysis Report</h3>
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
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, content }: SectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="border border-white/10 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-teal-600" />
          <h4 className="font-medium text-white">{title}</h4>
        </div>
        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </button>
      {isExpanded && (
        <div className="px-6 pb-4">
          <div className="prose prose-sm max-w-none">
            {content.split('\n').map((line, index) => (
              <p key={index} className="text-gray-300">{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
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

export default Reports; 
import { Brain, AlertCircle, Loader2, HelpCircle, RefreshCw, Download, Share2, Eye, EyeOff } from 'lucide-react';
import { ChartView } from '@/components/visualization/ChartView';
import type { DataField } from '@/types/data';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ScatterController,
  PieController,
  ArcElement,
  RadarController,
  RadialLinearScale
} from 'chart.js';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ScatterController,
  PieController,
  ArcElement,
  RadarController,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

type VisualizationType = 'bar' | 'line' | 'scatter' | 'pie' | 'radar';

interface VisualizationConfig {
  type: VisualizationType;
  title?: string;
  description?: string;
  confidence?: number; // 0-1 scale for AI confidence
  dataQuality?: 'high' | 'medium' | 'low';
  suggestedTypes?: VisualizationType[];
}

interface ResponseData {
  answer: string;
  data?: DataField[];
  visualization?: VisualizationConfig;
  error?: string;
  sources?: { title: string; url: string; confidence?: number; lastUpdated?: string }[];
  followUpQuestions?: string[];
  confidence?: number;
  processingTime?: number;
  dataValidation?: {
    isValid: boolean;
    warnings?: string[];
    errors?: string[];
  };
}

interface NLQueryResponseProps {
  response: ResponseData | null;
  isLoading?: boolean;
  onFollowUp?: (question: string) => void;
  onRetry?: () => void;
  onExport?: (format: 'csv' | 'json' | 'png') => void;
  onShare?: () => void;
  showConfidence?: boolean;
}

export function NLQueryResponse({ 
  response, 
  isLoading, 
  onFollowUp, 
  onRetry,
  onExport,
  onShare,
  showConfidence = true
}: NLQueryResponseProps) {
  const [showSources, setShowSources] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<VisualizationType | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [dataValidationExpanded, setDataValidationExpanded] = useState(false);

  // Memoize chart type options based on data structure
  const availableChartTypes = useMemo(() => {
    if (!response?.data || response.data.length === 0) return [];
    
    const dataKeys = Object.keys(response.data[0]);
    const numericKeys = dataKeys.filter(key => 
      response.data?.every(row => {
        const value = (row as Record<string, any>)[key];
        return typeof value === 'number' || !isNaN(Number(value));
      })
    );
    
    const types: VisualizationType[] = [];
    
    // Always available
    types.push('bar', 'line');
    
    // Scatter requires at least 2 numeric columns
    if (numericKeys.length >= 2) {
      types.push('scatter');
    }
    
    // Pie works well with categorical data
    if (dataKeys.length >= 2 && response.data.length <= 20) {
      types.push('pie');
    }
    
    // Radar requires multiple numeric dimensions
    if (numericKeys.length >= 3) {
      types.push('radar');
    }
    
    return types;
  }, [response?.data]);

  useEffect(() => {
    if (response?.visualization) {
      const suggestedType = response.visualization.type;
      // Only set if the suggested type is available for this data
      if (availableChartTypes.includes(suggestedType)) {
        setSelectedChartType(suggestedType);
      } else if (availableChartTypes.length > 0) {
        setSelectedChartType(availableChartTypes[0]);
      }
    }
    setChartError(null);
  }, [response, availableChartTypes]);

  const handleChartTypeChange = useCallback((type: VisualizationType) => {
    setSelectedChartType(type);
    setChartError(null);
  }, []);

  const handleChartError = useCallback((error: string) => {
    setChartError(error);
  }, []);

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return 'Unknown';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const exportData = useCallback((format: 'csv' | 'json' | 'png') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export behavior
      if (response?.data && format === 'json') {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data.json';
        link.click();
        URL.revokeObjectURL(url);
      }
    }
  }, [response?.data, onExport]);

  if (!response && !isLoading) return null;

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
          <span className="text-gray-600">Processing your query...</span>
        </div>
        <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
          <div className="bg-teal-500 h-full rounded-full animate-pulse w-2/3"></div>
        </div>
      </div>
    );
  }

  if (response?.error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">Error Processing Query</p>
            <p className="text-red-600 mt-1 text-sm">{response.error}</p>
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry}
                  className="text-red-700 border-red-300 hover:bg-red-50"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Retry
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="text-red-700 border-red-300 hover:bg-red-50"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!response) return null;

  return (
    <TooltipProvider>
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        {/* Header with confidence and actions */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-teal-600" />
              <h3 className="font-medium text-gray-900">AI Response</h3>
              {showConfidence && response.confidence && (
                <span className={`text-xs px-2 py-1 rounded-full bg-white ${getConfidenceColor(response.confidence)}`}>
                  {getConfidenceLabel(response.confidence)} Confidence ({Math.round(response.confidence * 100)}%)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {response.processingTime && (
                <span className="text-xs text-gray-500">
                  {response.processingTime}ms
                </span>
              )}
              {onShare && (
                <TooltipComponent>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={onShare}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share response</TooltipContent>
                </TooltipComponent>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Data validation warnings */}
          {response.dataValidation && (!response.dataValidation.isValid || response.dataValidation.warnings?.length) && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <button
                    onClick={() => setDataValidationExpanded(!dataValidationExpanded)}
                    className="flex items-center gap-2 text-yellow-800 font-medium hover:text-yellow-900"
                  >
                    Data Quality Notice
                    {dataValidationExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {dataValidationExpanded && (
                    <div className="mt-2 space-y-1">
                      {response.dataValidation.warnings?.map((warning, index) => (
                        <p key={index} className="text-sm text-yellow-700">• {warning}</p>
                      ))}
                      {response.dataValidation.errors?.map((error, index) => (
                        <p key={index} className="text-sm text-red-700">• {error}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Answer Section */}
          <div className="prose prose-teal max-w-none">
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {response.answer}
            </div>
          </div>

          {/* Visualization Section */}
          {response.data && response.visualization && (
            <div className="bg-gray-50 border rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {response.visualization.title || 'Data Visualization'}
                    </h4>
                    {response.visualization.description && (
                      <p className="text-sm text-gray-500 mt-1">{response.visualization.description}</p>
                    )}
                    {response.visualization.dataQuality && (
                      <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                        response.visualization.dataQuality === 'high' ? 'bg-green-100 text-green-700' :
                        response.visualization.dataQuality === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {response.visualization.dataQuality} quality data
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TooltipComponent>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRawData(!showRawData)}
                        >
                          {showRawData ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                          {showRawData ? 'Hide Data' : 'View Data'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {showRawData ? 'Hide raw data table' : 'View raw data in table format'}
                      </TooltipContent>
                    </TooltipComponent>
                    
                    <TooltipComponent>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportData('json')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export data as JSON</TooltipContent>
                    </TooltipComponent>
                  </div>
                </div>

                {/* Chart Type Selection */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {availableChartTypes.map((type) => (
                    <TooltipComponent key={type}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={selectedChartType === type ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleChartTypeChange(type)}
                          disabled={selectedChartType === type}
                          className={`${
                            response.visualization?.suggestedTypes?.includes(type) ? 'ring-2 ring-teal-200' : ''
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        View as {type} chart
                        {response.visualization?.suggestedTypes?.includes(type) && ' (Recommended)'}
                      </TooltipContent>
                    </TooltipComponent>
                  ))}
                </div>
              </div>

              <div className="p-4">
                {chartError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    Chart Error: {chartError}
                  </div>
                )}

                {showRawData ? (
                  <div className="overflow-auto max-h-96 border rounded">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          {Object.keys(response.data[0]).map((key) => (
                            <th
                              key={key}
                              scope="col"
                              className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {response.data.map((row, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {Object.values(row).map((value, i) => (
                              <td
                                key={i}
                                className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                              >
                                {value !== null && value !== undefined ? String(value) : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
                      Showing {response.data.length} rows
                    </div>
                  </div>
                ) : (
                  <div className="h-[400px] bg-white rounded border">
                    <ChartView
                      data={response.data}
                      type={selectedChartType || response.visualization.type}
                      title={response.visualization.title}
                      onError={handleChartError}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sources Section */}
          {response.sources && response.sources.length > 0 && (
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSources(!showSources)}
                className="text-gray-600 hover:bg-gray-100 mb-3"
              >
                {showSources ? 'Hide Sources' : `Show Sources (${response.sources.length})`}
              </Button>
              
              {showSources && (
                <div className="grid gap-3">
                  {response.sources.map((source, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border">
                      <div className="flex items-start justify-between">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:underline flex items-start gap-2 flex-1"
                        >
                          <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{source.title}</span>
                        </a>
                        <div className="flex items-center gap-2 ml-4">
                          {source.confidence && (
                            <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(source.confidence)} bg-white`}>
                              {Math.round(source.confidence * 100)}%
                            </span>
                          )}
                          {source.lastUpdated && (
                            <span className="text-xs text-gray-500">
                              {new Date(source.lastUpdated).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Follow-up Questions */}
          {response.followUpQuestions && response.followUpQuestions.length > 0 && onFollowUp && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Suggested follow-up questions</h4>
              <div className="grid gap-2">
                {response.followUpQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onFollowUp(question)}
                    className="text-left justify-start text-gray-700 hover:bg-gray-50 h-auto py-2 px-3"
                  >
                    <span className="text-sm">{question}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
} 
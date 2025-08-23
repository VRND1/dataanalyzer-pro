import { useState, useEffect, useMemo } from 'react';
import { Brain, HelpCircle, Sparkles, RotateCw, History, X, TrendingUp, BarChart3, PieChart, Zap, LucideIcon } from 'lucide-react';
import { NLQueryInput } from './NLQueryInput';
import { NLQueryResponse } from './NLQueryResponse';
import { processNaturalLanguageQuery } from '@/utils/analysis/nlp/queryProcessor';
import type { DataField } from '@/types/data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

// Extend DataField type to include additional properties
interface ExtendedDataField extends DataField {
  label?: string;
  key?: string;
  dataType?: string;
}

interface NLQuerySectionProps {
  data: {
    fields: ExtendedDataField[];
  };
  maxHistoryItems?: number;
  enableTemplates?: boolean;
  customExamples?: string[];
  onQuerySuccess?: (query: string, response: any) => void;
  onQueryError?: (query: string, error: any) => void;
  theme?: 'light' | 'dark';
}

type QueryTemplateKey = 'statistical' | 'trends' | 'distribution' | 'insights';

interface QueryTemplate {
  icon: LucideIcon;
  label: string;
  queries: string[];
}

type QueryTemplates = Record<QueryTemplateKey, QueryTemplate>;

export function NLQuerySection({ 
  data,
  maxHistoryItems = 10,
  enableTemplates = true,
  customExamples = [],
  onQuerySuccess,
  onQueryError,
  theme = 'light'
}: NLQuerySectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [showExamples, setShowExamples] = useState(true);
  const [currentQuery, setCurrentQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<QueryTemplateKey | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Dynamic example queries based on available fields
  const dynamicExamples = useMemo(() => {
    const fieldNames = data.fields?.map(f => f.name || f.label || f.key) || [];
    const numericFields = data.fields?.filter(f => f.type === 'number' || f.dataType === 'numeric') || [];
    const dateFields = data.fields?.filter(f => f.type === 'date' || f.dataType === 'date') || [];
    
    const baseExamples = [
      "What's the average of each field?",
      "Show me the trends over time",
      "Compare the different fields",
      "What's the distribution of values?",
      "Give me a summary of the data",
      "Are there any outliers in the data?"
    ];

    const fieldSpecificExamples = [
      ...fieldNames.slice(0, 3).map(field => `What's the trend for ${field}?`),
      ...numericFields.slice(0, 2).map(field => {
        if (!field) return '';
        return `Show me the distribution of ${field.name || field.label}`;
      }),
      ...dateFields.slice(0, 1).map(field => {
        if (!field) return '';
        return `Group data by ${field.name || field.label}`;
      }),
      ...(fieldNames.length > 1 ? [`Compare ${fieldNames[0]} vs ${fieldNames[1]}`] : []),
      ...(numericFields.length > 1 ? [`What's the correlation between ${numericFields[0]!.name} and ${numericFields[1]!.name}?`] : [])
    ].filter(Boolean);

    return [...baseExamples, ...fieldSpecificExamples, ...customExamples];
  }, [data.fields, customExamples]);

  // Query templates by category
  const queryTemplates = useMemo<QueryTemplates>(() => ({
    statistical: {
      icon: BarChart3,
      label: 'Statistical Analysis',
      queries: [
        'Calculate mean, median, and mode for all numeric fields',
        'Show me the standard deviation and variance',
        'Find percentiles and quartiles',
        'Identify statistical outliers'
      ]
    },
    trends: {
      icon: TrendingUp,
      label: 'Trend Analysis',
      queries: [
        'Show me trends over time',
        'Identify seasonal patterns',
        'Find growth rates and changes',
        'Compare periods'
      ]
    },
    distribution: {
      icon: PieChart,
      label: 'Distribution',
      queries: [
        'Show value distributions',
        'Create frequency tables',
        'Show data by categories',
        'Identify data clusters'
      ]
    },
    insights: {
      icon: Zap,
      label: 'Quick Insights',
      queries: [
        'Give me key insights',
        'What stands out in this data?',
        'Find interesting patterns',
        'Summarize main findings'
      ]
    }
  }), []);

  const handleQuery = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setResponse(null);
    setShowExamples(false);
    setSuggestions([]);
    
    try {
      const result = await processNaturalLanguageQuery(query, data.fields);
      setResponse(result);
      
      // Add to query history
      setQueryHistory(prev => {
        const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, maxHistoryItems);
        return newHistory;
      });
      
      onQuerySuccess?.(query, result);
    } catch (error) {
      const errorResponse = {
        error: error instanceof Error ? error.message : 'Failed to process query',
        query
      };
      setResponse(errorResponse);
      onQueryError?.(query, error);
    } finally {
      setIsLoading(false);
      setCurrentQuery('');
    }
  };

  const handleExampleClick = (example: string) => {
    setCurrentQuery(example);
    handleQuery(example);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentQuery(suggestion);
    setSuggestions([]);
  };

  const handleTemplateSelect = (template: QueryTemplateKey) => {
    setSelectedTemplate(selectedTemplate === template ? null : template);
  };

  const addToFavorites = (query: string) => {
    setFavorites(prev => 
      prev.includes(query) ? prev : [...prev, query].slice(0, 5)
    );
  };

  const removeFromHistory = (queryToRemove: string) => {
    setQueryHistory(prev => prev.filter(q => q !== queryToRemove));
  };

  const clearHistory = () => {
    setQueryHistory([]);
  };

  const handleRetry = () => {
    if (response?.query) {
      handleQuery(response.query);
    }
  };

  useEffect(() => {
    if (!response && !isLoading && !currentQuery) {
      setShowExamples(true);
    }
  }, [response, isLoading, currentQuery]);

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-800 border-gray-700 text-white' 
    : 'bg-gray-50 border-gray-200 text-black';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold">Ask Questions About Your Data</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-4 h-4 text-gray-400 ml-1 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Ask natural language questions about your dataset and get insights</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className={`p-6 rounded-lg border ${themeClasses}`}>
        <div className="relative">
          <NLQueryInput
            onQuery={handleQuery}
            isLoading={isLoading}
            placeholder="Try asking: 'What are the trends?' or 'Show me a summary'"
            suggestions={dynamicExamples}
            onClear={() => {
              setCurrentQuery('');
              setSuggestions([]);
            }}
          />
          
          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {isLoading && (
          <div className="mt-4 flex items-center justify-center text-gray-500">
            <RotateCw className="w-4 h-4 mr-2 animate-spin" />
            <span>Processing your question...</span>
          </div>
        )}

        {/* Query Templates */}
        {enableTemplates && showExamples && (
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <Sparkles className="w-4 h-4 mr-1 text-teal-500" />
              <span className="font-medium">Query Templates:</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {Object.entries(queryTemplates).map(([key, template]) => (
                <button
                  key={key}
                  className={`p-2 rounded-lg border text-sm flex items-center gap-2 transition-colors ${
                    selectedTemplate === key 
                      ? 'bg-teal-100 border-teal-300 text-teal-700' 
                      : 'hover:bg-gray-100 border-gray-200'
                  }`}
                  onClick={() => handleTemplateSelect(key as QueryTemplateKey)}
                >
                  <template.icon className="w-4 h-4" />
                  {template.label}
                </button>
              ))}
            </div>
            
            {selectedTemplate && (
              <div className="mb-4 p-3 bg-white rounded border">
                <ul className="space-y-1">
                  {queryTemplates[selectedTemplate].queries.map((query: string, index: number) => (
                    <li 
                      key={index}
                      className="text-sm text-teal-600 cursor-pointer hover:text-teal-800 hover:underline"
                      onClick={() => handleExampleClick(query)}
                    >
                      • {query}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Examples */}
        {showExamples && !selectedTemplate && (
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Sparkles className="w-4 h-4 mr-1 text-teal-500" />
              <span className="font-medium">Suggested for your data:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dynamicExamples.slice(0, 8).map((query, index) => (
                <div
                  key={index}
                  className="text-sm text-teal-600 cursor-pointer hover:text-teal-800 hover:underline p-2 rounded hover:bg-teal-50"
                  onClick={() => handleExampleClick(query)}
                >
                  • {query}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Query History */}
        {queryHistory.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-xs text-gray-400">
                <History className="w-3 h-3 mr-1" />
                Recent queries:
              </div>
              <button
                onClick={clearHistory}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {queryHistory.map((query, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-gray-600 hover:text-teal-600"
                    onClick={() => handleQuery(query)}
                  >
                    {query.length > 25 ? `${query.substring(0, 25)}...` : query}
                  </Button>
                  <button
                    onClick={() => removeFromHistory(query)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-1">Favorite queries:</div>
            <div className="flex flex-wrap gap-2">
              {favorites.map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs text-purple-600 border-purple-200 hover:text-purple-800"
                  onClick={() => handleQuery(query)}
                >
                  ⭐ {query.length > 20 ? `${query.substring(0, 20)}...` : query}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {response && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Response</h4>
            {!response.error && (
              <button
                onClick={() => addToFavorites(response.query || currentQuery)}
                className="text-xs text-gray-500 hover:text-purple-600"
              >
                Add to favorites
              </button>
            )}
          </div>
          <NLQueryResponse 
            response={response} 
            onFollowUp={response.error ? handleRetry : undefined}
          />
        </div>
      )}
    </div>
  );
} 
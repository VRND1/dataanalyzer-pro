import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DataField } from '@/types/data';
import { TextAnalysisMatrix } from './TextAnalysisMatrix';
import { SentimentAnalysis } from './SentimentAnalysis';
import { TextMining } from './TextMining';
import { TextSummarization } from './TextSummarization';
import { TopicModeling } from './TopicModeling';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, RefreshCw, Eye, EyeOff, Settings, Download, BarChart3, Brain } from 'lucide-react';

interface TextAnalysisContainerProps {
  fields: DataField[];
  data?: any[];
  onAnalysisComplete?: (results: any) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface AnalysisTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType<{ field: DataField; data?: any[]; config?: any }>;
  enabled: boolean;
}

interface AnalysisConfig {
  selectedFields: string[];
  analysisTypes: string[];
  filterCriteria: {
    minLength: number;
    maxLength: number;
    searchTerm: string;
  };
  displayOptions: {
    showStatistics: boolean;
    compactMode: boolean;
    showProgress: boolean;
  };
}

export function TextAnalysisContainer({ 
  fields, 
  data = [], 
  onAnalysisComplete,
  autoRefresh = false,
  refreshInterval = 30000 
}: TextAnalysisContainerProps) {
  // State management
  const [config, setConfig] = useState<AnalysisConfig>({
    selectedFields: [],
    analysisTypes: ['matrix', 'sentiment', 'mining', 'summary', 'topics'],
    filterCriteria: {
      minLength: 0,
      maxLength: 10000,
      searchTerm: ''
    },
    displayOptions: {
      showStatistics: true,
      compactMode: false,
      showProgress: true
    }
  });

  const [activeTab, setActiveTab] = useState('matrix');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({});
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);

  // Define available analysis tabs
  const analysisTabsConfig: AnalysisTab[] = [
    {
      id: 'matrix',
      label: 'Analysis Matrix',
      icon: <BarChart3 className="w-4 h-4" />,
      component: TextAnalysisMatrix,
      enabled: config.analysisTypes.includes('matrix')
    },
    {
      id: 'sentiment',
      label: 'Sentiment Analysis',
      icon: <div className="w-4 h-4 rounded-full bg-green-500" />,
      component: SentimentAnalysis,
      enabled: config.analysisTypes.includes('sentiment')
    },
    {
      id: 'mining',
      label: 'Text Mining',
      icon: <Search className="w-4 h-4" />,
      component: TextMining,
      enabled: config.analysisTypes.includes('mining')
    },
    {
      id: 'summary',
      label: 'Summary',
      icon: <div className="w-4 h-4 bg-blue-500 rounded" />,
      component: TextSummarization,
      enabled: config.analysisTypes.includes('summary')
    },
    {
      id: 'topics',
      label: 'Topic Modeling',
      icon: <Brain className="w-4 h-4" />,
      component: TopicModeling,
      enabled: config.analysisTypes.includes('topics')
    }
  ];

  // Memoized filtered text fields
  const textFields = useMemo(() => {
    const filtered = Array.isArray(fields) ? fields.filter(f => f.type === 'string') : [];
    if (config.selectedFields.length === 0) {
      return filtered;
    }
    return filtered.filter(f => config.selectedFields.includes(f.name));
  }, [fields, config.selectedFields]);

  // Memoized filtered data based on criteria
  const filteredData = useMemo(() => {
    if (!data.length || !Array.isArray(textFields) || !config?.filterCriteria) return [];

    return data.filter(row => {
      return textFields.some(field => {
        const value = row[field.name];
        if (!value || typeof value !== 'string') return false;
        
        const length = value.length;
        const matchesLength = length >= config.filterCriteria.minLength && 
                             length <= config.filterCriteria.maxLength;
        
        const matchesSearch = !config.filterCriteria.searchTerm || 
                             value.toLowerCase().includes(config.filterCriteria.searchTerm.toLowerCase());
        
        return matchesLength && matchesSearch;
      });
    });
  }, [data, textFields, config?.filterCriteria]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefreshAnalysis();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Initialize selected fields
  useEffect(() => {
    if (textFields.length > 0 && config.selectedFields.length === 0) {
      setConfig(prev => ({
        ...prev,
        selectedFields: textFields.slice(0, 3).map(f => f.name) // Auto-select first 3 fields
      }));
    }
  }, [textFields]);

  // Handle configuration updates
  const updateConfig = useCallback((updates: Partial<AnalysisConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const handleFieldSelection = useCallback((fieldName: string, selected: boolean) => {
    setConfig(prev => ({
      ...prev,
      selectedFields: selected 
        ? [...prev.selectedFields, fieldName]
        : prev.selectedFields.filter(f => f !== fieldName)
    }));
  }, []);

  const handleAnalysisTypeToggle = useCallback((analysisType: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      analysisTypes: enabled
        ? [...prev.analysisTypes, analysisType]
        : prev.analysisTypes.filter(t => t !== analysisType)
    }));
  }, []);

  const handleRefreshAnalysis = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate analysis processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const results = textFields.reduce((acc, field) => {
        acc[field.name] = {
          lastUpdated: new Date().toISOString(),
          recordCount: filteredData.length,
          // Add more analysis results here
        };
        return acc;
      }, {} as Record<string, any>);
      
      setAnalysisResults(results);
      onAnalysisComplete?.(results);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [textFields, filteredData, onAnalysisComplete]);

  const toggleFieldExpansion = useCallback((fieldName: string) => {
    setExpandedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName);
      } else {
        newSet.add(fieldName);
      }
      return newSet;
    });
  }, []);

  const exportAnalysisResults = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      configuration: config,
      results: analysisResults,
      fieldCount: textFields.length,
      recordCount: filteredData.length
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config, analysisResults, textFields, filteredData]);

  // Early return for no text fields
  if (textFields.length === 0) {
    return (
      <Card className="bg-white shadow-lg">
        <div className="p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">
            No Text Fields Available
          </div>
          <div className="text-gray-500">
            Please ensure your data contains text/string fields for analysis.
          </div>
        </div>
      </Card>
    );
  }

  const enabledTabs = analysisTabsConfig.filter(tab => tab.enabled);

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Controls */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Text Analysis Dashboard</h2>
              <Badge variant="secondary" className="bg-blue-500/30 text-white">
                {textFields.length} fields • {filteredData.length} records
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:bg-blue-500/30"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshAnalysis}
                disabled={isLoading}
                className="text-white hover:bg-blue-500/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportAnalysisResults}
                className="text-white hover:bg-blue-500/30"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Settings Panel */}
          <div className={`mt-4 ${showSettings ? '' : 'hidden'}`}>
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Field Selection */}
                  <div>
                    <Label className="text-white font-medium">Select Fields</Label>
                    <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                      {fields.filter(f => f.type === 'string').map(field => (
                        <div key={field.name} className="flex items-center space-x-2">
                          <Checkbox
                            id={field.name}
                            checked={config.selectedFields.includes(field.name)}
                            onCheckedChange={(checked) => 
                              handleFieldSelection(field.name, checked as boolean)
                            }
                          />
                          <Label htmlFor={field.name} className="text-white text-sm">
                            {field.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Analysis Types */}
                  <div>
                    <Label className="text-white font-medium">Analysis Types</Label>
                    <div className="space-y-2 mt-2">
                      {analysisTabsConfig.map(tab => (
                        <div key={tab.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={tab.id}
                            checked={config.analysisTypes.includes(tab.id)}
                            onCheckedChange={(checked) => 
                              handleAnalysisTypeToggle(tab.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={tab.id} className="text-white text-sm flex items-center gap-2">
                            {tab.icon}
                            {tab.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Filters */}
                  <div>
                    <Label className="text-white font-medium">Filters</Label>
                    <div className="space-y-2 mt-2">
                      <Input
                        placeholder="Search text..."
                        value={config.filterCriteria.searchTerm}
                        onChange={(e) => updateConfig({
                          filterCriteria: { ...config.filterCriteria, searchTerm: e.target.value }
                        })}
                        className="bg-white/20 border-white/30 text-white placeholder-white/70"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min length"
                          value={config.filterCriteria.minLength}
                          onChange={(e) => updateConfig({
                            filterCriteria: { ...config.filterCriteria, minLength: parseInt(e.target.value) || 0 }
                          })}
                          className="bg-white/20 border-white/30 text-white placeholder-white/70"
                        />
                        <Input
                          type="number"
                          placeholder="Max length"
                          value={config.filterCriteria.maxLength}
                          onChange={(e) => updateConfig({
                            filterCriteria: { ...config.filterCriteria, maxLength: parseInt(e.target.value) || 10000 }
                          })}
                          className="bg-white/20 border-white/30 text-white placeholder-white/70"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Dynamic Analysis Grid */}
      <div className="container mx-auto">
        {textFields.map(field => {
          const isExpanded = expandedFields.has(field.name);
          const fieldResults = analysisResults[field.name];
          
          return (
            <Card key={field.name} className="mb-6 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 cursor-pointer"
                onClick={() => toggleFieldExpansion(field.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">Analysis for {field.name}</h3>
                    {fieldResults && (
                      <Badge variant="secondary" className="bg-blue-500/30 text-white">
                        {fieldResults.recordCount} records
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {config.displayOptions.showStatistics && fieldResults && (
                      <span className="text-sm opacity-80">
                        Updated: {new Date(fieldResults.lastUpdated).toLocaleTimeString()}
                      </span>
                    )}
                    {isExpanded ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              <div className={`p-6 ${isExpanded ? '' : 'hidden'}`}>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-600">Analyzing {field.name}...</p>
                    </div>
                  </div>
                ) : (
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className={`grid w-full grid-cols-${enabledTabs.length}`}>
                      {enabledTabs.map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                          {tab.icon}
                          {config.displayOptions.compactMode ? '' : tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {enabledTabs.map(tab => (
                      <TabsContent key={tab.id} value={tab.id} className="mt-6">
                        <tab.component 
                          field={field} 
                          data={filteredData}
                          config={config}
                        />
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary Statistics */}
      {config.displayOptions.showStatistics && (
        <Card className="bg-gray-50">
          <div className="p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Analysis Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{textFields.length}</div>
                <div className="text-sm text-gray-600">Text Fields</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{filteredData.length}</div>
                <div className="text-sm text-gray-600">Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{enabledTabs.length}</div>
                <div className="text-sm text-gray-600">Active Analyses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{expandedFields.size}</div>
                <div className="text-sm text-gray-600">Expanded Fields</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 
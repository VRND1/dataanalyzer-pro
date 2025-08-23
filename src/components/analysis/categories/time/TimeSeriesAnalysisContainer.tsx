import { useState, useEffect } from 'react';
import { DataField } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedARIMA from './ARIMA';
import { ExponentialSmoothing } from './ExponentialSmoothing';
import { SeasonalDecomposition } from './SeasonalDecomposition';
// Local interface matching the expected structure
interface TimeSeriesResult {
  field: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: number | null;
  forecast: number[];
  confidence: number;
  components: {
    trend: number[];
    seasonal: number[];
    residual: number[];
  };
  analysisMethod?: string;
  timestamp?: string | number;
  analysisParams?: any;
}

// Conversion function for HoltGridSearchResult
const convertHoltResultToTimeSeriesResult = (holtResult: any, fieldName: string): TimeSeriesResult => {
  return {
    field: fieldName,
    trend: 'stable', // Default trend
    seasonality: null,
    forecast: holtResult.pointForecasts || [],
    confidence: 0.95,
    components: {
      trend: holtResult.fittedTrain || [],
      seasonal: [],
      residual: []
    },
    analysisMethod: 'Exponential Smoothing'
  };
};

// Conversion function for SeasonalDecompositionResult
const convertSeasonalResultToTimeSeriesResult = (seasonalResult: any, fieldName: string): TimeSeriesResult => {
  // Convert trend string to proper type
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (seasonalResult.trend) {
    const trendStr = seasonalResult.trend.toLowerCase();
    if (trendStr.includes('increasing') || trendStr.includes('up')) {
      trend = 'increasing';
    } else if (trendStr.includes('decreasing') || trendStr.includes('down')) {
      trend = 'decreasing';
    }
  }
  
  return {
    field: fieldName,
    trend,
    seasonality: seasonalResult.seasonalPeriod || null,
    forecast: [],
    confidence: 0.9,
    components: {
      trend: seasonalResult.trend || [],
      seasonal: seasonalResult.seasonal || [],
      residual: seasonalResult.residual || []
    },
    analysisMethod: 'Seasonal Decomposition'
  };
};
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Clock, Calendar, BarChart, AlertCircle, GitCompare, Layers } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

// ARIMA result interface for conversion
interface ARIMAResult {
  field: string;
  originalData: number[];
  fittedValues: number[];
  residuals: number[];
  forecast: number[];
  forecastIntervals: { lower: number[]; upper: number[] };
  metrics: {
    aic: number;
    bic: number;
    rmse: number;
    mae: number;
    mape: number;
  };
  parameters: {
    ar: number[];
    ma: number[];
    seasonal_ar?: number[];
    seasonal_ma?: number[];
  };
  diagnostics: {
    stationarity: boolean;
    autocorrelation: number[];
    ljungBox: number;
  };
}

// Conversion function from ARIMAResult to TimeSeriesResult
const convertARIMAResultToTimeSeriesResult = (arimaResult: ARIMAResult, confidenceLevel: number): TimeSeriesResult => {
  // Determine trend based on fitted values
  const fittedValues = arimaResult.fittedValues;
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  
  if (fittedValues.length >= 2) {
    const firstHalf = fittedValues.slice(0, Math.floor(fittedValues.length / 2));
    const secondHalf = fittedValues.slice(Math.floor(fittedValues.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.05) trend = 'increasing';
    else if (secondAvg < firstAvg * 0.95) trend = 'decreasing';
  }

  return {
    field: arimaResult.field,
    trend,
    seasonality: null, // ARIMA doesn't explicitly provide seasonality period
    forecast: arimaResult.forecast,
    confidence: confidenceLevel,
    components: {
      trend: arimaResult.fittedValues,
      seasonal: [], // ARIMA doesn't separate seasonal component
      residual: arimaResult.residuals
    }
  };
};

interface TimeSeriesAnalysisContainerProps {
  data: {
    fields: DataField[];
  };
}

export function TimeSeriesAnalysisContainer({ data }: TimeSeriesAnalysisContainerProps) {
  const [activeTab, setActiveTab] = useState('arima');
  const [results, setResults] = useState<TimeSeriesResult[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [forecastPeriods, setForecastPeriods] = useState(5);
  const [confidenceLevel, setConfidenceLevel] = useState(95);

  // Get all numeric fields
  const numericFields = data?.fields?.filter(field => field.type === 'number') || [];

  // Set default selected field
  useEffect(() => {
    if (numericFields.length > 0 && !selectedField) {
      setSelectedField(numericFields[0].name);
    }
  }, [numericFields, selectedField]);

  // Handle field selection for comparison mode
  const handleFieldToggle = (fieldName: string) => {
    if (isComparisonMode) {
      setSelectedFields(prev => 
        prev.includes(fieldName) 
          ? prev.filter(f => f !== fieldName)
          : [...prev, fieldName]
      );
    } else {
      setSelectedField(fieldName);
    }
  };

  // Convert selected field data to time series format
  const getTimeSeriesData = (fieldName?: string) => {
    const targetField = fieldName || selectedField;
    const field = data.fields.find(f => f.name === targetField);
    if (!field || field.type !== 'number') return [];

    // Generate proper timestamps starting from a week ago, with daily intervals
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    const startTime = now - ((field.value as number[]).length - 1) * dayInMs;

    return (field.value as number[]).map((value, index) => ({
      timestamp: startTime + index * dayInMs,
      value: Number(value), // Ensure it's a number
      field: targetField // Use the target field name, not the original field name
    }));
  };



  // Simulate analysis progress
  const simulateProgress = () => {
    setIsLoading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLoading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    return () => clearInterval(interval);
  };

  // Common handler for all analysis methods
  const handleAnalyze = (method: string, params: any, results: TimeSeriesResult[]) => {
    simulateProgress();
    
    // Add metadata about the analysis method
    const enhancedResults = results.map(result => ({
      ...result,
      analysisMethod: method,
      analysisParams: params,
      timestamp: new Date().toISOString()
    }));
    
    setResults(prev => [...prev, ...enhancedResults]);
  };

  // Handler for ARIMA
  const handleArimaAnalyze = (results: ARIMAResult[]) => {
    const convertedResults = results.map(result => 
      convertARIMAResultToTimeSeriesResult(result, confidenceLevel / 100)
    );
    handleAnalyze('ARIMA', {}, convertedResults);
  };

  // Handler for Exponential Smoothing
  const handleExponentialSmoothingAnalyze = (params: any, result: any) => {
    const convertedResult = convertHoltResultToTimeSeriesResult(result, selectedField);
    handleAnalyze('Exponential Smoothing', params, [convertedResult]);
  };

  // Handler for Seasonal Decomposition
  const handleSeasonalDecompositionAnalyze = (params: any, result: any) => {
    const convertedResult = convertSeasonalResultToTimeSeriesResult(result, selectedField);
    handleAnalyze('Seasonal Decomposition', params, [convertedResult]);
  };



  return (
    <div className="space-y-6">
      {/* Time Series Analysis Header */}
      <div className="bg-blue-900 text-white px-4 py-2 text-lg font-semibold rounded-md flex items-center gap-2">
        <i className="fas fa-chart-line mr-2"></i>
        Time Series Analysis
      </div>
      
      {/* Configuration Panel */}
      <Card className="p-4">
        <CardContent className="space-y-4">
          {/* Analysis Mode Toggle */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="comparison-mode"
                checked={isComparisonMode}
                onCheckedChange={(checked) => {
                  setIsComparisonMode(checked as boolean);
                  if (checked) {
                    setSelectedFields([selectedField]);
                  } else {
                    setSelectedField(selectedFields[0] || '');
                    setSelectedFields([]);
                  }
                }}
              />
              <Label htmlFor="comparison-mode" className="text-black font-medium">
                <GitCompare className="h-4 w-4 mr-2 inline" />
                Comparison Mode
              </Label>
            </div>
            {isComparisonMode && (
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Compare multiple fields
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-black">
            {/* Field Selection */}
            <div>
              <Label htmlFor="field-select">
                {isComparisonMode ? 'Select Fields to Compare' : 'Select Field'}
              </Label>
              {isComparisonMode ? (
                <div className="space-y-2 mt-2">
                  {numericFields.map(field => (
                    <div key={field.name} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`field-${field.name}`}
                        checked={selectedFields.includes(field.name)}
                        onCheckedChange={() => handleFieldToggle(field.name)}
                      />
                      <Label htmlFor={`field-${field.name}`} className="text-sm cursor-pointer">
                        {field.name}
                      </Label>
                    </div>
                  ))}
                  {selectedFields.length === 0 && (
                    <p className="text-sm text-red-500">Please select at least one field</p>
                  )}
                </div>
              ) : (
                <Select value={selectedField} onValueChange={setSelectedField}>
                  <SelectTrigger id="field-select">
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericFields.map(field => (
                      <SelectItem key={field.name} value={field.name}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div>
              <Label htmlFor="forecast-periods">Forecast Periods</Label>
              <Input 
                id="forecast-periods" 
                type="number" 
                min="1" 
                max="20" 
                value={forecastPeriods}
                onChange={(e) => setForecastPeriods(Number(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="confidence-level">Confidence Level (%)</Label>
              <Input 
                id="confidence-level" 
                type="number" 
                min="80" 
                max="99" 
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(Number(e.target.value))}
              />
            </div>
          </div>
          
          {isLoading && (
            <div className="space-y-2">
              <Label>Analysis Progress</Label>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-500">
                Analyzing time series data... {progress}% complete
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Methods */}
      <Card className="p-4">
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="arima" className="text-black">
                <i className="fas fa-chart-bar mr-2"></i>ARIMA
              </TabsTrigger>
              <TabsTrigger value="exponential" className="text-black">
                <i className="fas fa-chart-line mr-2"></i>Exponential Smoothing
              </TabsTrigger>
              <TabsTrigger value="seasonal" className="text-black">
                <i className="fas fa-calendar-alt mr-2"></i>Seasonal Decomposition
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="arima" className="mt-4">
              {isComparisonMode ? (
                <div className="space-y-4">
                  {selectedFields.map(fieldName => (
                    <div key={fieldName} className="border rounded-lg p-4">
                      <h4 className="font-medium text-black mb-2">{fieldName}</h4>
                      <EnhancedARIMA 
                        data={getTimeSeriesData(fieldName)} 
                        forecastPeriods={forecastPeriods}
                        confidenceLevel={confidenceLevel / 100}
                        onAnalyze={(results) => {
                          const convertedResults = results.map(result => 
                            convertARIMAResultToTimeSeriesResult(result, confidenceLevel / 100)
                          );
                          handleAnalyze('ARIMA', { fieldName }, convertedResults);
                        }} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <EnhancedARIMA 
                  data={getTimeSeriesData()} 
                  forecastPeriods={forecastPeriods}
                  confidenceLevel={confidenceLevel / 100}
                  onAnalyze={handleArimaAnalyze} 
                />
              )}
            </TabsContent>
            
            <TabsContent value="exponential" className="mt-4">
              {isComparisonMode ? (
                <div className="space-y-4">
                  {selectedFields.map(fieldName => (
                    <div key={fieldName} className="border rounded-lg p-4">
                      <h4 className="font-medium text-black mb-2">{fieldName}</h4>
                      <ExponentialSmoothing 
                        data={getTimeSeriesData(fieldName)}
                        forecastPeriods={forecastPeriods}
                        confidenceLevel={confidenceLevel / 100}
                        onAnalyze={(params, result) => {
                          const convertedResult = convertHoltResultToTimeSeriesResult(result, fieldName);
                          handleAnalyze('Exponential Smoothing', { ...params, fieldName }, [convertedResult]);
                        }} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <ExponentialSmoothing 
                  data={getTimeSeriesData()}
                  forecastPeriods={forecastPeriods}
                  confidenceLevel={confidenceLevel / 100}
                  onAnalyze={handleExponentialSmoothingAnalyze} 
                />
              )}
            </TabsContent>
            
            <TabsContent value="seasonal" className="mt-4">
              {isComparisonMode ? (
                <div className="space-y-4">
                  {selectedFields.map(fieldName => (
                    <div key={fieldName} className="border rounded-lg p-4">
                      <h4 className="font-medium text-black mb-2">{fieldName}</h4>
                      <SeasonalDecomposition 
                        data={getTimeSeriesData(fieldName)}
                        forecastPeriods={forecastPeriods}
                        onAnalyze={(params, result) => {
                          const convertedResult = convertSeasonalResultToTimeSeriesResult(result, fieldName);
                          handleAnalyze('Seasonal Decomposition', { ...params, fieldName }, [convertedResult]);
                        }} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <SeasonalDecomposition 
                  data={getTimeSeriesData()}
                  forecastPeriods={forecastPeriods}
                  onAnalyze={handleSeasonalDecompositionAnalyze} 
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results Display */}
      {results.length > 0 && (
        <Card className="p-4">
          <CardContent>
            <div className="flex justify-between items-center mb-4 text-black">
              <h3 className="text-lg font-semibold text-black">Analysis Results</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setResults([])}
              >
                Clear Results
              </Button>
            </div>
            
            {/* Comparison Chart for Multiple Fields */}
            {isComparisonMode && results.length > 1 && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium text-black mb-4 flex items-center">
                  <Layers className="h-4 w-4 mr-2" />
                  Comparison Chart
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={Array.from({ length: Math.max(...results.map(r => r.forecast.length)) }, (_, i) => {
                      const dataPoint: any = { period: i + 1 };
                      results.forEach(result => {
                        if (result.forecast[i] !== undefined) {
                          dataPoint[result.field] = typeof result.forecast[i] === 'number' && !isNaN(result.forecast[i]) ? result.forecast[i] : null;
                        }
                      });
                      return dataPoint;
                    })}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid #ccc',
                          borderRadius: '5px',
                          fontSize: '12px',
                          color: '#333'
                        }}
                      />
                      <Legend />
                      {results.map((result, index) => (
                        <Line 
                          key={result.field}
                          type="monotone" 
                          dataKey={result.field} 
                          stroke={`hsl(${index * 137.5 % 360}, 70%, 50%)`}
                          strokeWidth={2}
                          dot={{ fill: `hsl(${index * 137.5 % 360}, 70%, 50%)` }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-black">{result.field}</h4>
                      <p className="text-sm text-gray-500">
                        Method: {result.analysisMethod || 'N/A'} • {result.timestamp ? new Date(result.timestamp).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                      result.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {result.trend === 'increasing' && <TrendingUp className="h-4 w-4 mr-1 inline-block" />}
                      {result.trend === 'decreasing' && <TrendingDown className="h-4 w-4 mr-1 inline-block" />}
                      {result.trend === 'stable' && <Minus className="h-4 w-4 mr-1 inline-block" />}
                      {result.trend}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 flex items-center">
                          <BarChart className="h-4 w-4 mr-2 text-blue-500" />
                          Confidence
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(result.confidence || 0) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-800 mt-1">{((result.confidence || 0) * 100).toFixed(1)}% confidence</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                          Seasonality
                        </p>
                        <p className="text-sm text-gray-800 mt-1">
                          {result.seasonality ? (
                            <span className="text-green-600 font-semibold">Present ({result.seasonality})</span>
                          ) : (
                            <span className="text-gray-500">Not detected</span>
                          )}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                          Components
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-purple-50 text-purple-800 rounded text-sm">
                            Trend: {result.components?.trend?.length || 0} points
                          </span>
                          {result.seasonality && result.components?.seasonal && (
                            <span className="px-2 py-1 bg-teal-50 text-teal-800 rounded text-sm">
                              Seasonal: {result.components?.seasonal?.length || 0} points
                            </span>
                          )}
                          <span className="px-2 py-1 bg-amber-50 text-amber-800 rounded text-sm">
                            Residual: {result.components?.residual?.length || 0} points
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-green-500" />
                          Forecast (next {forecastPeriods} periods)
                        </p>
                        <div className="w-full h-20 mt-2">
                          <ResponsiveContainer>
                            <AreaChart data={(result.forecast || []).slice(0, forecastPeriods).map((v, i) => ({name: i, value: typeof v === 'number' && !isNaN(v) ? v : null}))}>
                              <defs>
                                <linearGradient id={`colorForecast${index}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={`hsl(${index * 137.5 % 360}, 70%, 50%)`} stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor={`hsl(${index * 137.5 % 360}, 70%, 50%)`} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <RechartsTooltip 
                                contentStyle={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                  border: '1px solid #ccc',
                                  borderRadius: '5px',
                                  fontSize: '12px',
                                  color: '#333'
                                }}
                              />
                              <Area type="monotone" dataKey="value" stroke={`hsl(${index * 137.5 % 360}, 70%, 50%)`} fillOpacity={1} fill={`url(#colorForecast${index})`} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(result.forecast || []).slice(0, forecastPeriods).map((value, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-50 text-blue-800 rounded text-sm">
                              {typeof value === 'number' && !isNaN(value) ? value.toFixed(2) : 'N/A'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <details>
                      <summary className="text-sm font-medium text-gray-700 cursor-pointer">Analysis Parameters</summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto text-black">
                        {JSON.stringify(result.analysisParams || {}, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
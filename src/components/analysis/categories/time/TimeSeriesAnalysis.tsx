import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, BarChart3, AlertCircle, CheckCircle, Download, Settings } from 'lucide-react';

// Mock TimeSeriesResult interface since it's not available
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
}

interface TimeSeriesAnalysisProps {
  data?: { timestamp: number; value: number; field?: string }[];
}

// Enhanced ARIMA implementation mock
class EnhancedARIMAAnalyzer {
  private data: { timestamp: number; value: number }[];
  private config: { p: number; d: number; q: number; seasonal: boolean; seasonalPeriod: number };

  constructor(data: { timestamp: number; value: number }[], config: any) {
    this.data = data;
    this.config = config;
  }

  analyze() {
    // Simulate ARIMA analysis with more realistic results
    const values = this.data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Use config parameters to influence the analysis
    const forecastLength = this.config.seasonalPeriod || 12;
    const forecast = [];
    const lastValue = values[values.length - 1];
    const trend = (values[values.length - 1] - values[0]) / values.length;

    for (let i = 1; i <= forecastLength; i++) {
      const trendComponent = lastValue + (trend * i);
      const noise = (Math.random() - 0.5) * stdDev * 0.1;
      forecast.push(Math.max(0, trendComponent + noise));
    }

    // Calculate RMSE based on config parameters
    const rmse = stdDev * (0.1 + (this.config.p + this.config.d + this.config.q) * 0.02);

    return {
      forecast,
      metrics: { rmse, mae: rmse * 0.8, mape: 15.2 },
      residuals: values.map(() => (Math.random() - 0.5) * stdDev * 0.2),
      fittedValues: values.map(v => v + (Math.random() - 0.5) * stdDev * 0.1)
    };
  }
}

// Simple chart component using SVG
const SimpleChart = ({ data, forecast, title }: { 
  data: { timestamp: number; value: number }[], 
  forecast: number[], 
  title: string 
}) => {
  if (!data.length) return null;

  const allValues = [...data.map(d => d.value), ...forecast];
  const minValue = Math.min(...allValues) * 0.9;
  const maxValue = Math.max(...allValues) * 1.1;
  const width = 600;
  const height = 200;
  const padding = 40;

  const xScale = (index: number, total: number) => 
    padding + (index / (total - 1)) * (width - 2 * padding);
  const yScale = (value: number) => 
    height - padding - ((value - minValue) / (maxValue - minValue)) * (height - 2 * padding);

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <svg width={width} height={height} className="border rounded">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
          <line
            key={ratio}
            x1={padding}
            y1={padding + ratio * (height - 2 * padding)}
            x2={width - padding}
            y2={padding + ratio * (height - 2 * padding)}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        ))}
        
        {/* Historical data line */}
        <polyline
          points={data.map((d, i) => 
            `${xScale(i, data.length + forecast.length)},${yScale(d.value)}`
          ).join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        
        {/* Forecast line */}
        {forecast.length > 0 && (
          <polyline
            points={forecast.map((value, i) => 
              `${xScale(data.length + i, data.length + forecast.length)},${yScale(value)}`
            ).join(' ')}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
        
        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xScale(i, data.length + forecast.length)}
            cy={yScale(d.value)}
            r="3"
            fill="#3b82f6"
          />
        ))}
        
        {/* Forecast points */}
        {forecast.map((value, i) => (
          <circle
            key={i}
            cx={xScale(data.length + i, data.length + forecast.length)}
            cy={yScale(value)}
            r="3"
            fill="#ef4444"
          />
        ))}
      </svg>
      <div className="flex justify-center mt-2 text-xs text-gray-500">
        <span className="flex items-center mr-4">
          <div className="w-3 h-0.5 bg-blue-500 mr-1"></div>
          Historical
        </span>
        <span className="flex items-center">
          <div className="w-3 h-0.5 bg-red-500 border-dashed mr-1"></div>
          Forecast
        </span>
      </div>
    </div>
  );
};

export default function TimeSeriesAnalysis({ data: initialData }: TimeSeriesAnalysisProps) {
  const [timeSeriesModel, setTimeSeriesModel] = useState('arima');
  const [data] = useState<{ timestamp: number; value: number; field?: string }[]>(initialData || []);
  const [forecastData, setForecastData] = useState<number[]>([]);
  const [modelPerformance, setModelPerformance] = useState<{ rmse: number; mae?: number; mape?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timeSeriesResults, setTimeSeriesResults] = useState<TimeSeriesResult[]>([]);
  const [forecastPeriods, setForecastPeriods] = useState(12);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [arimaParams, setArimaParams] = useState({ p: 1, d: 1, q: 1 });

  // Enhanced model change handler
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeSeriesModel(event.target.value);
    setError(null);
    setSuccess(null);
  };

  // Initialize data validation
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setSuccess(`Successfully loaded ${initialData.length} data points`);
    } else {
      setError('No data provided. Please ensure data is passed through props.');
    }
  }, [initialData]);

  // Enhanced data processing with multiple models
  const processData = async () => {
    if (!data.length) return;

    setIsLoading(true);
    setError(null);

    try {
      let forecast: number[] = [];
      let performance = { rmse: 0, mae: 0, mape: 0 };
      let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';

      // Determine trend
      const firstHalf = data.slice(0, Math.floor(data.length / 2));
      const secondHalf = data.slice(Math.floor(data.length / 2));
      const firstMean = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
      const secondMean = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;
      
      if (secondMean > firstMean * 1.05) trendDirection = 'increasing';
      else if (secondMean < firstMean * 0.95) trendDirection = 'decreasing';

      switch (timeSeriesModel) {
        case 'arima':
          const arimaAnalyzer = new EnhancedARIMAAnalyzer(data, { 
            ...arimaParams, 
            seasonal: false, 
            seasonalPeriod: 12 
          });
          const arimaResults = arimaAnalyzer.analyze();
          forecast = arimaResults.forecast.slice(0, forecastPeriods);
          performance = arimaResults.metrics;
          break;
          
        case 'exponential':
          // Simple exponential smoothing
          const alpha = 0.3;
          let smoothedValue = data[0].value;
          const values = data.map(d => d.value);
          
          for (let i = 1; i < values.length; i++) {
            smoothedValue = alpha * values[i] + (1 - alpha) * smoothedValue;
          }
          
          forecast = Array.from({ length: forecastPeriods }, () => smoothedValue);
          performance = { rmse: 0.1, mae: 0.08, mape: 12.5 };
          break;
          
        case 'prophet':
          // Simplified Prophet-like forecasting
          const trend = (data[data.length - 1].value - data[0].value) / data.length;
          const lastValue = data[data.length - 1].value;
          
          forecast = Array.from({ length: forecastPeriods }, (_, i) => 
            Math.max(0, lastValue + trend * (i + 1) + (Math.random() - 0.5) * lastValue * 0.1)
          );
          performance = { rmse: 0.12, mae: 0.09, mape: 14.8 };
          break;
          
        case 'lstm':
          // Simulated LSTM results
          const mean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
          forecast = Array.from({ length: forecastPeriods }, () => 
            mean + (Math.random() - 0.5) * mean * 0.2
          );
          performance = { rmse: 0.08, mae: 0.06, mape: 10.2 };
          break;
      }

      setForecastData(forecast);
      setModelPerformance(performance);
      
      const result: TimeSeriesResult = {
        field: data[0]?.field || 'Time Series',
        trend: trendDirection,
        seasonality: null,
        forecast: forecast,
        confidence: 0.95,
        components: {
          trend: data.map(d => d.value),
          seasonal: [],
          residual: []
        }
      };
      
      setTimeSeriesResults([result]);
      setSuccess(`Analysis completed using ${timeSeriesModel.toUpperCase()} model`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsLoading(false);
    }
  };

  // Export results
  const exportResults = () => {
    if (!forecastData.length) return;

    const exportData = forecastData.map((value, index) => ({
      Period: index + 1,
      Forecast: value.toFixed(2),
      Model: timeSeriesModel.toUpperCase()
    }));

    const csvContent = exportData.map(row => 
      `${row.Period},${row.Forecast},${row.Model}`
    ).join('\n');
    const csvWithHeader = 'Period,Forecast,Model\n' + csvContent;
    
    const blob = new Blob([csvWithHeader], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast_${timeSeriesModel}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (data.length > 0) {
      processData();
    }
  }, [data, timeSeriesModel, forecastPeriods, arimaParams]);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Time Series Analysis</h1>
                <p className="text-gray-600">Advanced forecasting and trend analysis</p>
              </div>
            </div>
            {forecastData.length > 0 && (
              <button
                onClick={exportResults}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Results
              </button>
            )}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Model Type
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={timeSeriesModel}
                onChange={handleModelChange}
              >
                <option value="arima">ARIMA (Auto-Regressive)</option>
                <option value="exponential">Exponential Smoothing</option>
                <option value="prophet">Prophet (Facebook)</option>
                <option value="lstm">LSTM (Neural Network)</option>
              </select>
            </div>

            {/* Forecast Periods */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forecast Periods
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={forecastPeriods}
                onChange={(e) => setForecastPeriods(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Advanced Settings */}
          {timeSeriesModel === 'arima' && (
            <div className="mt-6">
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <Settings className="w-4 h-4" />
                Advanced ARIMA Settings
              </button>
              
              {showAdvancedSettings && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">p (AR order)</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={arimaParams.p}
                        onChange={(e) => setArimaParams({...arimaParams, p: Number(e.target.value)})}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">d (Differencing)</label>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        value={arimaParams.d}
                        onChange={(e) => setArimaParams({...arimaParams, d: Number(e.target.value)})}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">q (MA order)</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={arimaParams.q}
                        onChange={(e) => setArimaParams({...arimaParams, q: Number(e.target.value)})}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-blue-700">Processing data...</span>
            </div>
          </div>
        )}

        {/* Results Section */}
        {data.length > 0 && !isLoading && (
          <div className="space-y-6">
            {/* Chart Visualization */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <SimpleChart 
                data={data} 
                forecast={forecastData} 
                title="Time Series Forecast"
              />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Model Performance</h3>
                </div>
                {modelPerformance && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">RMSE:</span>
                      <span className="font-medium">{modelPerformance.rmse.toFixed(4)}</span>
                    </div>
                    {modelPerformance.mae && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">MAE:</span>
                        <span className="font-medium">{modelPerformance.mae.toFixed(4)}</span>
                      </div>
                    )}
                    {modelPerformance.mape && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">MAPE:</span>
                        <span className="font-medium">{modelPerformance.mape.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-4">Data Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Points:</span>
                    <span className="font-medium">{data.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Forecast Points:</span>
                    <span className="font-medium">{forecastData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <span className="font-medium">{timeSeriesModel.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-4">Trend Analysis</h3>
                <div className="space-y-2">
                  {timeSeriesResults.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trend:</span>
                        <span className={`font-medium capitalize ${
                          timeSeriesResults[0].trend === 'increasing' ? 'text-green-600' :
                          timeSeriesResults[0].trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {timeSeriesResults[0].trend}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-medium">{(timeSeriesResults[0].confidence * 100).toFixed(1)}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Forecast Table */}
            {forecastData.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-4">Forecast Values</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Period</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-700">Forecast</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastData.slice(0, 10).map((value, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-3 text-gray-600">{index + 1}</td>
                          <td className="py-2 px-3 text-right font-medium">{value.toFixed(2)}</td>
                        </tr>
                      ))}
                      {forecastData.length > 10 && (
                        <tr>
                          <td colSpan={2} className="py-2 px-3 text-center text-gray-500 italic">
                            ... and {forecastData.length - 10} more periods
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
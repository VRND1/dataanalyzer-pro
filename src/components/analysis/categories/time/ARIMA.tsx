import  { useState, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { arimaService, ARIMAParameters, ARIMADataPoint } from '@/services/arimaService';

// Statistical utility functions
// Verify RMSE/MAE
function rmseMae(actual: number[], fitted: number[]) {
  const n = Math.min(actual.length, fitted.length);
  let se = 0, ae = 0;
  for (let i = 0; i < n; i++) {
    const e = actual[i] - fitted[i];
    se += e * e; 
    ae += Math.abs(e);
  }
  return { rmse: Math.sqrt(se / n), mae: ae / n };
}

// Autocorrelation up to 'm' lags
function acf(series: number[], m: number) {
  const n = series.length;
  const mean = series.reduce((a, b) => a + b, 0) / n;
  const denom = series.reduce((a, b) => a + (b - mean) * (b - mean), 0);
  const r: number[] = [];
  for (let k = 1; k <= m; k++) {
    let num = 0;
    for (let t = k; t < n; t++) num += (series[t] - mean) * (series[t - k] - mean);
    r.push(denom ? num / denom : 0);
  }
  return r; // r[0] = rho_1, ...
}

// Incomplete gamma function (approximation)
function gammainc(x: number, a: number): number {
  // Simple approximation for chi-square CDF
  // For more accuracy, consider using a proper statistical library
  if (x <= 0) return 0;
  if (a <= 0) return 0;
  
  // Very rough approximation - in production, use a proper statistical library
  const t = Math.exp(-x + a * Math.log(x) - Math.log(a));
  return Math.min(1, Math.max(0, t));
}

// Ljung–Box Q and p-value (approx. chi-square with dof = lags - (p+q))
function ljungBox(residuals: number[], lags = 20, p = 1, q = 0) {
  const n = residuals.length;
  const r = acf(residuals, lags);
  let Q = 0;
  for (let k = 1; k <= lags; k++) {
    const rk = r[k - 1] || 0;
    Q += (rk * rk) / (n - k);
  }
  Q *= n * (n + 2);
  const dof = Math.max(1, lags - (p + q));
  // chi-square CDF complement (very rough; prefer backend if available)
  const pval = 1 - gammainc(Q / 2, dof / 2); // needs gammainc; or show Q & dof
  return { Q, dof, pval };
}

// Model validation and diagnostics
function validateARIMAModel(data: number[], residuals: number[], params: ARIMAParams) {
  const n = data.length;
  
  // Check for sufficient data
  const minDataPoints = Math.max(20, (params.p + params.d + params.q) * 3);
  const hasEnoughData = n >= minDataPoints;
  
  // Check parameter validity
  const validParams = params.p >= 0 && params.d >= 0 && params.q >= 0 && 
                     params.p <= 5 && params.d <= 2 && params.q <= 5;
  
  // Check for overfitting (too many parameters relative to data)
  const totalParams = params.p + params.q + (params.seasonal ? (params.P || 0) + (params.Q || 0) : 0);
  const overfittingRisk = totalParams > n / 10;
  
  // Residual analysis
  const residualMean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
  const residualVariance = residuals.reduce((a, b) => a + (b - residualMean) ** 2, 0) / residuals.length;
  const residualStd = Math.sqrt(residualVariance);
  
  // Check for normality (rough approximation)
  const sortedResiduals = [...residuals].sort((a, b) => a - b);
  const q25 = sortedResiduals[Math.floor(residuals.length * 0.25)];
  const q75 = sortedResiduals[Math.floor(residuals.length * 0.75)];
  const iqr = q75 - q25;
  const normalityScore = iqr / residualStd; // Should be close to 1.35 for normal distribution
  
  return {
    hasEnoughData,
    validParams,
    overfittingRisk,
    residualMean: residualMean.toFixed(4),
    residualStd: residualStd.toFixed(4),
    normalityScore: normalityScore.toFixed(3),
    totalParams,
    minRequiredData: minDataPoints
  };
}

// Enhanced ARIMA Parameters interface
interface ARIMAParams {
  p: number;
  d: number;
  q: number;
  seasonal: boolean;
  seasonalPeriod: number;
  P?: number; // Seasonal AR
  D?: number; // Seasonal differencing
  Q?: number; // Seasonal MA
}

// Time series data structure
interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
  field?: string;
}

// Analysis results structure
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

// Note: EnhancedARIMAAnalyzer class removed as it's not being used
// The component uses arimaService instead for ARIMA analysis

// Main ARIMA Component
interface ARIMAProps {
  data: TimeSeriesDataPoint[];
  onAnalyze?: (results: ARIMAResult[]) => void;
  forecastPeriods?: number;
  confidenceLevel?: number;
}

export default function EnhancedARIMA({ data, onAnalyze, forecastPeriods = 12 }: ARIMAProps) {
  const [params, setParams] = useState<ARIMAParams>({
    p: 1,
    d: 1,
    q: 1,
    seasonal: false,
    seasonalPeriod: 12
  });
  
  const [results, setResults] = useState<ARIMAResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Group data by field
  const BLOCKLIST = new Set(['id','ID','userId','orderId','customer_id']);
  const fieldGroups = useMemo(() => {
    const groups = data.reduce((groups, item) => {
      const fieldName = item.field || 'value';
      if (BLOCKLIST.has(String(fieldName))) return groups;
      const arr = groups[fieldName] || (groups[fieldName] = []);
      arr.push({ timestamp: item.timestamp, value: item.value });
      return groups;
    }, {} as Record<string, { timestamp: number; value: number }[]>);
    
    // Sort each group by timestamp
    Object.values(groups).forEach(group => {
      group.sort((a, b) => a.timestamp - b.timestamp);
    });
    
    return groups;
  }, [data]);

  const handleParamChange = useCallback((key: keyof ARIMAParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      // Test backend connectivity first
      try {
        console.log('🔍 Testing backend connectivity...');
        const healthResponse = await fetch('/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ Backend health check:', healthData);
      } catch (healthError) {
        console.error('❌ Backend health check failed:', healthError);
      }
      
      // Check if we have data to analyze
      if (!data || data.length === 0) {
        console.warn('No data available for ARIMA analysis');
        setResults([]);
        return;
      }

      const analysisResults: ARIMAResult[] = [];
      
      // Process each field group
      for (const [fieldName, fieldData] of Object.entries(fieldGroups)) {
        try {
          if (!fieldData || fieldData.length === 0) {
            console.warn(`No data for field: ${fieldName}`);
            continue;
          }

          // Allow small samples; just warn
          const MIN_POINTS = 3;
          if (fieldData.length < MIN_POINTS) {
            console.warn(`Small sample for ${fieldName}: ${fieldData.length} points (analysis may be unstable)`);
            // ⚠️ Do NOT push an empty result; continue to call the analyzer
          }
          
          console.log(`Series for ${fieldName}:`, fieldData.map(x => x.value));

          // Convert to API format
          const apiData: ARIMADataPoint[] = fieldData.map(d => ({
            timestamp: d.timestamp,
            value: d.value
          }));

          // Prepare API request
          const apiParams: ARIMAParameters = {
            p: params.p,
            d: params.d,
            q: params.q,
            seasonal: params.seasonal,
            seasonalPeriod: params.seasonalPeriod
          };

          const request = {
            data: apiData,
            parameters: apiParams,
            forecastPeriods: forecastPeriods,
            confidenceLevel: 0.95,
            log1p: true               // <<< add this
          };

          console.log(`🌐 Analyzing field: ${fieldName} with ${apiData.length} data points`);
          console.log('📊 Sample data:', apiData.slice(0, 3));
          console.log('🔧 Request parameters:', request);
          
          // Call ARIMA API
          console.log('🌐 Making API call to /api/arima/analyze...');
          console.log('🔧 Full request URL will be: /api/arima/analyze');
          console.log('🔧 Request body:', JSON.stringify(request, null, 2));
          
          const apiResponse = await arimaService.analyzeARIMA(request);
          console.log('✅ API Response:', apiResponse);
          console.log('ARIMA params from server:', apiResponse?.parameters);
          
          // Check if API response is successful
          if (!apiResponse.ok) {
            console.error(`❌ API failed for field ${fieldName}:`, apiResponse.warning || 'Unknown error');
            throw new Error(apiResponse.warning || 'API analysis failed');
          }
          
          // Convert API response to frontend format
          const originalData = fieldData.map(d => d.value);
          const result = arimaService.convertToARIMAResult(apiResponse, fieldName, originalData);
          
          // Compute metrics on original scale using local function as source of truth
          if (result.fittedValues && result.fittedValues.length > 0) {
            const localMetrics = rmseMae(result.originalData, result.fittedValues);
            console.log('📊 Local metrics (source of truth):', localMetrics);
            console.log('📊 Backend metrics:', result.metrics);
            
            // Update result with local metrics
            result.metrics.rmse = localMetrics.rmse;
            result.metrics.mae = localMetrics.mae;
          }
          
          console.log('🔄 Converted result:', result);
          
          analysisResults.push(result);
          
        } catch (error) {
          console.error(`Error analyzing field ${fieldName}:`, error);
          // Add empty result for failed analysis
          analysisResults.push({
            field: fieldName,
            originalData: fieldData ? fieldData.map(d => d.value) : [],
            fittedValues: [],
            residuals: [],
            forecast: [],
            forecastIntervals: { lower: [], upper: [] },
            metrics: { aic: 0, bic: 0, rmse: 0, mae: 0, mape: 0 },
            parameters: { ar: [], ma: [] },
            diagnostics: { stationarity: false, autocorrelation: [], ljungBox: 0 }
          });
        }
      }

      setResults(analysisResults);
      onAnalyze?.(analysisResults);
      
    } catch (error) {
      console.error('ARIMA analysis failed:', error);
      setResults([]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [fieldGroups, params, onAnalyze, data, forecastPeriods]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (results.length === 0) return [];
    const r = results[0];
    const actual = r.originalData ?? [];
    const fitted = r.fittedValues ?? [];
    const forecast = r.forecast ?? [];
    const lower = r.forecastIntervals?.lower ?? [];
    const upper = r.forecastIntervals?.upper ?? [];
    const offset = Math.max(params.p, params.q);
    const rows:any[] = [];

    for (let i = 0; i < actual.length; i++) {
      rows.push({
        index: i,
        actual: actual[i],
        fitted: i >= offset ? fitted[i - offset] ?? undefined : undefined
      });
    }
    for (let h = 0; h < forecast.length; h++) {
      rows.push({
        index: actual.length + h,
        forecast: forecast[h],
        lower: lower[h],
        upper: upper[h]
      });
    }
    return rows;
  }, [results, params.p, params.q]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Enhanced ARIMA Analysis</h2>
      
      {/* Parameter Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Parameters</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AR Order (p)
            </label>
            <input
              type="number"
              min="0"
              max="5"
              value={params.p}
              onChange={(e) => handleParamChange('p', parseInt(e.target.value) || 0)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Differencing (d)
            </label>
            <input
              type="number"
              min="0"
              max="2"
              value={params.d}
              onChange={(e) => handleParamChange('d', parseInt(e.target.value) || 0)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MA Order (q)
            </label>
            <input
              type="number"
              min="0"
              max="5"
              value={params.q}
              onChange={(e) => handleParamChange('q', parseInt(e.target.value) || 0)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seasonal
            </label>
            <select
              value={params.seasonal ? 'true' : 'false'}
              onChange={(e) => handleParamChange('seasonal', e.target.value === 'true')}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          
          {params.seasonal && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seasonal Period
              </label>
              <input
                type="number"
                min="2"
                max="24"
                value={params.seasonalPeriod}
                onChange={(e) => handleParamChange('seasonalPeriod', parseInt(e.target.value) || 12)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing || data.length === 0}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isAnalyzing ? 'Analyzing...' : 'Run Enhanced ARIMA Analysis'}
      </button>
      
      {/* Results */}
      {results.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Analysis Results</h3>
          
          {/* Chart */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-medium text-gray-700 mb-4">Time Series Forecast</h4>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  name="Actual"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="fitted" 
                  stroke="#059669" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Fitted"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  name="Forecast"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="upper" 
                  stroke="#fbbf24" 
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  name="Upper CI"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="lower" 
                  stroke="#fbbf24" 
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  name="Lower CI"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Metrics and Diagnostics */}
          {results.map((result, index) => (
            <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-lg font-medium text-gray-700 mb-4">
                Field: {result.field}
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-3 rounded shadow">
                  <div className="text-sm text-gray-600">RMSE</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {isNaN(result.metrics.rmse) ? 'N/A' : result.metrics.rmse.toFixed(4)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded shadow">
                  <div className="text-sm text-gray-600">MAE</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {isNaN(result.metrics.mae) ? 'N/A' : result.metrics.mae.toFixed(4)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded shadow">
                  <div className="text-sm text-gray-600">AIC</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {isNaN(result.metrics.aic) ? 'N/A' : result.metrics.aic.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded shadow">
                  <div className="text-sm text-gray-600">BIC</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {isNaN(result.metrics.bic) ? 'N/A' : result.metrics.bic.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded shadow">
                  <div className="text-sm text-gray-600 mb-2">Model Parameters</div>
                  <div className="text-sm">
                    <strong>AR:</strong> [{result.parameters.ar.length > 0 ? result.parameters.ar.map(p => isNaN(p) ? '0.000' : p.toFixed(3)).join(', ') : 'None'}]
                  </div>
                  <div className="text-sm">
                    <strong>MA:</strong> [{result.parameters.ma.length > 0 ? result.parameters.ma.map(p => isNaN(p) ? '0.000' : p.toFixed(3)).join(', ') : 'None'}]
                  </div>
                </div>
                <div className="bg-white p-3 rounded shadow">
                  <div className="text-sm text-gray-600 mb-2">Diagnostics</div>
                  <div className="text-sm">
                    <strong>Stationary:</strong> {result.diagnostics.stationarity ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm">
                    <strong>Ljung-Box:</strong> {isNaN(result.diagnostics.ljungBox) ? 'N/A' : result.diagnostics.ljungBox.toFixed(2)}
                  </div>
                </div>
              </div>
              
              {/* Enhanced Diagnostics using local statistical functions */}
              {result.residuals && result.residuals.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-md font-medium text-gray-700 mb-3">Enhanced Residual Diagnostics</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Local RMSE/MAE calculation */}
                    {result.fittedValues && result.fittedValues.length > 0 && (
                      <div className="bg-white p-3 rounded shadow">
                        <div className="text-sm text-gray-600 mb-2">Local Error Metrics</div>
                        {(() => {
                          const localMetrics = rmseMae(result.originalData, result.fittedValues);
                          return (
                            <>
                              <div className="text-sm">
                                <strong>Local RMSE:</strong> {localMetrics.rmse.toFixed(4)}
                              </div>
                              <div className="text-sm">
                                <strong>Local MAE:</strong> {localMetrics.mae.toFixed(4)}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                    
                    {/* Autocorrelation of residuals */}
                    <div className="bg-white p-3 rounded shadow">
                      <div className="text-sm text-gray-600 mb-2">Residual ACF (lags 1-5)</div>
                      {(() => {
                        const acfValues = acf(result.residuals, 5);
                        return (
                          <div className="text-sm">
                            {acfValues.map((val, idx) => (
                              <div key={idx}>
                                <strong>Lag {idx + 1}:</strong> {val.toFixed(3)}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Ljung-Box test */}
                    <div className="bg-white p-3 rounded shadow">
                      <div className="text-sm text-gray-600 mb-2">Ljung-Box Test</div>
                      {(() => {
                        const lbTest = ljungBox(result.residuals, 10, params.p, params.q);
                        return (
                          <>
                            <div className="text-sm">
                              <strong>Q-statistic:</strong> {lbTest.Q.toFixed(2)}
                            </div>
                            <div className="text-sm">
                              <strong>p-value:</strong> {lbTest.pval.toFixed(4)}
                            </div>
                            <div className="text-sm">
                              <strong>Significant:</strong> {lbTest.pval < 0.05 ? 'Yes' : 'No'}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Model Validation */}
              {result.residuals && result.residuals.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-md font-medium text-gray-700 mb-3">Model Validation</h5>
                  {(() => {
                    const validation = validateARIMAModel(result.originalData, result.residuals, params);
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded shadow">
                          <div className="text-sm text-gray-600 mb-2">Data & Parameter Validation</div>
                          <div className="text-sm">
                            <strong>Sufficient Data:</strong> 
                            <span className={validation.hasEnoughData ? 'text-green-600' : 'text-red-600'}>
                              {validation.hasEnoughData ? ' Yes' : ' No'}
                            </span>
                            <span className="text-gray-500"> (min: {validation.minRequiredData})</span>
                          </div>
                          <div className="text-sm">
                            <strong>Valid Parameters:</strong> 
                            <span className={validation.validParams ? 'text-green-600' : 'text-red-600'}>
                              {validation.validParams ? ' Yes' : ' No'}
                            </span>
                          </div>
                          <div className="text-sm">
                            <strong>Overfitting Risk:</strong> 
                            <span className={validation.overfittingRisk ? 'text-red-600' : 'text-green-600'}>
                              {validation.overfittingRisk ? ' High' : ' Low'}
                            </span>
                            <span className="text-gray-500"> ({validation.totalParams} params)</span>
                          </div>
                        </div>
                        
                        <div className="bg-white p-3 rounded shadow">
                          <div className="text-sm text-gray-600 mb-2">Residual Properties</div>
                          <div className="text-sm">
                            <strong>Mean:</strong> {validation.residualMean}
                          </div>
                          <div className="text-sm">
                            <strong>Std Dev:</strong> {validation.residualStd}
                          </div>
                          <div className="text-sm">
                            <strong>Normality Score:</strong> {validation.normalityScore}
                            <span className="text-gray-500"> (target: ~1.35)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
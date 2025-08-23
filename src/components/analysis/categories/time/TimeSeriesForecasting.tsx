import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart3, Settings } from 'lucide-react';
import type { DataField } from '../../../../types/data';
import { gridSearchHolt } from '@/utils/analysis/timeSeries/holtCalculations';

interface TimeSeriesForecastingProps {
  fields: DataField[];
}

// Simple ExponentialSmoothingView component
interface ExponentialSmoothingViewProps {
  series: number[];
  horizon: number;
  holdout: number;
}

function ExponentialSmoothingView({ series, horizon, holdout }: ExponentialSmoothingViewProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runForecast = async () => {
    if (series.length < 3) return;
    
    setLoading(true);
    try {
      // Use the shared gridSearchHolt helper for correct Holt implementation
      const res = gridSearchHolt(series, horizon, undefined, undefined, holdout);
      
      setResult({
        alpha: res.alpha,
        beta: res.beta,
        forecast: res.pointForecasts,
        metrics: res.metrics
      });
    } catch (error) {
      console.error('Forecast error:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (series.length >= 3) {
      runForecast();
    }
  }, [series, horizon, holdout]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Running forecast...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p>Click to run forecast</p>
        <button 
          onClick={runForecast}
          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Run Forecast
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-lg font-semibold">{result.alpha.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Alpha</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">{result.beta.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Beta</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">{result.metrics.MAE.toFixed(2)}</div>
          <div className="text-sm text-gray-600">MAE</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">{result.metrics.RMSE.toFixed(2)}</div>
          <div className="text-sm text-gray-600">RMSE</div>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-2">Forecast Values</h4>
        <div className="grid grid-cols-5 gap-2">
          {result.forecast.map((value: number, index: number) => (
            <div key={index} className="text-center p-2 bg-gray-100 rounded">
              <div className="font-mono text-sm">{value.toFixed(2)}</div>
              <div className="text-xs text-gray-500">t+{index + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TimeSeriesForecasting({ fields }: TimeSeriesForecastingProps) {
  const [selectedField, setSelectedField] = useState<string>('');
  const [horizon, setHorizon] = useState(12);
  const [holdout, setHoldout] = useState<number | null>(null);
  const [useAPI, setUseAPI] = useState(false);

  // Get numeric fields that could be used for time series forecasting
  const numericFields = useMemo(() => {
    return fields.filter(field => field.type === 'number' && field.value?.length >= 3);
  }, [fields]);

  // Get the selected field's data
  const selectedFieldData = useMemo(() => {
    if (!selectedField) return null;
    const field = fields.find(f => f.name === selectedField);
    return field?.value?.map((v: any) => Number(v)).filter((v: number) => !isNaN(v)) || [];
  }, [selectedField, fields]);

  // Auto-select first numeric field if none selected
  React.useEffect(() => {
    if (!selectedField && numericFields.length > 0) {
      setSelectedField(numericFields[0].name);
    }
  }, [selectedField, numericFields]);

  if (numericFields.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Time Series Forecasting</h3>
        </div>
        <div className="text-gray-500 text-center py-8">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No suitable numeric fields found for forecasting.</p>
          <p className="text-sm">Requires at least 3 numeric data points.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Time Series Forecasting</h3>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Field
          </label>
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {numericFields.map(field => (
              <option key={field.name} value={field.name}>
                {field.name} ({field.value?.length} points)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Forecast Horizon
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Holdout Size (Optional)
          </label>
          <input
            type="number"
            min="0"
            max="20"
            placeholder="Auto"
            value={holdout || ''}
            onChange={(e) => setHoldout(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty for auto (20% of data)</p>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={useAPI}
              onChange={(e) => setUseAPI(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Use API (Backend)
          </label>
        </div>
      </div>

      {/* Data Preview */}
      {selectedFieldData && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Data Preview</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600 font-mono">
              {selectedFieldData.slice(0, 10).join(', ')}
              {selectedFieldData.length > 10 && ` ... (${selectedFieldData.length} total points)`}
            </div>
          </div>
        </div>
      )}

      {/* Forecasting Results */}
      {selectedFieldData && selectedFieldData.length >= 3 && (
        <div className="border-t pt-6">
          <ExponentialSmoothingView
            series={selectedFieldData}
            horizon={horizon}
            holdout={holdout || 5}
          />
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Holt Exponential Smoothing</p>
            <p>
              This method is ideal for time series with trends. It uses two parameters:
              <strong>α (alpha)</strong> for level smoothing and <strong>β (beta)</strong> for trend smoothing.
              The model automatically optimizes these parameters for best performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
}
import { Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Minus, Loader2, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

interface TimeSeriesViewProps {
  results: TimeSeriesResult[];
  isLoading?: boolean;
  error?: string | null;
}

export default function TimeSeriesView({ results, isLoading = false, error = null }: TimeSeriesViewProps) {
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Time Series Components',
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  }), []);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">Analyzing time series data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-red-600 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-gray-500">No time series data available for analysis</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="text-indigo-600" />
        <h3 className="text-lg font-semibold text-black-500">Time Series Analysis</h3>
      </div>

      <div className="space-y-8">
        {results.map((result, index) => (
          <div key={index} className="border-b border-gray-100 pb-6 last:border-0">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-800">{result.field}</h4>
              <div className="flex items-center gap-2">
                {result.trend === 'increasing' ? (
                  <TrendingUp className="text-green-500 w-4 h-4" />
                ) : result.trend === 'decreasing' ? (
                  <TrendingDown className="text-red-500 w-4 h-4" />
                ) : (
                  <Minus className="text-gray-500 w-4 h-4" />
                )}
                <span className={`text-sm font-medium ${
                  result.trend === 'increasing' ? 'text-green-600' :
                  result.trend === 'decreasing' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {result.trend}
                </span>
              </div>
            </div>

            {/* Seasonality */}
            {result.seasonality !== null && result.seasonality !== undefined && (
              <div className="mb-4">
                <span className="text-sm text-black">
                  Detected seasonality: {result.seasonality} periods
                </span>
              </div>
            )}

            {/* Model Confidence */}
            {result.confidence !== undefined && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-black">Model Confidence:</span>
                <div className="flex-1 max-w-xs">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
            )}

            {/* Components Chart */}
            {result.components && result.components.trend && result.components.seasonal && result.components.residual && (
              <div className="h-64 mb-6">
                <Line
                  data={{
                    labels: Array.from(
                      { length: result.components.trend.length },
                      (_, i) => i + 1
                    ),
                    datasets: [
                      {
                        label: 'Trend',
                        data: result.components.trend,
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                      },
                      {
                        label: 'Seasonal',
                        data: result.components.seasonal,
                        borderColor: 'rgb(244, 63, 94)',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                      },
                      {
                        label: 'Residual',
                        data: result.components.residual,
                        borderColor: 'rgb(234, 179, 8)',
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderDash: [5, 5],
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              </div>
            )}

            {/* Forecast Chart */}
            {result.forecast && result.forecast.length > 0 && (
              <div className="h-64">
                <Line
                  data={{
                    labels: Array.from(
                      { length: result.forecast.length },
                      (_, i) => `t+${i + 1}`
                    ),
                    datasets: [{
                      label: 'Forecast',
                      data: result.forecast,
                      borderColor: 'rgb(99, 102, 241)',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      fill: true,
                    }],
                  }}
                  options={{
                    ...chartOptions,
                    plugins: {
                      title: {
                        display: true,
                        text: 'Forecast',
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 
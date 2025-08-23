import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  TrendingUp, 
  AlertCircle, 
  LineChart, 
  Hash, 
  Minimize2
} from 'lucide-react';
import { DataField } from '@/types/data';
import { formatNumber } from '@/utils/analysis/formatting';

// Types
interface RegressionResult {
  field: string;
  coefficients: number[];
  intercept: number;
  rSquared: number;
  standardError: number;
  predictions: number[];
  actualValues: number[];
  equation: string;
  confidence: {
    upper: number[];
    lower: number[];
  };
  metrics: {
    rmse: number;
    mae: number;
  };
}

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  params: ModelParam[];
}

interface ModelParam {
  name: string;
  type: 'number' | 'select';
  label: string;
  default: number | string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
}

// Model configurations
const models: ModelConfig[] = [
  {
    id: 'linear',
    name: 'Linear Regression',
    description: 'Simple linear relationship',
    icon: TrendingUp,
    params: []
  },
  {
    id: 'polynomial',
    name: 'Polynomial Regression',
    description: 'Non-linear patterns',
    icon: LineChart,
    params: [
      {
        name: 'degree',
        type: 'number',
        label: 'Polynomial Degree',
        default: 2,
        min: 2,
        max: 5,
        step: 1
      }
    ]
  },
  {
    id: 'ridge',
    name: 'Ridge Regression',
    description: 'L2 regularization',
    icon: Hash,
    params: [
      {
        name: 'alpha',
        type: 'number',
        label: 'Regularization Strength',
        default: 1.0,
        min: 0,
        max: 10,
        step: 0.1
      }
    ]
  },
  {
    id: 'lasso',
    name: 'Lasso Regression',
    description: 'L1 regularization',
    icon: Minimize2,
    params: [
      {
        name: 'alpha',
        type: 'number',
        label: 'Regularization Strength',
        default: 1.0,
        min: 0,
        max: 10,
        step: 0.1
      }
    ]
  }
];

// Components
const MetricCard = ({ title, value, description }: MetricCardProps) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200">
    <h5 className="text-sm font-medium text-gray-600 mb-2">{title}</h5>
    <p className="text-2xl font-semibold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{description}</p>
  </div>
);

const ModelQuality = ({ rSquared, standardError, equation }: { 
  rSquared: number; 
  standardError: number; 
  equation: string;
}) => {
  const getQualityColor = (r2: number) => {
    if (r2 > 0.7) return 'text-green-600';
    if (r2 > 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (r2: number) => {
    if (r2 > 0.7) return 'Strong fit';
    if (r2 > 0.5) return 'Moderate fit';
    return 'Weak fit';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h5 className="text-sm font-medium text-gray-600 mb-2">Regression Equation</h5>
        <div className="bg-gray-50 p-3 rounded-md overflow-x-auto">
          <code className="text-sm font-mono whitespace-nowrap">{equation}</code>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h5 className="text-sm font-medium text-gray-600 mb-3">Model Fit (R²)</h5>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="h-3 bg-gray-100 rounded-full">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getQualityColor(rSquared)}`}
                    style={{ width: `${rSquared * 100}%` }}
                  />
                </div>
              </div>
              <span className={`text-sm font-medium ${getQualityColor(rSquared)}`}>
                {(rSquared * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-gray-500">{getQualityLabel(rSquared)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h5 className="text-sm font-medium text-gray-600 mb-3">Prediction Error</h5>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-gray-900">±{formatNumber(standardError)}</span>
            </div>
            <p className="text-xs text-gray-500">Average deviation from predicted values</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const calculateRegression = (
  target: number[],
  features: number[][]
): RegressionResult => {
  const n = target.length;
  const x = features[0];
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = target.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * target[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predictions = x.map(xi => slope * xi + intercept);
  const rSquaredResult = calculateRSquared(target, predictions);
  const standardError = calculateStandardError(target, predictions);

  return {
    field: 'target',
    coefficients: [slope],
    intercept,
    rSquared: rSquaredResult.r2Score,
    standardError,
    predictions,
    actualValues: target,
    equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
    confidence: calculateConfidenceIntervals(predictions, standardError),
    metrics: {
      rmse: calculateRMSE(target, predictions).rmse,
      mae: calculateMAE(target, predictions).mae
    }
  };
};

// Main Component
interface ConsolidatedRegressionAnalysisProps {
  data: {
    fields: DataField[];
  };
}

export function ConsolidatedRegressionAnalysis({ data }: ConsolidatedRegressionAnalysisProps) {
  const [selectedModel, setSelectedModel] = useState<string>('linear');
  const [modelParams, setModelParams] = useState<Record<string, number | string>>({});
  const [targetField, setTargetField] = useState<string>('');
  const [featureFields, setFeatureFields] = useState<string[]>([]);
  const [results, setResults] = useState<RegressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const numericFields = data?.fields?.filter(f => f.type === 'number') || [];

  const handleRunAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);

      const target = numericFields.find(f => f.name === targetField);
      const features = numericFields.filter(f => featureFields.includes(f.name));

      if (!target || features.length === 0) {
        setError('Please select target and feature fields');
        return;
      }

      // Prepare data for regression
      const targetValues = target.value as number[];
      const featureValues = features.map(f => f.value as number[]);

      // Perform regression analysis
      const result = calculateRegression(
        targetValues,
        featureValues
      );

      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (numericFields.length < 2) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-yellow-600" />
        <p className="text-yellow-700">At least two numeric fields are required for regression analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Regression Model</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {models.map(model => {
            const Icon = model.icon;
            return (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  selectedModel === model.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">{model.name}</h4>
                    <p className="text-sm text-gray-500">{model.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Model Parameters */}
        {(() => {
          const model = models.find(m => m.id === selectedModel);
          if (!model || model.params.length === 0) return null;
          
          return (
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-gray-900">Model Parameters</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {model.params.map(param => (
                  <div key={param.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {param.label}
                    </label>
                    {param.type === 'number' ? (
                      <input
                        type="number"
                        value={modelParams[param.name] ?? param.default}
                        onChange={e => setModelParams(prev => ({
                          ...prev,
                          [param.name]: parseFloat(e.target.value)
                        }))}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    ) : (
                      <select
                        value={modelParams[param.name] ?? param.default}
                        onChange={e => setModelParams(prev => ({
                          ...prev,
                          [param.name]: e.target.value
                        }))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        {param.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Field Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Target Field
          </label>
          <select
            value={targetField}
            onChange={(e) => setTargetField(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="" className="text-black">Select target field</option>
            {numericFields.map((field) => (
              <option key={field.name} value={field.name} className="text-black">
                {field.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feature Fields
          </label>
          <select
            multiple
            value={featureFields}
            onChange={(e) => setFeatureFields(Array.from(e.target.selectedOptions, option => option.value))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {numericFields
              .filter(f => f.name !== targetField)
              .map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleRunAnalysis}
        disabled={isAnalyzing || !targetField || featureFields.length === 0}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Analyzing...
          </div>
        ) : (
          'Run Analysis'
        )}
      </button>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Model Quality */}
          <ModelQuality 
            rSquared={results.rSquared}
            standardError={results.standardError}
            equation={results.equation}
          />

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="R-squared"
              value={(results.rSquared * 100).toFixed(1) + '%'}
              description="Coefficient of determination"
            />
            <MetricCard
              title="RMSE"
              value={formatNumber(results.metrics.rmse)}
              description="Root Mean Square Error"
            />
            <MetricCard
              title="MAE"
              value={formatNumber(results.metrics.mae)}
              description="Mean Absolute Error"
            />
          </div>

          {/* Predictions Chart */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">Predictions vs Actual</h4>
            <div className="h-[300px]">
              <Line
                data={{
                  labels: Array.from({ length: results.actualValues.length }, (_, i) => i + 1),
                  datasets: [
                    {
                      label: 'Actual',
                      data: results.actualValues,
                      borderColor: 'rgb(99, 102, 241)',
                      backgroundColor: 'transparent',
                      pointRadius: 2
                    },
                    {
                      label: 'Predicted',
                      data: results.predictions,
                      borderColor: 'rgb(34, 197, 94)',
                      backgroundColor: 'transparent',
                      borderDash: [5, 5],
                      pointRadius: 0
                    },
                    {
                      label: 'Confidence Interval',
                      data: results.confidence.upper,
                      borderColor: 'rgba(99, 102, 241, 0.2)',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      borderDash: [2, 2],
                      pointRadius: 0,
                      fill: '+1'
                    },
                    {
                      label: 'Confidence Interval',
                      data: results.confidence.lower,
                      borderColor: 'rgba(99, 102, 241, 0.2)',
                      backgroundColor: 'transparent',
                      borderDash: [2, 2],
                      pointRadius: 0
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Model Predictions'
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Residuals Chart */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">Residual Analysis</h4>
            <div className="h-[300px]">
              <Line
                data={{
                  labels: Array.from({ length: results.actualValues.length }, (_, i) => i + 1),
                  datasets: [{
                    label: 'Residuals',
                    data: results.actualValues.map((actual, i) => actual - results.predictions[i]),
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    pointRadius: 2
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Residual Plot'
                    }
                  },
                  scales: {
                    y: {
                      title: {
                        display: true,
                        text: 'Residual'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Observation'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsolidatedRegressionAnalysis;

// Import unified metric calculations from MLFormulas
import { calculateRSquared, calculateRMSE, calculateMAE, calculateStandardError } from '@/utils/analysis/ml/MLFormulas';
import { zFor } from '@/utils/analysis/timeSeries/holtCalculations';

const calculateConfidenceIntervals = (
  predictions: number[],
  standardError: number,
  confidence: number = 0.95
): { upper: number[]; lower: number[] } => {
  const zScore = zFor(confidence);
  return {
    upper: predictions.map(p => p + zScore * standardError),
    lower: predictions.map(p => p - zScore * standardError)
  };
}; 
import React from 'react';
import { Filter, Settings2, TrendingUp } from 'lucide-react';
import { DataField } from '@/types/data';

interface RegressionFiltersProps {
  fields: DataField[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
  modelParams: Record<string, number>;
  onParamsChange: (params: Record<string, number>) => void;
}

export function RegressionFilters({
  fields,
  selectedModel,
  onModelChange,
  selectedFeatures,
  onFeaturesChange,
  modelParams,
  onParamsChange
}: RegressionFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  const models = [
    { id: 'linear', name: 'Linear', params: [] },
    { id: 'multiple-linear', name: 'Multiple Linear', params: [] },
    { id: 'logistic', name: 'Logistic', params: [{ name: 'threshold', label: 'Threshold', min: 0.1, max: 0.9, default: 0.5 }] },
    { id: 'polynomial', name: 'Polynomial', params: [{ name: 'degree', label: 'Degree', min: 2, max: 5, default: 2 }] },
    { id: 'ridge', name: 'Ridge (L2)', params: [{ name: 'alpha', label: 'Alpha', min: 0.01, max: 10, default: 1.0 }] },
    { id: 'lasso', name: 'Lasso (L1)', params: [{ name: 'alpha', label: 'Alpha', min: 0.01, max: 10, default: 1.0 }] },
    { id: 'elastic-net', name: 'Elastic Net', params: [
      { name: 'alpha', label: 'Alpha', min: 0.01, max: 10, default: 1.0 },
      { name: 'l1_ratio', label: 'L1 Ratio', min: 0, max: 1, default: 0.5 }
    ]},
    { id: 'stepwise', name: 'Stepwise', params: [{ name: 'threshold', label: 'Threshold', min: 0.01, max: 0.1, default: 0.05 }] },
    { id: 'time-series', name: 'Time Series', params: [{ name: 'window', label: 'Window Size', min: 2, max: 20, default: 5 }] },
    { id: 'quantile', name: 'Quantile', params: [{ name: 'quantile', label: 'Quantile', min: 0.1, max: 0.9, default: 0.5 }] },
    { id: 'log-log', name: 'Log-Log', params: [] }
  ];

  const numericFields = fields.filter(f => f.type === 'number');
  const selectedModelConfig = models.find(m => m.id === selectedModel);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-black-600" />
          <h3 className="font-medium font-semibold text-black">Regression Filters</h3>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Regression Model
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => onModelChange(model.id)}
                className={`p-2 rounded-lg border text-left transition-colors ${
                  selectedModel === model.id
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 hover:border-teal-200 hover:bg-teal-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">{model.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Features
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {numericFields.map(field => (
              <label
                key={field.name}
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(field.name)}
                  onChange={(e) => {
                    const newFeatures = e.target.checked
                      ? [...selectedFeatures, field.name]
                      : selectedFeatures.filter(f => f !== field.name);
                    onFeaturesChange(newFeatures);
                  }}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm">{field.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Model Parameters */}
        {selectedModelConfig && selectedModelConfig.params.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Parameters
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedModelConfig.params.map(param => (
                <div key={param.name}>
                  <label className="block text-sm text-gray-600 mb-1">
                    {param.label}
                  </label>
                  <input
                    type="number"
                    value={modelParams[param.name] ?? param.default}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isFinite(value) && value >= param.min && value <= param.max) {
                        onParamsChange({
                          ...modelParams,
                          [param.name]: value
                        });
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure value is within bounds on blur
                      const value = parseFloat(e.target.value);
                      if (!isFinite(value)) {
                        onParamsChange({
                          ...modelParams,
                          [param.name]: param.default
                        });
                      }
                    }}
                    min={param.min}
                    max={param.max}
                    step={0.01}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
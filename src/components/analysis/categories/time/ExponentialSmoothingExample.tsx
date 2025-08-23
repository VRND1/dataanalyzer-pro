import  { useState } from 'react';
import type { FC } from 'react';
import { ExponentialSmoothing } from './ExponentialSmoothing';

const ExponentialSmoothingExample: FC = () => {
  const [mode, setMode] = useState<'simple' | 'intermediate' | 'advanced'>('simple');
  
  // Sample time series data (monthly sales)
  const sampleData = [
    { timestamp: 1, value: 100, field: 'sales' },
    { timestamp: 2, value: 120, field: 'sales' },
    { timestamp: 3, value: 140, field: 'sales' },
    { timestamp: 4, value: 160, field: 'sales' },
    { timestamp: 5, value: 180, field: 'sales' },
    { timestamp: 6, value: 200, field: 'sales' },
    { timestamp: 7, value: 220, field: 'sales' },
    { timestamp: 8, value: 240, field: 'sales' },
    { timestamp: 9, value: 260, field: 'sales' },
    { timestamp: 10, value: 280, field: 'sales' },
    { timestamp: 11, value: 300, field: 'sales' },
    { timestamp: 12, value: 320, field: 'sales' }
  ];
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Exponential Smoothing Examples
      </h2>
      
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Mode Selection</h3>
        <div className="flex gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="simple"
              checked={mode === 'simple'}
              onChange={(e) => setMode(e.target.value as any)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Simple</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="intermediate"
              checked={mode === 'intermediate'}
              onChange={(e) => setMode(e.target.value as any)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Intermediate</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="advanced"
              checked={mode === 'advanced'}
              onChange={(e) => setMode(e.target.value as any)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Advanced</span>
          </label>
        </div>
      </div>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Sample Data (Monthly Sales)</h3>
        <div className="text-sm text-gray-600 font-mono bg-white p-3 rounded border">
          {sampleData.map(d => d.value).join(', ')}
        </div>
      </div>
      
      <ExponentialSmoothing
        data={sampleData}
        mode={mode}
        horizon={6}
        holdout={4}
        forecastPeriods={6}
        confidenceLevel={0.95}
      />
      
      <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <h4 className="font-semibold text-green-800 mb-3">📊 Mode Descriptions</h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-green-800">
          <div>
            <h5 className="font-medium mb-2">🎯 Simple Mode:</h5>
            <ul className="space-y-1 list-disc list-inside text-green-700">
              <li>Basic forecasting with minimal UI</li>
              <li>Shows α, β parameters and basic metrics</li>
              <li>Perfect for quick forecasts</li>
              <li>Lightweight and fast</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">📈 Intermediate Mode:</h5>
            <ul className="space-y-1 list-disc list-inside text-green-700">
              <li>Enhanced metrics with R² calculation</li>
              <li>Better visual presentation</li>
              <li>Holdout validation included</li>
              <li>Good balance of features and simplicity</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">🚀 Advanced Mode:</h5>
            <ul className="space-y-1 list-disc list-inside text-green-700">
              <li>Full-featured time series analysis</li>
              <li>Multiple model types and parameter optimization</li>
              <li>Comprehensive diagnostics and visualizations</li>
              <li>Professional-grade analytics suite</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExponentialSmoothingExample;

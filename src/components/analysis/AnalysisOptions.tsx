import { Brain } from 'lucide-react';

interface AnalysisOptionsProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
}

export function AnalysisOptions({ selectedMethod, onMethodChange }: AnalysisOptionsProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-6 h-6 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Analysis Method</h3>
      </div>
      
      <div className="w-full">
        <select
          value={selectedMethod}
          onChange={(e) => onMethodChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
        >
          <option value="arima" className="text-black">ARIMA</option>
          <option value="exponential" className="text-black">Exponential Smoothing</option>
          <option value="prophet" className="text-black">Prophet</option>
          <option value="lstm" className="text-black">LSTM</option>
        </select>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        {selectedMethod === 'arima' && (
          <p>ARIMA (AutoRegressive Integrated Moving Average) is suitable for time series forecasting with trends and seasonality.</p>
        )}
        {selectedMethod === 'exponential' && (
          <p>Exponential Smoothing is ideal for time series data with varying levels and trends.</p>
        )}
        {selectedMethod === 'prophet' && (
          <p>Prophet is designed for business time series with strong seasonal patterns and multiple seasonality.</p>
        )}
        {selectedMethod === 'lstm' && (
          <p>LSTM (Long Short-Term Memory) is a deep learning approach for complex time series patterns.</p>
        )}
      </div>
    </div>
  );
} 
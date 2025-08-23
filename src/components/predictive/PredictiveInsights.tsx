import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface Prediction {
  fieldName: string;
  predictions: number[];
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
}

interface PredictiveInsightsProps {
  predictions: Prediction[];
}

export function PredictiveInsights({ predictions }: PredictiveInsightsProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!predictions || predictions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-black">Predictive Insights</h3>
        <div className="flex items-center justify-center p-6 text-gray-500">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>No predictions available. Please ensure you have numeric data loaded.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-black">Predictive Insights</h3>
      <div className="space-y-4">
        {predictions.map((prediction, index) => (
          <div key={index} className="border-b pb-4 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{prediction.fieldName}</span>
              <div className="flex items-center gap-2">
                {getTrendIcon(prediction.trend)}
                <span className={`font-semibold ${
                  prediction.trend === 'increasing' ? 'text-green-600' :
                  prediction.trend === 'decreasing' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {prediction.changePercentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Confidence: {(prediction.confidence * 100).toFixed(1)}%</span>
              <span>Predicted Values: {prediction.predictions.length}</span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <span>Next predicted values: </span>
              {prediction.predictions.map((value, i) => (
                <span key={i} className="ml-1">{value}{i < prediction.predictions.length - 1 ? ',' : ''}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
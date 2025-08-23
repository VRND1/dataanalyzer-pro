import React, { useState, useEffect } from 'react';
import { Brain, Info, AlertCircle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// ✅ Import accurate formulas
import {
  calculateRSquared,
  calculateMAE,
  calculateAccuracyWithTolerance,
  calculateBinaryAccuracy
} from '@/utils/analysis/ml/MLFormulas';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Feature {
  name: string;
  importance: number;
}

interface MLInsightsProps {
  predictions: Record<string, number[]>;
  actuals: number[];
  features: string[];
  confidence?: number;
}

const MLInsights: React.FC<MLInsightsProps> = ({ predictions, actuals, features }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{ features: Feature[]; metrics: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeData = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      if (!actuals || actuals.length === 0) {
        throw new Error('No actual values provided for analysis');
      }

      // Take the first prediction set for metrics
      const firstPredictions = Object.values(predictions)[0] || [];

      if (firstPredictions.length !== actuals.length) {
        throw new Error('Predictions and actual values length mismatch');
      }

      // ✅ Use accurate formulas
      const r2 = calculateRSquared(actuals, firstPredictions).r2Score;
      const mae = calculateMAE(actuals, firstPredictions).mae;
      const toleranceAcc = calculateAccuracyWithTolerance(actuals, firstPredictions, 0.05);
      const binaryAcc = calculateBinaryAccuracy(actuals, firstPredictions, 0.5);

      const metrics = {
        r2,
        mae,
        toleranceAcc,
        binaryAcc
      };

      // Feature importance (dummy for now — can be replaced with actual model output)
      const featureImportance: Feature[] = features.map(feat => ({
        name: feat,
        importance: Math.random() * 0.8 + 0.2
      })).sort((a, b) => b.importance - a.importance);

      setAnalysis({ features: featureImportance, metrics });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    analyzeData();
  }, [predictions, actuals, features]);

  if (isAnalyzing) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm text-center">
        <div className="animate-pulse flex flex-col items-center">
          <Brain className="w-8 h-8 text-indigo-300 mb-2" />
          <p className="text-gray-500">Analyzing data patterns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <Info className="w-5 h-5" />
          <p>No analysis available</p>
        </div>
      </div>
    );
  }

  const chartLabels = Array.from({ length: actuals.length }, (_, i) => `Point ${i + 1}`);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">Machine Learning Insights</h3>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard title="R² Score" value={analysis.metrics.r2.toFixed(4)} />
        <MetricCard title="MAE" value={analysis.metrics.mae.toFixed(4)} />
        <MetricCard title="Accuracy (±5%)" value={`${analysis.metrics.toleranceAcc.toFixed(2)}%`} />
        <MetricCard title="Binary Accuracy" value={`${analysis.metrics.binaryAcc.toFixed(2)}%`} />
      </div>

      {/* Predictions Chart */}
      <div className="h-64 mb-6">
        <Line
          data={{
            labels: chartLabels,
            datasets: [
              {
                label: 'Actual Values',
                data: actuals,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.1
              },
              {
                label: 'Predictions',
                data: Object.values(predictions)[0] || [],
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderDash: [5, 5],
                tension: 0.1
              }
            ]
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </div>

      {/* Feature Importance */}
      {analysis.features.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Feature Importance</h4>
          <div className="space-y-2">
            {analysis.features.map((feature, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{feature.name}</span>
                <div className="flex items-center gap-2 w-1/2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-indigo-600"
                      style={{ width: `${feature.importance * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">
                    {(feature.importance * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg text-center">
      <h4 className="text-sm font-medium text-gray-700 mb-1">{title}</h4>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export { MLInsights };
export default MLInsights;

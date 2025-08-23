import { Calculator } from 'lucide-react';
import { AnalysisHeader } from './AnalysisHeader';

interface RegressionAnalysisProps {
}

interface RegressionMetrics {
  r2: number;
  rmse: number;
  mae: number;
  adjustedR2: number;
}

export function RegressionAnalysis({}: RegressionAnalysisProps) {
  const results: Record<string, RegressionMetrics> = {
    profile_pic: { r2: NaN, rmse: 0, mae: 0, adjustedR2: NaN },
    length_username: { r2: NaN, rmse: 0, mae: 0, adjustedR2: NaN },
    fullname_words: { r2: 100, rmse: 2.52e96, mae: 2.52e96, adjustedR2: 100 },
    length_fullname: { r2: NaN, rmse: 0, mae: 0, adjustedR2: NaN },
    username: { r2: 100, rmse: 1.12e96, mae: 1.12e96, adjustedR2: 100 },
    description_length: { r2: NaN, rmse: 0, mae: 3.16e154, adjustedR2: NaN },
    external_URL: { r2: 100, rmse: 2.65e85, mae: 2.65e85, adjustedR2: 100 },
    private: { r2: 100, rmse: 2.52e96, mae: 2.52e96, adjustedR2: 100 },
    posts: { r2: NaN, rmse: 0, mae: 0, adjustedR2: NaN },
    followers: { r2: NaN, rmse: 0, mae: 0, adjustedR2: NaN },
    follows: { r2: NaN, rmse: 0, mae: 0, adjustedR2: NaN },
    fake: { r2: 100, rmse: 2.79e36, mae: 2.79e36, adjustedR2: 100 }
  };

  return (
    <div className="space-y-6">
      <AnalysisHeader 
        title="Regression Analysis" 
        icon={<Calculator className="w-5 h-5 text-black" />}
      />
      
      <h3 className="font-medium font-bold text-black">Time Analysis</h3>
      
      <div className="space-y-4">
        {Object.entries(results).map(([field, metrics]) => (
          <div key={field} className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h4 className="font-medium text-black mb-2">{field}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-black font-medium">R² Score</p>
                <p className="text-lg font-semibold text-black">{isNaN(metrics.r2) ? 'NaN%' : `${metrics.r2.toFixed(2)}%`}</p>
              </div>
              <div>
                <p className="text-sm text-black font-medium">RMSE</p>
                <p className="text-lg font-semibold text-black">{metrics.rmse === 0 ? '0.00' : metrics.rmse.toExponential(2)}</p>
              </div>
              <div>
                <p className="text-sm text-black font-medium">MAE</p>
                <p className="text-lg font-semibold text-black">{metrics.mae === 0 ? '0.00' : metrics.mae.toExponential(2)}</p>
              </div>
              <div>
                <p className="text-sm text-black font-medium">Adj. R²</p>
                <p className="text-lg font-semibold text-black">{isNaN(metrics.adjustedR2) ? 'NaN%' : `${metrics.adjustedR2.toFixed(2)}%`}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
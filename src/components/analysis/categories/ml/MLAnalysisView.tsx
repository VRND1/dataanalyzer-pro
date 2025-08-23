// FILE: MLAnalysisView.tsx (UPDATED FINAL VERSION)
import { TrendingUp, Activity } from 'lucide-react';
import { formatNumber, formatPercentage } from '@/utils/analysis/formatting';
import { MetricCard } from './MetricCard';

interface MLAnalysisViewProps {
  analysis: {
    evaluation: {
      r2?: number;
      mae?: number;
      accuracy?: number;
      binaryAccuracy?: number;
    };
  };
  isRegression: boolean;
}

const MLAnalysisView = ({ analysis, isRegression }: MLAnalysisViewProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      {isRegression ? (
        <>
          <MetricCard
            title="R² Score"
            value={formatNumber(analysis.evaluation.r2 || 0)}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <MetricCard
            title="MAE"
            value={formatNumber(analysis.evaluation.mae || 0)}
            icon={<Activity className="w-4 h-4" />}
          />
        </>
      ) : (
        <>
          <MetricCard
            title="Accuracy"
            value={formatPercentage(analysis.evaluation.accuracy || 0)}
          />
          <MetricCard
            title="Binary Accuracy"
            value={formatPercentage(analysis.evaluation.binaryAccuracy || 0)}
          />
        </>
      )}
    </div>
  );
};

export { MLAnalysisView };

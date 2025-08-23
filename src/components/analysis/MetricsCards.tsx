import type { FC } from 'react';
import type { Metrics } from '../../utils/analysis/timeSeries/predictor';

interface MetricsCardsProps {
  metrics: Metrics | null;
  className?: string;
}

interface MetricCardProps {
  label: string;
  value: string;
  description?: string;
}

const MetricCard: FC<MetricCardProps> = ({ label, value, description }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
    <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    {description && (
      <div className="text-xs text-gray-500 mt-1">{description}</div>
    )}
  </div>
);

export const MetricsCards: FC<MetricsCardsProps> = ({ metrics, className = '' }) => {
  if (!metrics) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
        <MetricCard label="MAE" value="-" />
        <MetricCard label="RMSE" value="-" />
        <MetricCard label="sMAPE" value="-" />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <MetricCard 
        label="MAE" 
        value={metrics.MAE.toFixed(2)}
        description="Mean Absolute Error"
      />
      <MetricCard 
        label="RMSE" 
        value={metrics.RMSE.toFixed(2)}
        description="Root Mean Square Error"
      />
      <MetricCard 
        label="sMAPE" 
        value={metrics.sMAPE ? `${metrics.sMAPE.toFixed(2)}%` : '-'}
        description="Symmetric Mean Absolute Percentage Error"
      />
    </div>
  );
};

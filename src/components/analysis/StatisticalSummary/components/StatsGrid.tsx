import { DataField } from '../../../../types/data';
import { calculateFieldStats } from '../../../../utils/analysis/statistics';
import { formatNumber } from '../../../../utils/analysis/formatting';
import { StatRow } from './StatRow';

interface StatsGridProps {
  fields: DataField[];
}

export function StatsGrid({ fields }: StatsGridProps) {
  if (!fields || fields.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No data available for analysis
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {fields.map(field => {
        try {
          const stats = calculateFieldStats(field);
          if (!stats) return null;

          return (
            <div key={field.name} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{field.name}</h4>
              <div className="space-y-2">
                <StatRow label="Sample Size" value={stats.sampleSize?.toString() || '0'} />
                <StatRow label="Mean" value={formatNumber(stats.mean || 0)} />
                <StatRow label="Median" value={formatNumber(stats.median || 0)} />
                <StatRow label="Std Dev" value={formatNumber(stats.stdDev || 0)} />
                <StatRow label="Min" value={formatNumber(stats.min || 0)} />
                <StatRow label="Max" value={formatNumber(stats.max || 0)} />
              </div>
            </div>
          );
        } catch (error) {
          console.error(`Error calculating stats for field ${field.name}:`, error);
          return (
            <div key={field.name} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{field.name}</h4>
              <div className="text-red-500">Error calculating statistics</div>
            </div>
          );
        }
      })}
    </div>
  );
}
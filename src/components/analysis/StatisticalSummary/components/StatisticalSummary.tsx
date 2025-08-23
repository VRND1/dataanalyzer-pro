import { Calculator, TrendingUp } from 'lucide-react';
import type { DataField } from '@/types/data';
import { StatsSummary } from './StatsSummary';

interface StatisticalSummaryProps {
  data: {
    fields: DataField[];
  };
  statistics?: {
    mean: Record<string, number>;
    median: Record<string, number>;
    standardDeviation: Record<string, number>;
    correlations: Record<string, number>;
  };
}

export function StatisticalSummary({ data, statistics }: StatisticalSummaryProps) {
  const numericFields = data.fields.filter(f => f.type === 'number');

  if (numericFields.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-black-600" />
        <h3 className="text-lg font-semibold text-black">Statistical Analysis</h3>
      </div>

      {/* Dataset Summary */}
      <div className="mb-8">
        <StatsSummary fields={numericFields} />
      </div>

      {/* Individual Field Statistics */}
      {/* Removed duplicate */}

      {/* Correlations Section */}
      {statistics?.correlations && Object.keys(statistics.correlations).length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-indigo-600" />
            <h3 className="text-lg font-semibold">Correlations</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(statistics.correlations)
              .filter(([_, value]) => Math.abs(value) > 0.5)
              .map(([key, value]) => {
                const [field1, field2] = key.split('_');
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-gray-600">
                      {field1} vs {field2}
                    </span>
                    <span className={`font-medium ${
                      value > 0.7 ? 'text-green-600' :
                      value < -0.7 ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {value.toFixed(2)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatisticalSummary;
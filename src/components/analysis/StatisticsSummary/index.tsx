import React from 'react';

interface StatisticsSummaryProps {
  statistics: {
    mean: Record<string, number>;
    median: Record<string, number>;
    standardDeviation: Record<string, number>;
    correlations: Record<string, number>;
  };
}

const StatisticsSummary: React.FC<StatisticsSummaryProps> = ({ statistics }) => {
  const fields = Object.keys(statistics.mean);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Statistical Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field} className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">{field}</h4>
            <div className="space-y-1 text-sm">
              <p>Mean: {statistics.mean[field].toFixed(2)}</p>
              <p>Median: {statistics.median[field].toFixed(2)}</p>
              <p>Std Dev: {statistics.standardDeviation[field].toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatisticsSummary; 
import React from 'react';
import { DataField } from '@/types/data';

interface BusinessMetricsProps {
  data: {
    fields: DataField[];
  };
}

export const BusinessMetrics: React.FC<BusinessMetricsProps> = ({ data }) => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Business Metrics</h2>
      <div className="text-gray-600">
        {data.fields.length > 0 ? (
          <p>Metrics analysis will be displayed here</p>
        ) : (
          <p>No data available for metrics analysis</p>
        )}
      </div>
    </div>
  );
}; 
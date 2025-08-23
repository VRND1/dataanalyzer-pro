import React from 'react';
import { DataField } from '@/types/data';

interface OverviewProps {
  data: {
    fields: DataField[];
  };
}

export const Overview: React.FC<OverviewProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Data Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.fields.map((field, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">{field.name}</h3>
            <p className="text-sm text-gray-600">
              Type: {field.type}
              {Array.isArray(field.value) && (
                <span> • {field.value.length} values</span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}; 
import React from 'react';

interface TimeSeriesAnalysisProps {
  data: Array<{
    timestamp: number;
    value: number;
    field: string;
  }>;
}

const TimeSeriesAnalysis: React.FC<TimeSeriesAnalysisProps> = ({ data }) => {
  const fields = [...new Set(data.map(item => item.field))];

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const fieldData = data.filter(item => item.field === field);
        return (
          <div key={field} className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">{field}</h4>
            <div className="space-y-1 text-sm">
              <p>Data Points: {fieldData.length}</p>
              <p>Time Range: {new Date(fieldData[0].timestamp).toLocaleDateString()} - {new Date(fieldData[fieldData.length - 1].timestamp).toLocaleDateString()}</p>
              <p>Values: {fieldData.map(d => d.value.toFixed(2)).join(', ')}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimeSeriesAnalysis; 
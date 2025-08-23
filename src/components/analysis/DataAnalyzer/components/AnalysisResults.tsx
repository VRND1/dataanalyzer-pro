import React from 'react';

interface AnalysisResultsProps {
  data?: any;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ data }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
      <div className="space-y-4">
        {data ? (
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <p>No data available</p>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults; 
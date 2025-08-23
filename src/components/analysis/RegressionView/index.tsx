import React from 'react';

interface RegressionViewProps {
  results: Array<{
    field: string;
    coefficients: number[];
    intercept: number;
    rSquared: number;
    predictions: number[];
    equation: string;
  }>;
}

const RegressionView: React.FC<RegressionViewProps> = ({ results }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Regression Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((result, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">{result.field}</h4>
            <div className="space-y-1 text-sm">
              <p>R² Score: {(result.rSquared * 100).toFixed(2)}%</p>
              <p>Equation: {result.equation}</p>
              <p>Intercept: {result.intercept.toFixed(4)}</p>
              <p>Coefficients: {result.coefficients.map(c => c.toFixed(4)).join(', ')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegressionView; 